import { motion, AnimatePresence } from "framer-motion";
import { LyricLine } from "../lib/lrcParser";

export type LyricsMode = "line" | "word";

// Show lyrics 0.5s earlier so they match the singer
const LYRIC_OFFSET = 0.5;

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

  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (adjustedTime >= lyrics[i].time) { activeIndex = i; break; }
  }

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
          <p className="text-white/15 text-center" style={{ fontSize: `${fontSize * 0.6}rem` }}>
            {lyrics[activeIndex - 1].text}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 max-w-3xl">
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
        </div>
        {activeIndex >= 0 && lyrics[activeIndex + 1] && (
          <p className="text-white/10 text-center" style={{ fontSize: `${fontSize * 0.6}rem` }}>
            {lyrics[activeIndex + 1].text}
          </p>
        )}
      </div>
    );
  }

  // ── Line-jump mode (default) ── 
  // No scrolling. Show 5 slots: ±2 lines around active. Each pops in with animation.
  const slots = [-2, -1, 0, 1, 2] as const;

  const opacityMap = { "-2": 0.12, "-1": 0.35, "0": 1, "1": 0.35, "2": 0.12 };
  const scaleMap   = { "-2": 0.82, "-1": 0.90, "0": 1.0, "1": 0.90, "2": 0.82 };
  const sizeMap    = { "-2": 0.68, "-1": 0.82, "0": 1.0, "1": 0.82, "2": 0.68 };
  const weightMap  = { "-2": 400,  "-1": 500,  "0": 700, "1": 500,  "2": 400 };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-0 px-6 md:px-16">
      {slots.map(offset => {
        const idx = activeIndex + offset;
        const key = `${offset}`;
        const valid = idx >= 0 && idx < lyrics.length;
        const isActive = offset === 0;

        return (
          <div
            key={key}
            className="w-full flex items-center justify-center"
            style={{
              paddingTop: isActive ? "0.7rem" : "0.3rem",
              paddingBottom: isActive ? "0.7rem" : "0.3rem",
              minHeight: isActive ? undefined : "2.5rem",
            }}
          >
            <AnimatePresence mode="wait">
              {valid && (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: offset >= 0 ? 22 : -22, scale: 0.75 }}
                  animate={{
                    opacity: opacityMap[key as keyof typeof opacityMap],
                    scale: scaleMap[key as keyof typeof scaleMap],
                    y: 0,
                    color: isActive
                      ? "var(--extracted-primary, #ffffff)"
                      : "rgba(255,255,255,0.8)",
                  }}
                  exit={{ opacity: 0, y: offset >= 0 ? -18 : 18, scale: 0.75 }}
                  transition={{
                    duration: 0.38,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="w-full text-center leading-snug select-none"
                  style={{
                    fontSize: `${fontSize * sizeMap[key as keyof typeof sizeMap]}rem`,
                    fontWeight: weightMap[key as keyof typeof weightMap],
                    textShadow: isActive
                      ? "0 0 40px var(--extracted-primary, rgba(255,255,255,0.3)), 0 4px 24px rgba(0,0,0,0.9)"
                      : "none",
                    letterSpacing: isActive ? "-0.01em" : "0",
                  }}
                >
                  {lyrics[idx].text || "♪"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
