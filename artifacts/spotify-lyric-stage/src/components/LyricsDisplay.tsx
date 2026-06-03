import { useRef } from "react";
import { LyricLine } from "../lib/lrcParser";

export type LyricsMode = "line" | "word";

const LYRIC_OFFSET = 0.8;
const LYRIC_FONT = "'Be Vietnam Pro', 'Noto Sans', sans-serif";

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  fontSize: number;
  isLoading: boolean;
  error: string | null;
  mode?: LyricsMode;
}

export default function LyricsDisplay({
  lyrics, currentTime, fontSize, isLoading, error, mode = "word",
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

  if (mode === "word") {
    return (
      <WordMode
        lyrics={lyrics}
        activeIndex={activeIndex}
        adjustedTime={adjustedTime}
        fontSize={fontSize}
      />
    );
  }

  return (
    <LineMode lyrics={lyrics} activeIndex={activeIndex} fontSize={fontSize} />
  );
}

function WordMode({
  lyrics, activeIndex, adjustedTime, fontSize,
}: {
  lyrics: LyricLine[];
  activeIndex: number;
  adjustedTime: number;
  fontSize: number;
}) {
  const prev = activeIndex > 0 ? lyrics[activeIndex - 1] : null;
  const curr = activeIndex >= 0 ? lyrics[activeIndex] : null;
  const next = activeIndex >= 0 && activeIndex < lyrics.length - 1 ? lyrics[activeIndex + 1] : null;

  const nextTime = next ? next.time : curr ? curr.time + 5 : 0;
  const lineDur  = curr ? Math.max(0.5, nextTime - curr.time) : 5;
  const timeInLine = curr ? Math.max(0, adjustedTime - curr.time) : 0;

  const words = curr ? curr.text.trim().split(/\s+/).filter(Boolean) : [];
  const wordIdx = words.length > 0
    ? Math.min(Math.floor((timeInLine / lineDur) * words.length), words.length - 1)
    : -1;

  const smSize  = Math.max(0.9, fontSize * 0.5);
  const xsSize  = Math.max(0.75, fontSize * 0.42);

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 clamp(20px, 6vw, 72px)",
      gap: "clamp(8px, 1.8vh, 22px)",
      overflow: "hidden",
    }}>

      {/* ── Previous line ── */}
      <SideRow
        line={prev}
        fontSize={smSize}
        xsFontSize={xsSize}
        opacity={prev ? 0.30 : 0}
      />

      {/* ── Current line — word-by-word ── */}
      <div style={{
        display: "flex", flexWrap: "wrap",
        justifyContent: "center", alignItems: "center",
        gap: "0.12em 0.42em",
        maxWidth: "100%",
        minHeight: `${fontSize * 1.45}rem`,
        fontFamily: LYRIC_FONT,
        lineHeight: 1.35,
      }}>
        {words.length > 0 ? (
          words.map((word, i) => {
            const lit     = i < wordIdx;
            const current = i === wordIdx;
            return (
              <span
                key={`${activeIndex}-${i}`}
                style={{
                  fontSize: `${fontSize}rem`,
                  fontWeight: current ? 700 : lit ? 600 : 400,
                  color: (current || lit)
                    ? "var(--extracted-primary, #ffffff)"
                    : "rgba(255,255,255,0.22)",
                  textShadow: current
                    ? `0 0 22px var(--extracted-primary, rgba(255,255,255,0.8)),
                       0 0 60px var(--extracted-primary, rgba(255,255,255,0.18)),
                       0 2px 10px rgba(0,0,0,0.8)`
                    : lit
                    ? "0 1px 6px rgba(0,0,0,0.6)"
                    : "none",
                  transition: "color 0.2s ease, text-shadow 0.2s ease",
                  display: "inline-block",
                  willChange: "color",
                }}
              >
                {word}
              </span>
            );
          })
        ) : (
          <span style={{ color: "rgba(255,255,255,0.14)", fontSize: `${fontSize * 0.6}rem`, fontFamily: LYRIC_FONT }}>
            ♪
          </span>
        )}
      </div>

      {/* ── Current line translation ── */}
      {curr?.translation && (
        <div style={{
          fontSize: `${xsSize}rem`,
          color: "rgba(255,255,255,0.45)",
          textAlign: "center",
          fontFamily: LYRIC_FONT,
          fontStyle: "italic",
          marginTop: `-${fontSize * 0.3}rem`,
          maxWidth: "90%",
          lineHeight: 1.4,
          transition: "opacity 0.4s ease",
        }}>
          {curr.translation}
        </div>
      )}

      {/* ── Next line ── */}
      <SideRow
        line={next}
        fontSize={smSize}
        xsFontSize={xsSize}
        opacity={next ? 0.22 : 0}
      />
    </div>
  );
}

