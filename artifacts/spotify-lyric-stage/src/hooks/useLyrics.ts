import { useState, useEffect } from "react";
import { parseLrc, LyricLine } from "../lib/lrcParser";

export function useLyrics(artist: string | undefined, trackName: string | undefined, albumName: string | undefined) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artist || !trackName) {
      setLyrics([]);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);

    const fetchLyrics = async () => {
      try {
        const params = new URLSearchParams({
          artist_name: artist,
          track_name: trackName,
        });
        if (albumName) params.append("album_name", albumName);

        const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
        if (!res.ok) throw new Error("Lyrics not found");
        
        const data = await res.json();
        
        if (!mounted) return;

        if (data.syncedLyrics) {
          setLyrics(parseLrc(data.syncedLyrics));
        } else if (data.plainLyrics) {
          // Fake timestamps for plain lyrics
          const lines = data.plainLyrics.split("\n");
          setLyrics(lines.map((text: string, i: number) => ({ time: i * 5, text })));
        } else {
          setLyrics([]);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Error fetching lyrics");
          setLyrics([]);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchLyrics();

    return () => {
      mounted = false;
    };
  }, [artist, trackName, albumName]);

  return { lyrics, isLoading, error };
}
