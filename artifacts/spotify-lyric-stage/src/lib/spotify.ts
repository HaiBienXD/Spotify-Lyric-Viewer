import { generateRandomString, generateCodeChallenge } from "./pkce";

const SCOPES = "user-read-currently-playing user-read-playback-state user-read-recently-played";
const DEFAULT_CLIENT_ID = "0b0dd397bce54d04af1df5bcada7904e";

function getClientId(): string {
  return import.meta.env.VITE_SPOTIFY_CLIENT_ID || DEFAULT_CLIENT_ID;
}

function getRedirectUri(): string {
  // 1. Explicit env var (highest priority)
  if (import.meta.env.VITE_SPOTIFY_REDIRECT_URI) return import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  // 2. User-saved override via UI (saved to localStorage)
  const override = window.localStorage.getItem("spotify_redirect_uri_override");
  if (override) return override;
  // 3. Replit dev domain (injected at build time — works in the Replit editor preview)
  const replitDomain = import.meta.env.VITE_REPLIT_DEV_DOMAIN;
  if (replitDomain) return `https://${replitDomain}`;
  // 4. Fallback: real window origin (works correctly in production/deployed)
  return window.location.origin;
}

export function getCurrentRedirectUri(): string {
  return getRedirectUri();
}

export function saveClientId(clientId: string) {
  window.localStorage.setItem("spotify_client_id", clientId);
}

export async function redirectToSpotifyLogin() {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error("VITE_SPOTIFY_CLIENT_ID is not set and no client ID found in localStorage.");
  }

  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);

  window.localStorage.setItem("spotify_code_verifier", verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeToken(code: string) {
  const clientId = getClientId();
  const verifier = window.localStorage.getItem("spotify_code_verifier");

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier || "",
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error_description || "Failed to exchange token");
  }

  const data = await response.json();
  saveTokens(data);
  return data;
}

export async function refreshAccessToken() {
  const storedRefreshToken = window.localStorage.getItem("spotify_refresh_token");
  if (!storedRefreshToken) throw new Error("No refresh token");

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

  if (!response.ok) throw new Error("Failed to refresh token");
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
