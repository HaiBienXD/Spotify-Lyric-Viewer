import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { LyricLine } from "../lib/lrcParser";

export type LyricsMode = "line" | "word";

// Show lyrics earlier so they match the singer
const LYRIC_OFFSET = 0.8;

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  fontSize: number;
  isLoading: boolean;
  error: string | null;
  mode?: LyricsMode;
}

export default function LyricsDisplay({
  lyrics, currentTime, fontSize, isLoading, error, mode = "line",
}: LyricsDisplayProps) {
  const adjustedTime = currentTime + LYRIC_OFFSET;
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (adjustedTime >= lyrics[i].time) { activeIndex = i; break; }
  }

  // Auto-scroll to active line
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const active = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      const targetScroll = active.offsetTop - container.offsetHeight / 2 + activeRect.height / 2;

      container.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
          <span className="text-white/30 text-xs tracking-widest uppercase">Loading lyrics</span>
        </div>
      </div>
    );
  }

  if (error || lyrics.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-white/25 text-sm tracking-wide">No lyrics found</p>
      </div>
    );
  }

  // ── Word-by-word mode ──
  if (mode === "word") {
    const line = activeIndex >= 0 ? lyrics[activeIndex] : null;
    const nextLine = activeIndex >= 0 ? lyrics[activeIndex + 1] : null;
    const lineDuration = line && nextLine ? nextLine.time - line.time : 5;
    const words = line ? line.text.split(/\s+/).filter(Boolean) : [];
    const timeInLine = line ? Math.max(0, adjustedTime - line.time) : 0;
    const wordIndex = words.length ? Math.min(Math.floor((timeInLine / lineDuration) * words.length), words.length - 1) : 0;

    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-8 gap-4">
        {activeIndex > 0 && (
          <motion.p
            key={`prev-${activeIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/15 text-center"
            style={{ fontSize: `${fontSize * 0.6}rem` }}
          >
            {lyrics[activeIndex - 1].text}
          </motion.p>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 max-w-3xl"
          >
            {words.map((word, i) => {
              const isPast = i < wordIndex;
              const isCurrent = i === wordIndex;
              return (
                <motion.span
                  key={`${activeIndex}-${i}`}
                  animate={{
                    opacity: isPast ? 0.4 : isCurrent ? 1 : 0.15,
                    scale: isCurrent ? 1.08 : isPast ? 0.92 : 0.82,
                    color: isCurrent ? "var(--extracted-primary, #fff)" : "#fff",
                  }}
                  transition={{ duration: 0.25, type: "spring", damping: 20 }}
                  className="inline-block leading-tight select-none"
                  style={{
                    fontSize: `${fontSize * (isCurrent ? 1.1 : 0.85)}rem`,
                    fontWeight: isCurrent ? 800 : 500,
                    textShadow: isCurrent
                      ? "0 0 40px var(--extracted-primary, rgba(255,255,255,0.4))"
                      : "none",
                  }}
                >
                  {word}
                </motion.span>
              );
            })}
          </motion.div>
        </AnimatePresence>
        {activeIndex >= 0 && lyrics[activeIndex + 1] && (
          <motion.p
            key={`next-${activeIndex}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/10 text-center"
            style={{ fontSize: `${fontSize * 0.6}rem` }}
          >
            {lyrics[activeIndex + 1].text}
          </motion.p>
        )}
      </div>
    );
  }

  // ── Line mode — scrollable container with auto-scroll ──
  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto px-6 md:px-16"
      style={{ scrollbarWidth: "none", scrollBehavior: "smooth" }}
    >
      {/* Top padding to center first line */}
      <div style={{ height: "45%" }} />

      {lyrics.map((line, idx) => {
        const isActive = idx === activeIndex;
        const isPast = idx < activeIndex;
        const distance = Math.abs(idx - activeIndex);

        // Opacity based on distance from active
        let opacity = 0.12;
        if (isActive) opacity = 1;
        else if (distance === 1) opacity = 0.4;
        else if (distance === 2) opacity = 0.22;
        else if (distance === 3) opacity = 0.15;

        const scale = isActive ? 1.0 : distance === 1 ? 0.92 : 0.85;
        const weight = isActive ? 700 : distance <= 1 ? 500 : 400;
        const sizeMultiplier = isActive ? 1.0 : distance === 1 ? 0.85 : 0.72;

        return (
          <div
            key={idx}
            ref={isActive ? activeRef : undefined}
            className="w-full flex items-center justify-center py-2"
          >
            <motion.div
              animate={{
                opacity,
                scale,
                y: 0,
                color: isActive
                  ? "var(--extracted-primary, #ffffff)"
                  : "rgba(255,255,255,0.8)",
              }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="w-full text-center leading-snug select-none cursor-default"
              style={{
                fontSize: `${fontSize * sizeMultiplier}rem`,
                fontWeight: weight,
                textShadow: isActive
                  ? "0 0 40px var(--extracted-primary, rgba(255,255,255,0.3)), 0 4px 24px rgba(0,0,0,0.9)"
                  : "none",
                letterSpacing: isActive ? "-0.01em" : "0",
                transition: "font-size 0.35s ease, font-weight 0.35s ease",
              }}
            >
              {line.text || "♪"}
            </motion.div>
          </div>
        );
      })}

      {/* Bottom padding to center last line */}
      <div style={{ height: "45%" }} />
    </div>
  );
}
