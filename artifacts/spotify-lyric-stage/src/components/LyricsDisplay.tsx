import { motion, AnimatePresence } from "framer-motion";
import { LyricLine } from "../lib/lrcParser";
import { useEffect, useRef, useState } from "react";

export type LyricsMode = "normal" | "word";

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  fontSize: number;
  isLoading: boolean;
  error: string | null;
  mode?: LyricsMode;
}

export default function LyricsDisplay({
  lyrics, currentTime, fontSize, isLoading, error, mode = "normal",
}: LyricsDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) { activeIndex = i; break; }
  }

  // Scroll fix: getBoundingClientRect so it works regardless of DOM hierarchy
  useEffect(() => {
    if (mode !== "normal") return;
    const scroller = scrollRef.current;
    const activeLine = activeRef.current;
    if (!scroller || !activeLine) return;
    const sRect = scroller.getBoundingClientRect();
    const lRect = activeLine.getBoundingClientRect();
    const delta = (lRect.top - sRect.top + lRect.height / 2) - sRect.height / 2;
    scroller.scrollTo({ top: scroller.scrollTop + delta, behavior: "smooth" });
  }, [activeIndex, mode]);

  // ── Word-by-word mode ──
  const [wordIndex, setWordIndex] = useState(0);
  const [wordKey, setWordKey] = useState(0);
  const prevLineIndex = useRef(-1);

  useEffect(() => {
    if (mode !== "word" || activeIndex < 0) return;

    const line = lyrics[activeIndex];
    const nextLine = lyrics[activeIndex + 1];
    const lineDuration = nextLine ? (nextLine.time - line.time) : 5;
    const words = line.text.split(/\s+/).filter(Boolean);
    if (!words.length) return;

    const timeInLine = Math.max(0, currentTime - line.time);
    const idx = Math.min(Math.floor((timeInLine / lineDuration) * words.length), words.length - 1);

    if (activeIndex !== prevLineIndex.current) {
      prevLineIndex.current = activeIndex;
      setWordIndex(0);
      setWordKey(k => k + 1);
    } else {
      setWordIndex(idx);
    }
  }, [currentTime, activeIndex, lyrics, mode]);

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

  // ── Word mode render ──
  if (mode === "word") {
    const line = activeIndex >= 0 ? lyrics[activeIndex] : null;
    const words = line ? line.text.split(/\s+/).filter(Boolean) : [];

    return (
      <div className="w-full h-full flex items-center justify-center px-8">
        <div className="text-center">
          {/* Line context (small, above) */}
          {activeIndex > 0 && (
            <p className="text-white/15 text-sm mb-6 tracking-wide">
              {lyrics[activeIndex - 1]?.text}
            </p>
          )}
          {/* Words */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <AnimatePresence mode="popLayout">
              {words.map((word, i) => {
                const isPast = i < wordIndex;
                const isCurrent = i === wordIndex;
                const isFuture = i > wordIndex;
                return (
                  <motion.span
                    key={`${wordKey}-${i}`}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{
                      opacity: isPast ? 0.4 : isCurrent ? 1 : 0.18,
                      scale: isCurrent ? 1 : isPast ? 0.88 : 0.78,
                      y: 0,
                      color: isCurrent ? "var(--extracted-primary, #fff)" : "#fff",
                    }}
                    transition={{ duration: 0.3, type: "spring", damping: 18 }}
                    className="inline-block leading-tight select-none"
                    style={{
                      fontSize: `${fontSize * (isCurrent ? 1.15 : 0.85)}rem`,
                      fontWeight: isCurrent ? 800 : 500,
                      textShadow: isCurrent
                        ? "0 0 40px var(--extracted-primary, rgba(255,255,255,0.4)), 0 4px 20px rgba(0,0,0,0.8)"
                        : "none",
                      letterSpacing: isCurrent ? "-0.02em" : "0",
                    }}
                  >
                    {word}
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>
          {/* Next line preview */}
          {activeIndex >= 0 && lyrics[activeIndex + 1] && (
            <p className="text-white/12 text-sm mt-6 tracking-wide">
              {lyrics[activeIndex + 1].text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Normal mode render ──
  const getStyle = (dist: number) => {
    if (dist === 0) return { opacity: 1, scale: 1.04, color: "var(--extracted-primary, #ffffff)" };
    if (dist === 1) return { opacity: 0.6, scale: 1.0, color: "rgba(255,255,255,0.85)" };
    if (dist === 2) return { opacity: 0.35, scale: 1.0, color: "rgba(255,255,255,0.7)" };
    if (dist === 3) return { opacity: 0.2, scale: 1.0, color: "rgba(255,255,255,0.6)" };
    return { opacity: 0.1, scale: 1.0, color: "rgba(255,255,255,0.5)" };
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-x-0 top-0 h-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, var(--bg-color,#0a0a0a) 0%, transparent 100%)" }} />
      <div className="absolute inset-x-0 bottom-0 h-32 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, var(--bg-color,#0a0a0a) 0%, transparent 100%)" }} />

      <div ref={scrollRef} className="w-full h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex flex-col items-center" style={{ paddingTop: "48%", paddingBottom: "48%" }}>
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
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full text-center px-6 md:px-10 leading-snug select-none cursor-default"
                style={{
                  fontSize: `${fontSize * (isActive ? 1 : 0.93)}rem`,
                  fontWeight: isActive ? 700 : 500,
                  paddingTop: isActive ? "0.55rem" : "0.38rem",
                  paddingBottom: isActive ? "0.55rem" : "0.38rem",
                  textShadow: isActive
                    ? "0 0 32px var(--extracted-primary, rgba(255,255,255,0.25)), 0 2px 12px rgba(0,0,0,0.9)"
                    : "none",
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