function SideRow({
  line, fontSize, xsFontSize, opacity,
}: {
  line: LyricLine | null;
  fontSize: number;
  xsFontSize: number;
  opacity: number;
}) {
  return (
    <div style={{
      textAlign: "center",
      maxWidth: "88%",
      transition: "opacity 0.45s ease",
      opacity,
    }}>
      <div style={{
        fontSize: `${fontSize}rem`,
        color: "white",
        fontFamily: LYRIC_FONT,
        lineHeight: 1.45,
        fontWeight: 400,
      }}>
        {line?.text ?? ""}
      </div>
      {line?.translation && (
        <div style={{
          fontSize: `${xsFontSize}rem`,
          color: "rgba(255,255,255,0.55)",
          fontFamily: LYRIC_FONT,
          fontStyle: "italic",
          marginTop: "0.1em",
          lineHeight: 1.3,
        }}>
          {line.translation}
        </div>
      )}
    </div>
  );
}

function LineMode({
  lyrics, activeIndex, fontSize,
}: {
  lyrics: LyricLine[];
  activeIndex: number;
  fontSize: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef    = useRef<HTMLDivElement>(null);
  const prevRef      = useRef(-1);

  if (prevRef.current !== activeIndex) {
    prevRef.current = activeIndex;
    if (activeRef.current && containerRef.current) {
      const c  = containerRef.current;
      const el = activeRef.current;
      const target = el.offsetTop - c.clientHeight / 2 + el.offsetHeight / 2;
      c.scrollTo({ top: target, behavior: "smooth" });
    }
  }

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
        let opacity = 0.10;
        if (isActive)        opacity = 1;
        else if (dist === 1) opacity = 0.40;
        else if (dist === 2) opacity = 0.22;
        else if (dist === 3) opacity = 0.13;

        return (
          <div key={idx} ref={isActive ? activeRef : undefined} style={{ padding: "5px 0" }}>
            <div style={{
              fontSize: `${fontSize}rem`,
              fontFamily: LYRIC_FONT,
              fontWeight: isActive ? 700 : 400,
              opacity,
              color: isActive ? "var(--extracted-primary, #ffffff)" : "rgba(255,255,255,0.95)",
              textShadow: isActive
                ? `0 0 20px var(--extracted-primary, rgba(255,255,255,0.5)),
                   0 0 50px var(--extracted-primary, rgba(255,255,255,0.12)),
                   0 2px 12px rgba(0,0,0,0.9)`
                : "none",
              transition: "opacity 0.5s ease, font-weight 0.4s ease, text-shadow 0.5s ease",
              lineHeight: 1.45,
            }}>
              {line.text || "♪"}
            </div>
            {line.translation && isActive && (
              <div style={{
                fontSize: `${fontSize * 0.55}rem`,
                fontFamily: LYRIC_FONT,
                fontStyle: "italic",
                color: "rgba(255,255,255,0.45)",
                marginTop: "0.15em",
              }}>
                {line.translation}
              </div>
            )}
          </div>
        );
      })}
      <div style={{ height: "46%" }} />
    </div>
  );
}
