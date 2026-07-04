# 🎵 Spotify Lyric Stage

A stunning, high-fidelity Spotify real-time lyrics visualizer and player with premium layouts, smooth animations, audio features, and track discovery.

---

## ✨ Features

- **📺 responsive Landscape View (QQ Music Style)**: Aspect-ratio adaptive layout that transforms the screen into a split horizontal canvas on desktop/widescreen, matching premium music players.
- **💿 Rotating Vinyl Disc with Album Art Cross-Fades**: A beautiful, realistic rotating record with shine reflections and smooth, gradual fading transitions between album art when changing tracks.
- **🕹️ Animated Metal SVG Tonearm/Needle**: An interactive playback needle that rotates onto the rotating vinyl disc when active and lifts/swings back to rest when playback is paused.
- **🔥 BPM Beat-Sync Lyric Pulsing**: active word spring-scaling animations and colorful glowing neon shadows that pulse in perfect sync with the song's audio beat.
- **⚡ Multiple Canvas Visualizers**: sound rings, ripples, particle storms, DNA helix, and stargaze effects.
- **📺 Picture-in-Picture Canvas Streamer**: streams lyrics to a native browser PiP video window so you can view synced lyrics while multitasking.
- **≡ Upgraded Queue & Playlist Manager**:
  - **Next Up**: Lists upcoming tracks in the queue, with auto-deduplication of consecutive identical items.
  - **Suggest**: Instantly displays 10 recommended songs based on the currently playing track's attributes.
  - **Search**: Features a debounced search bar to search Spotify's catalog and play any track instantly.

---

## 🛠️ Stack & Architecture

- **Monorepo**: Managed with `pnpm` workspaces.
- **Frontend**: React, Vite, TypeScript, TailwindCSS, and Framer Motion.
- **Backend API**: Express 5 serving endpoints for queue management, auth callback, and static assets.
- **Hosting Integration**: Vite frontend files are compiled and copied directly to the backend's distribution public folder, allowing single-port hosting (port `5000`) for seamless cloud deployments (e.g. Render.com).

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 22+
- `pnpm` (`npm install -g pnpm`)

### Setup & Launch

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure Spotify App**:
   Create a Spotify Developer Application and register your Redirect URI:
   `http://HOSTING:5000/api/spotify/callback`

3. **Set Environment Variables**:
   Create a `.env` file in the root directory (or inject variables via your cloud dashboard):
   ```env
   PORT=5000
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   ```

4. **Build the Monorepo**:
   Compiles frontend assets and merges them into the backend server directory:
   ```bash
   pnpm run build
   ```

5. **Start the Integrated Server**:
   ```bash
   pnpm start
   ```
   Open `http://localhost:5000` in your web browser.
