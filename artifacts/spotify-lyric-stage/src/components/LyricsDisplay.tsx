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
  const activeRef    = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(-1);

  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (adjustedTime >= lyrics[i].time) { activeIndex = i; break; }
  }

  // Smooth scroll — only when index changes
  useEffect(() => {
    if (activeIndex === prevIndexRef.current) return;
    prevIndexRef.current = activeIndex;
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const el = activeRef.current;
      const target = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2;
      container.scrollTo({ top: target, behavior: "smooth" });
    }
  }, [activeIndex]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
          <span className="text-white/20 text-xs tracking-[0.2em] uppercase font-light">Loading lyrics</span>
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

  // ── Word / Karaoke mode ──
  if (mode === "word") {
    const line       = activeIndex >= 0 ? lyrics[activeIndex] : null;
    const nextLine   = activeIndex >= 0 ? lyrics[activeIndex + 1] : null;
    const lineDur    = line && nextLine ? nextLine.time - line.time : 5;
    const words      = line ? line.text.trim().split(/\s+/).filter(Boolean) : [];
    const timeInLine = line ? Math.max(0, adjustedTime - line.time) : 0;
    const wordIdx    = Math.min(Math.floor((timeInLine / lineDur) * words.length), words.length - 1);

    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-8 gap-6 overflow-hidden">
        {activeIndex > 0 && (
          <p className="text-white/22 text-center font-light leading-relaxed"
            style={{ fontSize: `${fontSize * 0.55}rem`, transition: "opacity 0.5s ease" }}>
            {lyrics[activeIndex - 1].text}
          </p>
        )}

        <AnimatePresence mode="wait">
          {line ? (
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center justify-center"
              style={{ gap: `0.2em 0.5em`, maxWidth: "88%" }}
            >
              {words.map((word, i) => {
                const isPast    = i < wordIdx;
                const isCurrent = i === wordIdx;
                return (
                  <WordSpan
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
            <motion.span
              key="wait"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-white/15 text-sm tracking-widest">♪</motion.span>
          )}
        </AnimatePresence>

        {activeIndex >= 0 && lyrics[activeIndex + 1] && (
          <p className="text-white/15 text-center font-light leading-relaxed"
            style={{ fontSize: `${fontSize * 0.55}rem`, transition: "opacity 0.5s ease" }}>
            {lyrics[activeIndex + 1].text}
          </p>
        )}
      </div>
    );
  }

  // ── Line mode — smooth glow, no size jump ──
  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto"
      style={{ scrollbarWidth: "none", padding: "0 clamp(20px, 5vw, 56px)" }}
    >
      <div style={{ height: "46%" }} />

      {lyrics.map((line, idx) => {
        const isActive = idx === activeIndex;
        const dist     = Math.abs(idx - activeIndex);

        // Opacity only — no size jump
        let opacity = 0.12;
        if (isActive)       opacity = 1;
        else if (dist === 1) opacity = 0.42;
        else if (dist === 2) opacity = 0.24;
        else if (dist === 3) opacity = 0.15;

        return (
          <div
            key={idx}
            ref={isActive ? activeRef : undefined}
            style={{ padding: "6px 0" }}
          >
            <div
              className="leading-snug select-none cursor-default"
              style={{
                fontSize: `${fontSize}rem`,
                fontWeight: isActive ? 700 : 400,
                opacity,
                color: isActive
                  ? "var(--extracted-primary, #ffffff)"
                  : "rgba(255,255,255,0.95)",
                textShadow: isActive
                  ? `0 0 20px var(--extracted-primary, rgba(255,255,255,0.5)),
                     0 0 50px var(--extracted-primary, rgba(255,255,255,0.12)),
                     0 2px 12px rgba(0,0,0,0.9)`
                  : "none",
                transition:
                  "opacity 0.5s ease, font-weight 0.4s ease, color 0.5s ease, text-shadow 0.5s ease",
              }}
            >
              {line.text || "♪"}
            </div>
          </div>
        );
      })}

      <div style={{ height: "46%" }} />
    </div>
  );
}

// ── Word span — subtle glow highlight, no bounce ──
function WordSpan({ word, isPast, isCurrent, fontSize }: {
  word: string; isPast: boolean; isCurrent: boolean; fontSize: number;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: `${fontSize}rem`,
        fontWeight: isCurrent ? 700 : isPast ? 500 : 400,
        color: isCurrent
          ? "var(--extracted-primary, #ffffff)"
          : isPast
          ? "rgba(255,255,255,0.45)"
          : "rgba(255,255,255,0.18)",
        textShadow: isCurrent
          ? `0 0 18px var(--extracted-primary, rgba(255,255,255,0.6)),
             0 0 45px var(--extracted-primary, rgba(255,255,255,0.18))`
          : "none",
        transition:
          "color 0.35s ease, font-weight 0.3s ease, text-shadow 0.35s ease",
        lineHeight: 1.4,
      }}
    >
      {word}
    </span>
  );
}
