import { useState, useEffect, useRef } from "react";

export function usePlaybackSync(isPlaying: boolean, progressMs: number, maxMs: number) {
  const [currentTime, setCurrentTime] = useState(progressMs / 1000);
  const lastSyncRef = useRef({ time: Date.now(), progressMs });

  useEffect(() => {
    // Sync with Spotify server state
    setCurrentTime(progressMs / 1000);
    lastSyncRef.current = { time: Date.now(), progressMs };
  }, [progressMs]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSinceSync = now - lastSyncRef.current.time;
      let newTime = (lastSyncRef.current.progressMs + elapsedSinceSync) / 1000;
      
      if (maxMs && newTime * 1000 > maxMs) {
        newTime = maxMs / 1000;
      }
      
      setCurrentTime(newTime);
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying, maxMs]);

  return currentTime;
}
