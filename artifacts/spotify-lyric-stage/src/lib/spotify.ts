import { generateRandomString, generateCodeChallenge } from "./pkce";

const SCOPES = "user-read-currently-playing user-read-playback-state user-read-recently-played user-modify-playback-state";
const DEFAULT_CLIENT_ID = "0b0dd397bce54d04af1df5bcada7904e";

function getClientId(): string {
  return import.meta.env.VITE_SPOTIFY_CLIENT_ID || DEFAULT_CLIENT_ID;
}

function getRedirectUri(): string {
  // 1. Explicit env var (highest priority)
  if (import.meta.env.VITE_SPOTIFY_REDIRECT_URI) return import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  // 2. User-saved override via UI
  const override = window.localStorage.getItem("spotify_redirect_uri_override");
  if (override) return override;
  // 3. Always use the backend /api/spotify/callback path — this is a fixed, predictable
  //    route served by the API server at the same origin as the frontend. The backend
  //    simply redirects back to /?code=...&state=... so the frontend can finish the PKCE flow.
  //    In dev the Replit preview proxies everything through the same domain, so
  //    window.location.origin correctly resolves to the dev domain.
  return "https://spotify-lyric-viewer.onrender.com/api/spotify/callback";
}

export function getCurrentRedirectUri(): string {
  return getRedirectUri();
}

export function saveRedirectUriOverride(uri: string) {
  window.localStorage.setItem("spotify_redirect_uri_override", uri.trim().replace(/\/$/, ""));
}

export function clearRedirectUriOverride() {
  window.localStorage.removeItem("spotify_redirect_uri_override");
}

/** Build the full Spotify authorization URL without navigating — useful for debugging. */
export async function buildSpotifyAuthUrl(): Promise<{ url: string; redirectUri: string; verifier: string }> {
  const clientId = getClientId();
  const redirectUri = getRedirectUri();
  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);
  const state = generateRandomString(16);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
  });

  return {
    url: `https://accounts.spotify.com/authorize?${params.toString()}`,
    redirectUri,
    verifier,
  };
}

export async function redirectToSpotifyLogin() {
  const clientId = getClientId();
  if (!clientId) throw new Error("No Spotify Client ID configured.");

  const { url, verifier } = await buildSpotifyAuthUrl();
  window.localStorage.setItem("spotify_code_verifier", verifier);
  window.location.href = url;
}

export async function exchangeToken(code: string, state?: string) {
  // Validate state if present
  const savedState = window.localStorage.getItem("spotify_oauth_state");
  if (state && savedState && state !== savedState) {
    throw new Error("OAuth state mismatch — possible CSRF attack.");
  }
  window.localStorage.removeItem("spotify_oauth_state");

  const clientId = getClientId();
  const verifier = window.localStorage.getItem("spotify_code_verifier");
  const redirectUri = getRedirectUri();

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier || "",
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error_description || err.error || "Failed to exchange token");
  }

  const data = await response.json();
  saveTokens(data);
  return data;
}

export async function refreshAccessToken() {
  const storedRefreshToken = window.localStorage.getItem("spotify_refresh_token");
  if (!storedRefreshToken) {
    clearTokens();
    throw new Error("No refresh token");
  }

  const clientId = getClientId();

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: storedRefreshToken,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) {
    clearTokens();
    throw new Error("Failed to refresh token");
  }
  const data = await response.json();
  saveTokens(data);
  return data;
}

function saveTokens(data: Record<string, unknown>) {
  if (data.access_token) window.localStorage.setItem("spotify_access_token", String(data.access_token));
  if (data.refresh_token) window.localStorage.setItem("spotify_refresh_token", String(data.refresh_token));
  if (data.expires_in) {
    const expiry = Date.now() + Number(data.expires_in) * 1000;
    window.localStorage.setItem("spotify_token_expiry", expiry.toString());
  }
}

export function getAccessToken() {
  return window.localStorage.getItem("spotify_access_token");
}

export function clearTokens() {
  window.localStorage.removeItem("spotify_access_token");
  window.localStorage.removeItem("spotify_refresh_token");
  window.localStorage.removeItem("spotify_token_expiry");
  window.localStorage.removeItem("spotify_code_verifier");
  window.localStorage.removeItem("spotify_oauth_state");
}

let retryAfter = 0;

export async function fetchSpotifyApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  if (Date.now() < retryAfter) {
    await new Promise((r) => setTimeout(r, retryAfter - Date.now()));
  }

  let token = getAccessToken();
  const expiry = window.localStorage.getItem("spotify_token_expiry");
  if (!token) throw new Error("No token");

  if (expiry && Date.now() > parseInt(expiry, 10) - 30_000) {
    await refreshAccessToken();
    token = getAccessToken();
  }

  const doFetch = (t: string | null) =>
    fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${t}` },
    });

  let res = await doFetch(token);

  if (res.status === 429) {
    const wait = parseInt(res.headers.get("Retry-After") || "5", 10) * 1000;
    retryAfter = Date.now() + wait;
    await new Promise((r) => setTimeout(r, wait));
    res = await doFetch(token);
  }

  if (res.status === 401) {
    await refreshAccessToken();
    token = getAccessToken();
    res = await doFetch(token);
  }

  return res;
}

export async function controlPlayback(action: "play" | "pause" | "next" | "previous") {
  if (action === "next") return fetchSpotifyApi("/me/player/next", { method: "POST" });
  if (action === "previous") return fetchSpotifyApi("/me/player/previous", { method: "POST" });
  if (action === "play") return fetchSpotifyApi("/me/player/play", { method: "PUT" });
  if (action === "pause") return fetchSpotifyApi("/me/player/pause", { method: "PUT" });
  return Promise.reject(new Error("Invalid playback action"));
}

export async function fetchAudioFeatures(trackId: string) {
  const res = await fetchSpotifyApi(`/audio-features/${trackId}`);
  if (res.ok) return res.json();
  return null;
}

export async function fetchQueue() {
  const res = await fetchSpotifyApi("/me/player/queue");
  if (res.ok) return res.json();
  return null;
}

export async function setShuffleState(state: boolean) {
  return fetchSpotifyApi(`/me/player/shuffle?state=${state}`, { method: "PUT" });
}

export async function setRepeatMode(mode: "off" | "track" | "context") {
  return fetchSpotifyApi(`/me/player/repeat?state=${mode}`, { method: "PUT" });
}

export async function playTrack(trackUri: string) {
  return fetchSpotifyApi("/me/player/play", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uris: [trackUri] }),
  });
}

export async function getRecommendations(seedTrackId: string) {
  const res = await fetchSpotifyApi(`/recommendations?seed_tracks=${seedTrackId}&limit=10`);
  if (res.ok) return res.json();
  return null;
}

export async function searchTracks(query: string) {
  const res = await fetchSpotifyApi(`/search?q=${encodeURIComponent(query)}&type=track&limit=15`);
  if (res.ok) return res.json();
  return null;
}
