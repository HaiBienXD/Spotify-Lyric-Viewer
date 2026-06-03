---
name: Spotify redirect URI
description: How to avoid the persistent redirect_uri mismatch error in Spotify PKCE OAuth on Replit.
---

## The rule
Use a **backend passthrough route** (`/api/spotify/callback`) as the redirect URI, never compute it at build time or use `window.location.origin` directly.

## Why
- `window.location.origin` in the Replit preview pane returns `http://localhost`, not the dev domain.
- Baking in `VITE_REPLIT_DEV_DOMAIN` at build time makes the production bundle send the dev domain to Spotify.
- Both problems cause "redirect_uri: Not matching configuration" errors.

## How to apply
1. Backend route `GET /api/spotify/callback` reads `?code=&state=` and redirects to `/?code=&state=` (passthrough to frontend).
2. Frontend always uses `window.location.origin + '/api/spotify/callback'` as the redirect URI — computed at runtime in the browser, always the correct public URL.
3. User registers exactly `https://their-app.replit.app/api/spotify/callback` in Spotify Developer Dashboard once.
4. Works in both dev and prod because both frontend and API server are served from the same origin.
