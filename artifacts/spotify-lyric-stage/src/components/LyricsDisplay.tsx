import { motion } from "framer-motion";
import { LyricLine } from "../lib/lrcParser";
import { useEffect, useRef } from "react";

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  fontSize: number;
  isLoading: boolean;
  error: string | null;
}

export default function LyricsDisplay({
  lyrics, currentTime, fontSize, isLoading, error,
}: LyricsDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) { activeIndex = i; break; }
  }

  // Scroll active line to center using getBoundingClientRect (works regardless of DOM hierarchy)
  useEffect(() => {
    const scroller = scrollRef.current;
    const activeLine = activeRef.current;
    if (!scroller || !activeLine) return;

    const sRect = scroller.getBoundingClientRect();
    const lRect = activeLine.getBoundingClientRect();

    // Distance from line center to scroller center
    const lineCenterInScroller = lRect.top - sRect.top + lRect.height / 2;
    const delta = lineCenterInScroller - sRect.height / 2;

    scroller.scrollTo({ top: scroller.scrollTop + delta, behavior: "smooth" });
  }, [activeIndex]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
          <span className="text-white/30 text-xs tracking-widest uppercase">Loading</span>
        </div>
      </div>
    );
  }

  if (error || lyrics.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-white/25 text-base tracking-wide">No lyrics found</p>
      </div>
    );
  }

  const getStyle = (dist: number): { opacity: number; scale: number; color: string } => {
    if (dist === 0) return { opacity: 1, scale: 1.05, color: "var(--extracted-primary, #ffffff)" };
    if (dist === 1) return { opacity: 0.65, scale: 1.0, color: "rgba(255,255,255,0.85)" };
    if (dist === 2) return { opacity: 0.38, scale: 1.0, color: "rgba(255,255,255,0.7)" };
    if (dist === 3) return { opacity: 0.22, scale: 1.0, color: "rgba(255,255,255,0.6)" };
    return { opacity: 0.12, scale: 1.0, color: "rgba(255,255,255,0.5)" };
  };

  return (
    <div className="relative w-full h-full">
      {/* Fade mask top & bottom */}
      <div className="absolute inset-x-0 top-0 h-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, var(--bg-color,#0a0a0a) 0%, transparent 100%)" }} />
      <div className="absolute inset-x-0 bottom-0 h-32 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, var(--bg-color,#0a0a0a) 0%, transparent 100%)" }} />

      {/* Scrollable lyrics */}
      <div
        ref={scrollRef}
        className="w-full h-full overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex flex-col items-center" style={{ paddingTop: "50%", paddingBottom: "50%" }}>
          {lyrics.map((line, i) => {
            const dist = Math.abs(i - activeIndex);
            const isActive = i === activeIndex;
            const { opacity, scale, color } = getStyle(dist);

            return (
              <motion.div
                key={i}
                ref={isActive ? activeRef : null}
                initial={false}
                animate={{ opacity, scale, color }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full text-center px-6 md:px-12 leading-snug cursor-default select-none"
                style={{
                  fontSize: `${fontSize * (isActive ? 1 : 0.95)}rem`,
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: "Inter, sans-serif",
                  paddingTop: isActive ? "0.6rem" : "0.4rem",
                  paddingBottom: isActive ? "0.6rem" : "0.4rem",
                  textShadow: isActive ? "0 0 30px var(--extracted-primary, rgba(255,255,255,0.3)), 0 2px 12px rgba(0,0,0,0.9)" : "none",
                  letterSpacing: isActive ? "-0.01em" : "0",
                }}
              >
                {line.text || "♪"}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
