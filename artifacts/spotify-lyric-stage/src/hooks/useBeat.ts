import { useState, useEffect, useRef } from "react";

export function useBeat(bpm: number, isPlaying: boolean) {
  const [beat, setBeat] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isPlaying || bpm <= 0) return;
    const interval = Math.round(60000 / bpm);
    timerRef.current = setInterval(() => setBeat(b => b + 1), interval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [bpm, isPlaying]);

  return beat;
}
