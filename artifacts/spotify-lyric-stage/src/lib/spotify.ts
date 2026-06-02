import { generateRandomString, generateCodeChallenge } from "./pkce";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin;

const SCOPES = "user-read-currently-playing user-read-playback-state user-read-recently-played";

export async function redirectToSpotifyLogin() {
  if (!CLIENT_ID) {
    console.error("VITE_SPOTIFY_CLIENT_ID is not set.");
    return;
  }

  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);

  window.localStorage.setItem("spotify_code_verifier", verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeToken(code: string) {
  const verifier = window.localStorage.getItem("spotify_code_verifier");

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier || "",
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) throw new Error("Failed to exchange token");
  const data = await response.json();
  
  saveTokens(data);
  return data;
}

export async function refreshToken() {
  const refreshToken = window.localStorage.getItem("spotify_refresh_token");
  if (!refreshToken) throw new Error("No refresh token");

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
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

function saveTokens(data: any) {
  if (data.access_token) window.localStorage.setItem("spotify_access_token", data.access_token);
  if (data.refresh_token) window.localStorage.setItem("spotify_refresh_token", data.refresh_token);
  if (data.expires_in) {
    const expiry = Date.now() + data.expires_in * 1000;
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
}

export async function fetchSpotifyApi(endpoint: string, options: RequestInit = {}) {
  let token = getAccessToken();
  let expiry = window.localStorage.getItem("spotify_token_expiry");

  if (!token) throw new Error("No token");

  if (expiry && Date.now() > parseInt(expiry, 10)) {
    await refreshToken();
    token = getAccessToken();
  }

  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    await refreshToken();
    token = getAccessToken();
    return fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return res;
}
