import { useSpotify } from "@/hooks/useSpotify";
import { useLyrics } from "@/hooks/useLyrics";
import { usePlaybackSync } from "@/hooks/usePlaybackSync";
import { useTheme } from "@/hooks/useTheme";
import { useColorExtraction } from "@/hooks/useColorExtraction";
import LyricsDisplay from "@/components/LyricsDisplay";
import { motion, AnimatePresence } from "framer-motion";
import { useState, Component, ReactNode } from "react";
import { clearTokens } from "@/lib/spotify";
import { Theme } from "@/hooks/useTheme";

import NeonBackground from "@/components/backgrounds/NeonBackground";
import AuroraBackground from "@/components/backgrounds/AuroraBackground";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";
import CyberpunkBackground from "@/components/backgrounds/CyberpunkBackground";
import GlassBackground from "@/components/backgrounds/GlassBackground";
import AMOLEDBackground from "@/components/backgrounds/AMOLEDBackground";
import MatrixBackground from "@/components/backgrounds/MatrixBackground";
import RainBackground from "@/components/backgrounds/RainBackground";
import FireBackground from "@/components/backgrounds/FireBackground";
import MinimalBackground from "@/components/backgrounds/MinimalBackground";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error) {
      return (
        <div className="w-screen h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
          <p className="text-white/40 text-sm">Something went wrong</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="px-5 py-2 rounded-full text-sm"
            style={{ background: "var(--extracted-primary, #1DB954)", color: "#000" }}
          >Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const THEMES: Theme[] = ["Aurora","Neon","Galaxy","Glass","Minimal","Cyberpunk","AMOLED","Matrix","Rain","Fire"];
const THEME_ICONS: Record<Theme, string> = {
  Aurora:"🌌", Neon:"⚡", Galaxy:"🌠", Cyberpunk:"🤖", Glass:"💎",
  AMOLED:"🖤", Matrix:"💚", Rain:"🌧", Fire:"🔥", Minimal:"🎨",
};

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2,"0")}`;
}

const LYRIC_OFFSET = 0.8;
function getActiveIndex(lyrics: { time: number }[], t: number) {
  const adj = t + LYRIC_OFFSET;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (adj >= lyrics[i].time) return i;
  }
  return -1;
}

/* ── Polygon helper: n-sided regular polygon points, centered at (0,0) ── */
function polyPts(n: number, r: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

function LyricStageInner() {
  const { playbackState, recentlyPlayed } = useSpotify();

  const track      = playbackState?.item ?? null;
  const isPlaying  = playbackState?.is_playing ?? false;
  const progressMs = playbackState?.progress_ms ?? 0;
  const durationMs = track?.duration_ms ?? 1;

  const artistName = track?.artists[0]?.name ?? "";
  const trackName  = track?.name ?? "";
  const albumName  = track?.album.name ?? "";
  const albumArt   = track?.album.images[0]?.url;

  const { lyrics, isLoading, error } = useLyrics(artistName, trackName, albumName);
  const currentTime = usePlaybackSync(isPlaying, progressMs, durationMs);
  const { theme, setTheme, fontSize, setFontSize } = useTheme();
  useColorExtraction(albumArt);

  const activeIndex = getActiveIndex(lyrics, currentTime);

  const [cinemaMode, setCinemaMode] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  const renderBg = () => {
    switch (theme) {
      case "Neon":      return <NeonBackground />;
      case "Galaxy":    return <GalaxyBackground />;
      case "Cyberpunk": return <CyberpunkBackground />;
      case "Glass":     return <GlassBackground albumArt={albumArt} />;
      case "AMOLED":    return <AMOLEDBackground />;
      case "Matrix":    return <MatrixBackground />;
      case "Rain":      return <RainBackground />;
      case "Fire":      return <FireBackground />;
      case "Minimal":   return <MinimalBackground />;
      default:          return <AuroraBackground />;
    }
  };

  const progress = Math.min((currentTime * 1000) / durationMs, 1);

  // ── Waiting screen ──
  if (!track) {
    const rArt = recentlyPlayed?.album?.images[0]?.url;
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center text-white relative overflow-hidden">
        {rArt && (
          <div className="absolute inset-0">
            <img src={rArt} className="w-full h-full object-cover"
              style={{ filter:"blur(80px) saturate(1.8) brightness(0.2)", transform:"scale(1.15)" }} alt="" />
            <div className="absolute inset-0 bg-black/60" />
          </div>
        )}
        <div className="z-10 flex flex-col items-center gap-5">
          {rArt && (
            <div className="w-28 h-28 rounded-full overflow-hidden shadow-2xl ring-2 ring-white/10 disc-glow"
              style={{ animation:"disc-spin 20s linear infinite" }}>
              <img src={rArt} className="w-full h-full object-cover" alt="" />
            </div>
          )}
          <p className="text-white/35 text-xs tracking-[0.25em] uppercase font-light">Waiting for music…</p>
        </div>
      </div>
    );
  }

  // ── Disc size based on viewport ──
  const discSize = Math.min(220, Math.max(140, typeof window !== "undefined" ? window.innerWidth * 0.16 : 180));
  const spinRate = isPlaying ? "22s" : "60s";

  return (
    <div className="w-screen h-screen bg-[#080810] text-white overflow-hidden relative select-none flex flex-col"
      style={{ fontFamily:"Inter, sans-serif" }}>

      {/* ── Album art background ── */}
      {albumArt && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={albumArt} className="absolute inset-0 w-full h-full object-cover"
            style={{ filter:"blur(90px) saturate(1.8) brightness(0.22)", transform:"scale(1.2)" }} alt="" />
          <div className="absolute inset-0"
            style={{ background:"linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.65) 100%)" }} />
        </div>
      )}

      {/* ── Theme background ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none" style={{ opacity: 0.18 }}>
        {renderBg()}
      </div>

      {/* ── Dark overlay ── */}
      <div className="absolute inset-0 z-[2] pointer-events-none" style={{ background: "rgba(0,0,0,0.40)" }} />

      {/* ── Main content area ── */}
      <div className="relative z-[10] flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT PANEL: disc + info */}
        <AnimatePresence>
          {!cinemaMode && (
            <motion.div
              key="left-panel"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45, ease: [0.16,1,0.3,1] }}
              className="flex flex-col items-center justify-center shrink-0 gap-5 py-6"
              style={{ width: "clamp(220px, 30vw, 340px)", paddingLeft: "clamp(16px, 3vw, 40px)" }}
            >
              {/* Needle arm + Disc — geometry computed from discSize */}
              {(() => {
                const dTop = 34, dLeft = 14;
                const dCx = dLeft + discSize / 2;
                const dCy = dTop + discSize / 2;
                const pX = discSize + dLeft + 28;
                const pY = 14;
                const ta = 28 * Math.PI / 180;
                const tX = dCx + (discSize / 2) * 0.74 * Math.sin(ta);
                const tY = dCy - (discSize / 2) * 0.74 * Math.cos(ta);
                const vx = tX - pX, vy = tY - pY;
                const armLen = Math.sqrt(vx * vx + vy * vy);
                const playAng = -Math.atan2(vx, vy) * 180 / Math.PI;
                const pauseAng = playAng - 52;
                const ang = isPlaying ? playAng : pauseAng;
                const tipX = pX, tipY = pY + armLen;
                const cW = pX + 18;
                const cH = dTop + discSize + 6;
                const pr = discSize / 2 + 4;

                // Polygon rings radii (12-sided, 14-sided) — counter-rotating
                const polyRings = [
                  { n: 12, r: discSize / 2 + 10, dur: "34s", stroke: "rgba(255,255,255,0.07)", sw: 1.5 },
                  { n: 8,  r: discSize / 2 + 19, dur: "58s", stroke: "rgba(255,255,255,0.04)", sw: 1 },
                ];

                return (
                  <div style={{ position: "relative", width: cW, height: cH, flexShrink: 0 }}>

                    {/* Spinning disc */}
                    <div className="disc-glow" style={{
                      position: "absolute", top: dTop, left: dLeft,
                      width: discSize, height: discSize, borderRadius: "50%",
                      animation: `disc-spin ${spinRate} linear infinite`,
                      willChange: "transform",
                    }}>
                      {/* Vinyl base */}
                      <div style={{ position:"absolute", inset:0, borderRadius:"50%",
                        background:`radial-gradient(circle at 38% 32%, #3e3e3e 0%, #181818 38%, #1e1e1e 62%, #080808 100%)`,
                        boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.05)" }} />

                      {/* Groove rings */}
                      {[0.92, 0.82, 0.72, 0.62, 0.52].map((s, i) => (
                        <div key={i} style={{ position:"absolute", borderRadius:"50%",
                          border:"1px solid rgba(255,255,255,0.025)", inset:`${(1-s)*50}%` }} />
                      ))}

                      {/* Shine facets (da góc) — 3 highlight wedges */}
                      {[20, 140, 260].map((deg, i) => (
                        <div key={i} style={{
                          position: "absolute", inset: 0, borderRadius: "50%",
                          background: `conic-gradient(from ${deg}deg, transparent 0deg, rgba(255,255,255,0.025) 12deg, transparent 24deg)`,
                          pointerEvents: "none",
                        }} />
                      ))}

                      {/* Album art circle */}
                      <div style={{ position:"absolute", inset:"15%", borderRadius:"50%", overflow:"hidden",
                        boxShadow:"0 0 0 1.5px rgba(255,255,255,0.07), inset 0 0 20px rgba(0,0,0,0.4)" }}>
                        {albumArt
                          ? <img src={albumArt} className="w-full h-full object-cover" alt={albumName} />
                          : <div className="w-full h-full" style={{ background:"#1a1a1a" }} />
                        }
                      </div>

                      {/* Center hole */}
                      <div style={{ position:"absolute", inset:"44%", borderRadius:"50%",
                        background:"rgba(255,255,255,0.14)", backdropFilter:"blur(2px)",
                        boxShadow:"0 0 0 1.5px rgba(0,0,0,0.6)" }} />
                    </div>

                    {/* Polygon rings — counter-rotating, outside disc, NOT spinning with disc */}
                    {polyRings.map((ring, ri) => {
                      const svgR = ring.r + 2;
                      const svgSize = svgR * 2 + 4;
                      const cx2 = dLeft + discSize / 2 - svgR - 2;
                      const cy2 = dTop  + discSize / 2 - svgR - 2;
                      return (
                        <svg key={ri} style={{
                          position:"absolute", top: cy2, left: cx2,
                          width: svgSize, height: svgSize,
                          pointerEvents:"none", zIndex: 2, overflow:"visible",
                          animation: `disc-spin ${ring.dur} linear infinite reverse`,
                        }}>
                          <polygon
                            points={polyPts(ring.n, ring.r)}
                            fill="none"
                            stroke={ring.stroke}
                            strokeWidth={ring.sw}
                            transform={`translate(${svgR + 2},${svgR + 2})`}
                          />
                        </svg>
                      );
                    })}

                    {/* Progress ring — static */}
                    <svg style={{ position:"absolute",
                      top: dTop - pr + discSize/2,
                      left: dLeft - pr + discSize/2,
                      pointerEvents:"none", zIndex: 3 }}
                      width={pr * 2} height={pr * 2}>
                      <circle cx={pr} cy={pr} r={pr - 2}
                        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                      <circle cx={pr} cy={pr} r={pr - 2}
                        fill="none" stroke="var(--extracted-primary, #1DB954)"
                        strokeWidth="2.5" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * (pr - 2)}`}
                        strokeDashoffset={`${2 * Math.PI * (pr - 2) * (1 - progress)}`}
                        transform={`rotate(-90 ${pr} ${pr})`}
                        style={{ transition:"stroke-dashoffset 0.35s linear",
                          filter:"drop-shadow(0 0 5px var(--extracted-primary, #1DB954))" }} />
                    </svg>

                    {/* Needle arm */}
                    <svg style={{ position:"absolute", top:0, left:0, zIndex:9,
                      pointerEvents:"none", overflow:"visible" }}
                      width={cW} height={cH}>
                      <g style={{
                        transform: `rotate(${ang}deg)`,
                        transformOrigin: `${pX}px ${pY}px`,
                        transition: "transform 0.65s cubic-bezier(0.34, 1.2, 0.64, 1)",
                        filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.9))",
                      }}>
                        <line x1={pX} y1={pY} x2={tipX} y2={tipY}
                          stroke="#1c1c1c" strokeWidth="7" strokeLinecap="round"/>
                        <line x1={pX} y1={pY} x2={tipX} y2={tipY}
                          stroke="#505050" strokeWidth="3" strokeLinecap="round"/>
                        {/* Arm highlight */}
                        <line x1={pX + 1} y1={pY + 4} x2={tipX + 1} y2={tipY - 4}
                          stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeLinecap="round"/>
                        <circle cx={pX} cy={pY} r={13} fill="#1c1c1c" stroke="#3c3c3c" strokeWidth="1.5"/>
                        <circle cx={pX} cy={pY} r={7}  fill="#141414" stroke="#4a4a4a" strokeWidth="1"/>
                        <circle cx={pX} cy={pY} r={3}  fill="#0a0a0a" stroke="#555" strokeWidth="0.5"/>
                        <circle cx={tipX} cy={tipY} r={7}   fill="#1a1a1a" stroke="#525252" strokeWidth="1.5"/>
                        <circle cx={tipX} cy={tipY} r={3}   fill="#666"/>
                        <circle cx={tipX} cy={tipY} r={1.2} fill="#999"/>
                      </g>
                    </svg>
                  </div>
                );
              })()}

              {/* Song info */}
              <div className="text-center w-full px-3 flex flex-col gap-1">
                <h2 className="text-white font-bold line-clamp-2 leading-snug"
                  style={{ fontSize: "clamp(0.85rem, 1.1vw, 1.05rem)", letterSpacing: "-0.02em",
                    textShadow: "0 1px 12px rgba(0,0,0,0.8)" }}>
                  {trackName}
                </h2>
                <p className="text-white/45 line-clamp-1" style={{ fontSize: "0.76rem" }}>{artistName}</p>
                <p className="text-white/22 text-xs line-clamp-1" style={{ fontSize: "0.68rem" }}>{albumName}</p>
              </div>

              {/* Progress time */}
              <div className="flex items-center gap-2 w-full px-3">
                <span className="text-white/22 tabular-nums" style={{ fontSize: "0.68rem" }}>{fmt(currentTime)}</span>
                <div className="flex-1 h-[2px] rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div className="h-full rounded-full" style={{
                    width: `${progress * 100}%`,
                    background: "var(--extracted-primary, #1DB954)",
                    boxShadow: "0 0 6px var(--extracted-primary, #1DB954)",
                    transition: "width 0.35s linear",
                  }} />
                </div>
                <span className="text-white/22 tabular-nums" style={{ fontSize: "0.68rem" }}>{fmt(durationMs / 1000)}</span>
              </div>

              <button onClick={() => { clearTokens(); window.location.reload(); }}
                className="text-white/12 hover:text-white/35 transition-colors"
                style={{ fontSize: "0.62rem", letterSpacing: "0.12em" }}>
                DISCONNECT
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RIGHT PANEL: Lyrics */}
        <div className="flex-1 min-w-0 relative">
          {!cinemaMode && (
            <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to right, rgba(0,0,0,0.35), transparent)" }} />
          )}
          <LyricsDisplay
            lyrics={lyrics}
            currentTime={currentTime}
            fontSize={fontSize}
            isLoading={isLoading}
            error={error}
            mode="word"
          />
        </div>
      </div>

      {/* ── Bottom bar — minimal ── */}
      <div className="relative z-[20] shrink-0 flex items-center justify-between px-4 py-3"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}>

        {/* Font size controls */}
        <div className="flex items-center gap-1">
          <button onClick={() => setFontSize(Math.max(1.2, fontSize - 0.15))}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10 active:scale-90"
            style={{ color:"rgba(255,255,255,0.45)", fontSize:"0.7rem", fontFamily:"Georgia,serif" }}>A</button>
          <div className="w-[1px] h-3 mx-0.5" style={{ background: "rgba(255,255,255,0.1)" }} />
          <button onClick={() => setFontSize(Math.min(4.5, fontSize + 0.15))}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10 active:scale-90"
            style={{ color:"rgba(255,255,255,0.7)", fontSize:"1rem", fontWeight:700, fontFamily:"Georgia,serif" }}>A</button>
        </div>

        {/* Right side: theme + cinema */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowThemes(t=>!t)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105"
            style={showThemes
              ? { background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.25)" }
              : { background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.45)", border:"1px solid rgba(255,255,255,0.09)" }}
          >
            {THEME_ICONS[theme]} <span style={{ fontSize:"0.68rem" }}>{theme}</span>
          </button>

          <button onClick={() => setCinemaMode(m => !m)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base transition-all hover:scale-110 active:scale-90"
            style={cinemaMode
              ? { color:"#ff8080", background:"rgba(255,80,80,0.12)", border:"1px solid rgba(255,80,80,0.2)" }
              : { color:"rgba(255,255,255,0.38)" }}
            title="Cinema mode">
            {cinemaMode ? "⊠" : "⛶"}
          </button>
        </div>
      </div>

      {/* ── Theme picker flyout ── */}
      <AnimatePresence>
        {showThemes && (
          <motion.div
            initial={{ opacity:0, y:8, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:8, scale:0.97 }}
            transition={{ duration:0.2 }}
            className="absolute z-[30] px-3 py-2.5 rounded-2xl flex flex-wrap gap-1.5"
            style={{
              bottom: 68, right: 12,
              background:"rgba(8,8,18,0.97)", backdropFilter:"blur(24px)",
              border:"1px solid rgba(255,255,255,0.1)", maxWidth: 340,
              boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
            }}
          >
            {THEMES.map(t => (
              <button key={t} onClick={() => { setTheme(t); setShowThemes(false); }}
                className="px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105 whitespace-nowrap"
                style={theme === t
                  ? { background:"var(--extracted-primary,#1DB954)", color:"#000", fontWeight:700 }
                  : { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.1)" }}
              >
                {THEME_ICONS[t]} {t}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LyricStage() {
  return (
    <ErrorBoundary>
      <LyricStageInner />
    </ErrorBoundary>
  );
}
