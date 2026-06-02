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

export default function LyricsDisplay({ lyrics, currentTime, fontSize, isLoading, error }: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
      break;
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    const line = activeLineRef.current;
    if (!container || !line) return;
    const containerHeight = container.clientHeight;
    const targetTop = line.offsetTop - containerHeight / 2 + line.offsetHeight / 2;
    container.scrollTo({ top: targetTop, behavior: "smooth" });
  }, [activeIndex]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          <span className="text-white/40 text-sm tracking-widest uppercase">Loading lyrics</span>
        </div>
      </div>
    );
  }

  if (error || lyrics.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/30 text-xl font-serif tracking-wide">
        No lyrics found
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto px-6 md:px-16"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div className="py-[50vh] flex flex-col items-center gap-1">
        {lyrics.map((line, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;

          return (
            <motion.div
              key={index}
              ref={isActive ? activeLineRef : null}
              initial={false}
              animate={{
                opacity: isActive ? 1 : isPast ? 0.28 : 0.45,
                scale: isActive ? 1.04 : 1,
                y: 0,
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full max-w-3xl text-center py-2.5 leading-snug cursor-default select-none"
              style={{
                fontSize: `${fontSize}rem`,
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
                color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)",
                textShadow: isActive
                  ? "0 0 40px rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.8)"
                  : "none",
                filter: isActive ? "none" : "blur(0.3px)",
              }}
            >
              {line.text}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
