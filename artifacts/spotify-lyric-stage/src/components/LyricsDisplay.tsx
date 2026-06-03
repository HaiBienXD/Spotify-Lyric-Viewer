import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { LyricLine } from "../lib/lrcParser";

export type LyricsMode = "line" | "word";

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
  const prevIndexRef = useRef(-1);

  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (adjustedTime >= lyrics[i].time) { activeIndex = i; break; }
  }

  // Auto-scroll to active line — smooth center alignment
  useEffect(() => {
    if (activeIndex === prevIndexRef.current) return;
    prevIndexRef.current = activeIndex;
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const el = activeRef.current;
      const containerH = container.clientHeight;
      const elTop = el.offsetTop;
      const elH = el.offsetHeight;
      container.scrollTo({ top: elTop - containerH / 2 + elH / 2, behavior: "smooth" });
    }
  }, [activeIndex]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
          <span className="text-white/25 text-xs tracking-[0.2em] uppercase font-light">Loading lyrics</span>
        </div>
      </div>
    );
  }

  if (error || lyrics.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-white/18 text-sm tracking-widest font-light">♪ No lyrics found ♪</p>
      </div>
    );
  }

  // ── QQ Music Word / Karaoke mode ──
  if (mode === "word") {
    const line = activeIndex >= 0 ? lyrics[activeIndex] : null;
    const nextLine = activeIndex >= 0 ? lyrics[activeIndex + 1] : null;
    const lineDuration = line && nextLine ? nextLine.time - line.time : 5;
    const words = line ? line.text.trim().split(/\s+/).filter(Boolean) : [];
    const timeInLine = line ? Math.max(0, adjustedTime - line.time) : 0;
    const wordProgress = words.length ? Math.min(timeInLine / lineDuration, 1) : 0;
    const wordIndex = Math.min(Math.floor(wordProgress * words.length), words.length - 1);

    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-6 gap-5 overflow-hidden">
        {/* Prev line */}
        <AnimatePresence>
          {activeIndex > 0 && (
            <motion.p
              key={`prev-${activeIndex}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-white/20 text-center leading-relaxed font-light"
              style={{ fontSize: `${fontSize * 0.52}rem` }}
            >
              {lyrics[activeIndex - 1].text}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Active line — QQ bounce */}
        <AnimatePresence mode="wait">
          {line ? (
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-end justify-center"
              style={{ gap: `${fontSize * 0.18}rem ${fontSize * 0.35}rem`, maxWidth: "90%" }}
            >
              {words.map((word, i) => {
                const isPast = i < wordIndex;
                const isCurrent = i === wordIndex;
                return (
                  <WordBounce
                    key={`${activeIndex}-${i}`}
                    word={word}
                    isPast={isPast}
                    isCurrent={isCurrent}
                    fontSize={fontSize}
                  />
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="no-line"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/15 text-sm tracking-widest uppercase font-light"
            >
              ♪
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next line */}
        <AnimatePresence>
          {activeIndex >= 0 && lyrics[activeIndex + 1] && (
            <motion.p
              key={`next-${activeIndex}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-white/15 text-center leading-relaxed font-light"
              style={{ fontSize: `${fontSize * 0.52}rem` }}
            >
              {lyrics[activeIndex + 1].text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── QQ Music Line mode — scrollable with glow ──
  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto"
      style={{ scrollbarWidth: "none", padding: "0 clamp(16px, 5vw, 48px)" }}
    >
      <div style={{ height: "48%" }} />

      {lyrics.map((line, idx) => {
        const isActive = idx === activeIndex;
        const dist = Math.abs(idx - activeIndex);

        let opacity = 0.1;
        if (isActive)      opacity = 1;
        else if (dist === 1) opacity = 0.38;
        else if (dist === 2) opacity = 0.2;
        else if (dist === 3) opacity = 0.13;

        const sizeRem = isActive
          ? fontSize
          : dist === 1
          ? fontSize * 0.82
          : fontSize * 0.68;

        const weight = isActive ? 800 : dist <= 1 ? 500 : 400;

        return (
          <div
            key={idx}
            ref={isActive ? activeRef : undefined}
            style={{ padding: `${isActive ? 10 : 6}px 0`, transition: "padding 0.3s ease" }}
          >
            <motion.div
              animate={{ opacity, scale: isActive ? 1 : 0.97 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={`leading-snug select-none cursor-default ${isActive ? "lyric-active" : ""}`}
              style={{
                fontSize: `${sizeRem}rem`,
                fontWeight: weight,
                letterSpacing: isActive ? "-0.015em" : "0",
                color: isActive
                  ? "var(--extracted-primary, #ffffff)"
                  : "rgba(255,255,255,0.95)",
                textShadow: isActive
                  ? `0 0 24px var(--extracted-primary, rgba(255,255,255,0.5)),
                     0 0 60px var(--extracted-primary, rgba(255,255,255,0.15)),
                     0 2px 16px rgba(0,0,0,0.9)`
                  : "none",
                transition: "font-size 0.4s cubic-bezier(0.16,1,0.3,1), font-weight 0.4s ease, color 0.4s ease, text-shadow 0.4s ease",
              }}
            >
              {line.text || "♪"}
            </motion.div>
          </div>
        );
      })}

      <div style={{ height: "48%" }} />
    </div>
  );
}

// ── Word bounce component with CSS animation trigger ──
function WordBounce({ word, isPast, isCurrent, fontSize }: {
  word: string; isPast: boolean; isCurrent: boolean; fontSize: number;
}) {
  const [bounceKey, setBounceKey] = useState(0);

  useEffect(() => {
    if (isCurrent) setBounceKey(k => k + 1);
  }, [isCurrent]);

  return (
    <span
      key={bounceKey}
      className={isCurrent ? "char-bounce" : ""}
      style={{
        display: "inline-block",
        fontSize: `${fontSize * (isCurrent ? 1.1 : isPast ? 0.92 : 0.85)}rem`,
        fontWeight: isCurrent ? 800 : isPast ? 600 : 400,
        color: isCurrent
          ? "var(--extracted-primary, #ffffff)"
          : isPast
          ? "rgba(255,255,255,0.45)"
          : "rgba(255,255,255,0.18)",
        textShadow: isCurrent
          ? `0 0 20px var(--extracted-primary, rgba(255,255,255,0.6)),
             0 0 50px var(--extracted-primary, rgba(255,255,255,0.2))`
          : "none",
        transition: "color 0.25s ease, font-size 0.25s ease, font-weight 0.2s ease, text-shadow 0.3s ease",
        lineHeight: 1.3,
      }}
    >
      {word}
    </span>
  );
}
