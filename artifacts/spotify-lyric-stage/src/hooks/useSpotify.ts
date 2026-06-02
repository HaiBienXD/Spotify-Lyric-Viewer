import { useState, useEffect } from "react";
import { getAccessToken, exchangeToken } from "../lib/spotify";

export interface SpotifyPlaybackState {
  is_playing: boolean;
  item: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
      images: { url: string }[];
      name: string;
    };
    duration_ms: number;
  } | null;
  progress_ms: number;
}

export function useSpotify() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      exchangeToken(code).then(() => {
        setIsAuthenticated(true);
        window.history.replaceState({}, document.title, "/");
      }).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;

    const fetchState = async () => {
      try {
        const { fetchSpotifyApi } = await import("../lib/spotify");
        const res = await fetchSpotifyApi("/me/player/currently-playing");
        
        if (res.status === 204) {
          if (mounted) setPlaybackState(null);
          // fetch recently played
          const recentRes = await fetchSpotifyApi("/me/player/recently-played?limit=1");
          if (recentRes.ok) {
            const recentData = await recentRes.json();
            if (recentData.items && recentData.items.length > 0 && mounted) {
              setRecentlyPlayed(recentData.items[0].track);
            }
          }
        } else if (res.ok) {
          const data = await res.json();
          if (mounted) setPlaybackState(data);
        }
      } catch (err) {
        console.error("Error fetching Spotify state", err);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  return { isAuthenticated, playbackState, recentlyPlayed };
}
