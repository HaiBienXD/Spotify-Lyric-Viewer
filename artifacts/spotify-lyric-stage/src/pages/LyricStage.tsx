import { useSpotify } from "@/hooks/useSpotify";
import { useLyrics } from "@/hooks/useLyrics";
import { usePlaybackSync } from "@/hooks/usePlaybackSync";
import { useTheme } from "@/hooks/useTheme";
import { useColorExtraction } from "@/hooks/useColorExtraction";
import { useBeat } from "@/hooks/useBeat";
import LyricsDisplay, { LyricsMode } from "@/components/LyricsDisplay";
import Visualizer, { VISUALIZER_COUNT, VisualizerNames } from "@/components/Visualizer";
import BeatFlash from "@/components/BeatFlash";
import BeatWave from "@/components/BeatWave";
import QueuePanel from "@/components/QueuePanel";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback, Component, ReactNode } from "react";
import {
  clearTokens, controlPlayback, fetchAudioFeatures,
  fetchQueue, setShuffleState, setRepeatMode,
} from "@/lib/spotify";
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

// ── Error boundary to prevent black screen on crash ──
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
          >
            Reload
          </button>
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

type RepeatMode = "off" | "track" | "context";

const LYRIC_OFFSET = 0.8;
function getActiveIndex(lyrics: { time: number }[], t: number) {
  const adj = t + LYRIC_OFFSET;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (adj >= lyrics[i].time) return i;
  }
  return -1;
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
  const beat = useBeat(120, isPlaying);

  const [lyricsMode, setLyricsMode] = useState<LyricsMode>("line");
  const [cinemaMode, setCinemaMode] = useState(false);
  const [flashOn, setFlashOn]       = useState(false);
  const [waveOn, setWaveOn]         = useState(true);
  const [showQueue, setShowQueue]   = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [visType, setVisType]       = useState(0);
  const [shuffle, setShuffle]       = useState(false);
  const [repeat, setRepeat]         = useState<RepeatMode>("off");
  const [queue, setQueue]           = useState<any[]>([]);
  const [bpm, setBpm]               = useState(120);

  useEffect(() => {
    if (!track?.id) return;
    fetchAudioFeatures(track.id).then(d => { if (d?.tempo) setBpm(Math.round(d.tempo)); }).catch(()=>{});
  }, [track?.id]);

  useEffect(() => {
    if (!showQueue) return;
    fetchQueue().then(d => { if (d?.queue) setQueue(d.queue); }).catch(()=>{});
  }, [showQueue, track?.id]);

  useEffect(() => {
    if (playbackState?.shuffle_state !== undefined) setShuffle(playbackState.shuffle_state);
    if ((playbackState as any)?.repeat_state) setRepeat((playbackState as any).repeat_state);
  }, [(playbackState as any)?.shuffle_state, (playbackState as any)?.repeat_state]);

  const play       = useCallback(() => controlPlayback(isPlaying ? "pause" : "play").catch(()=>{}), [isPlaying]);
  const next       = useCallback(() => controlPlayback("next").catch(()=>{}), []);
  const prev       = useCallback(() => controlPlayback("previous").catch(()=>{}), []);
  const doShuffle  = useCallback(() => { const n=!shuffle; setShuffle(n); setShuffleState(n).catch(()=>{}); }, [shuffle]);
  const doRepeat   = useCallback(() => {
    const modes: RepeatMode[] = ["off","context","track"];
    const n = modes[(modes.indexOf(repeat)+1)%3];
    setRepeat(n); setRepeatMode(n).catch(()=>{});
  }, [repeat]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space")       { e.preventDefault(); play(); }
      if (e.code === "ArrowRight")  next();
      if (e.code === "ArrowLeft")   prev();
      if (e.key === "f" || e.key === "F") setCinemaMode(m => !m);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [play, next, prev]);

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

      {/* ── Theme background — subtle, behind everything ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none" style={{ opacity: 0.18 }}>
        {renderBg()}
      </div>

      {/* ── Extra dark overlay so theme effects don't bleed into lyrics ── */}
      <div className="absolute inset-0 z-[2] pointer-events-none" style={{ background: "rgba(0,0,0,0.45)" }} />

      {/* ── Visualizer — bottom portion only, not over lyrics ── */}
      {visType > 0 && (
        <div className="absolute inset-0 z-[3] pointer-events-none" style={{ opacity: 0.55 }}>
          <Visualizer type={visType} />
        </div>
      )}

      {/* ── Beat flash ── */}
      {flashOn && <BeatFlash beat={beat} />}

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
                // Layout constants
                const dTop = 34, dLeft = 14;
                const dCx = dLeft + discSize / 2;
                const dCy = dTop + discSize / 2;
                // Needle pivot: top-right of container
                const pX = discSize + dLeft + 28;
                const pY = 14;
                // Touch point on disc groove at ~1-o'clock (28° clockwise from top, 74% radius)
                const ta = 28 * Math.PI / 180;
                const tX = dCx + (discSize / 2) * 0.74 * Math.sin(ta);
                const tY = dCy - (discSize / 2) * 0.74 * Math.cos(ta);
                // Arm vector
                const vx = tX - pX, vy = tY - pY;
                const armLen = Math.sqrt(vx * vx + vy * vy);
                // Angle from straight-down (+y) to touch point
                const playAng = Math.atan2(vx, vy) * 180 / Math.PI;
                const pauseAng = playAng - 26;
                const ang = isPlaying ? playAng : pauseAng;
                // Arm tip in unrotated state (straight down from pivot)
                const tipX = pX, tipY = pY + armLen;
                const cW = pX + 18;
                const cH = dTop + discSize + 6;
                const pr = discSize / 2 + 3;

                return (
                  <div style={{ position: "relative", width: cW, height: cH, flexShrink: 0 }}>

                    {/* Spinning disc */}
                    <div className="disc-glow" style={{
                      position: "absolute", top: dTop, left: dLeft,
                      width: discSize, height: discSize, borderRadius: "50%",
                      animation: `disc-spin ${spinRate} linear infinite`,
                      willChange: "transform",
                    }}>
                      <div style={{ position:"absolute", inset:0, borderRadius:"50%",
                        background:"radial-gradient(circle at 35% 30%, #3d3d3d 0%, #161616 40%, #1f1f1f 65%, #0a0a0a 100%)",
                        boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.04)" }} />
                      {[0.88, 0.78, 0.68, 0.58].map((s, i) => (
                        <div key={i} style={{ position:"absolute", borderRadius:"50%",
                          border:"1px solid rgba(255,255,255,0.028)", inset:`${(1-s)*50}%` }} />
                      ))}
                      <div style={{ position:"absolute", inset:"15%", borderRadius:"50%", overflow:"hidden",
                        boxShadow:"0 0 0 1.5px rgba(255,255,255,0.06)" }}>
                        {albumArt
                          ? <img src={albumArt} className="w-full h-full object-cover" alt={albumName} />
                          : <div className="w-full h-full" style={{ background:"#1a1a1a" }} />
                        }
                      </div>
                      <div style={{ position:"absolute", inset:"44%", borderRadius:"50%",
                        background:"rgba(255,255,255,0.15)", backdropFilter:"blur(2px)",
                        boxShadow:"0 0 0 1.5px rgba(0,0,0,0.6)" }} />
                    </div>

                    {/* Progress ring — static, not spinning */}
                    <svg style={{ position:"absolute", top: dTop - pr + discSize/2,
                      left: dLeft - pr + discSize/2, pointerEvents:"none" }}
                      width={pr * 2} height={pr * 2}>
                      <circle cx={pr} cy={pr} r={pr - 2}
                        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
                      <circle cx={pr} cy={pr} r={pr - 2}
                        fill="none" stroke="var(--extracted-primary, #1DB954)"
                        strokeWidth="2.5" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * (pr - 2)}`}
                        strokeDashoffset={`${2 * Math.PI * (pr - 2) * (1 - progress)}`}
                        transform={`rotate(-90 ${pr} ${pr})`}
                        style={{ transition:"stroke-dashoffset 0.35s linear",
                          filter:"drop-shadow(0 0 5px var(--extracted-primary, #1DB954))" }} />
                    </svg>

                    {/* Needle arm — SVG with CSS rotate around pivot */}
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
                          stroke="#1e1e1e" strokeWidth="7" strokeLinecap="round"/>
                        <line x1={pX} y1={pY} x2={tipX} y2={tipY}
                          stroke="#484848" strokeWidth="3.5" strokeLinecap="round"/>
                        <circle cx={pX} cy={pY} r={13} fill="#1c1c1c" stroke="#3a3a3a" strokeWidth="1.5"/>
                        <circle cx={pX} cy={pY} r={5}   fill="#0a0a0a" stroke="#555" strokeWidth="1"/>
                        <circle cx={tipX} cy={tipY} r={7}   fill="#1a1a1a" stroke="#505050" strokeWidth="1.5"/>
                        <circle cx={tipX} cy={tipY} r={2.5} fill="#888"/>
                      </g>
                    </svg>
                  </div>
                );
              })()}

              {/* Song info */}
              <div className="text-center w-full px-3 flex flex-col gap-1">
                <h2 className="text-white font-bold line-clamp-2 leading-snug"
                  style={{ fontSize: "clamp(0.85rem, 1.1vw, 1.1rem)", letterSpacing: "-0.02em",
                    textShadow: "0 1px 12px rgba(0,0,0,0.8)" }}>
                  {trackName}
                </h2>
                <p className="text-white/45 text-sm line-clamp-1" style={{ fontSize: "0.78rem" }}>{artistName}</p>
                <p className="text-white/20 text-xs line-clamp-1" style={{ fontSize: "0.7rem" }}>{albumName}</p>
              </div>

              {/* Wave if on */}
              {waveOn && (
                <div style={{ width: Math.min(discSize * 0.75, 140), height: 28, overflow: "hidden" }}>
                  <BeatWave beat={beat} bpm={bpm} isPlaying={isPlaying} />
                </div>
              )}

              <button onClick={() => { clearTokens(); window.location.reload(); }}
                className="text-white/12 hover:text-white/35 transition-colors"
                style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>
                DISCONNECT
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RIGHT PANEL: Lyrics */}
        <div className="flex-1 min-w-0 relative">
          {/* Left fade gradient */}
          {!cinemaMode && (
            <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to right, rgba(0,0,0,0.4), transparent)" }} />
          )}
          <LyricsDisplay
            lyrics={lyrics}
            currentTime={currentTime}
            fontSize={fontSize}
            isLoading={isLoading}
            error={error}
            mode={lyricsMode}
          />
        </div>
      </div>

      {/* Queue panel */}
      <QueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} queue={queue} currentTrack={track} />

      {/* ── Bottom bar ── */}
      <div
        className="relative z-[20] shrink-0"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)",
          paddingBottom: "env(safe-area-inset-bottom, 4px)",
        }}
      >
        {/* Progress bar */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <span className="text-white/25 text-xs tabular-nums w-9 text-right shrink-0">{fmt(currentTime)}</span>
          <div className="flex-1 h-[3px] rounded-full cursor-pointer overflow-visible relative"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              className="h-full rounded-full relative"
              style={{
                background: "var(--extracted-primary, #1DB954)",
                boxShadow: "0 0 8px var(--extracted-primary, #1DB954)",
              }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.35, ease: "linear" }}
            >
              {/* Thumb */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md"
                style={{ boxShadow: "0 0 6px var(--extracted-primary, #1DB954)" }} />
            </motion.div>
          </div>
          <span className="text-white/25 text-xs tabular-nums w-9 shrink-0">{fmt(durationMs / 1000)}</span>
        </div>

        {/* Controls row — 3 columns */}
        <div className="grid pb-3 pt-0.5 px-3" style={{ gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "0 8px" }}>

          {/* LEFT: effects */}
          <div className="flex items-center gap-1">
            <SBtn active={flashOn} onClick={() => setFlashOn(f=>!f)} color="#ffd700" title="Beat Flash">⚡</SBtn>
            <SBtn active={waveOn}  onClick={() => setWaveOn(w=>!w)}  color="var(--extracted-primary,#1DB954)" title="Wave">〜</SBtn>
            <SBtn active={lyricsMode==="word"} onClick={() => setLyricsMode(m => m==="line"?"word":"line")} color="#c879ff" title="Word mode">字</SBtn>
            <SBtn active={visType > 0} onClick={() => setVisType(v => (v+1)%VISUALIZER_COUNT)} color="#60a5fa" title={VisualizerNames[visType]}>
              {["♫","◎","▌▐","✦","≋","⬡","⚡","⊙","✶","✺","◈","⬢","✧","⌘","❋","◉","⟡","⊛","⬟"][visType] || "♫"}
            </SBtn>
          </div>

          {/* CENTER: playback */}
          <div className="flex items-center gap-1">
            <Btn active={shuffle} onClick={doShuffle} title="Shuffle">⇄</Btn>

            <Btn onClick={prev} title="Previous">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </Btn>

            <button onClick={play}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0"
              style={{ background: "var(--extracted-primary, #1DB954)", color: "#000",
                boxShadow: "0 0 16px var(--extracted-primary, #1DB954)" }}
            >
              {isPlaying
                ? <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                : <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft:2 }}><path d="M8 5v14l11-7z"/></svg>
              }
            </button>

            <Btn onClick={next} title="Next">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z"/></svg>
            </Btn>

            <Btn active={repeat !== "off"} onClick={doRepeat} title={`Repeat: ${repeat}`}>
              {repeat === "track" ? "🔂" : "🔁"}
            </Btn>
          </div>

          {/* RIGHT: tools */}
          <div className="flex items-center gap-1 justify-end">
            {/* Font size */}
            <button onClick={() => setFontSize(Math.max(1.2, fontSize - 0.2))}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
              style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.65rem" }}>A</button>
            <button onClick={() => setFontSize(Math.min(4.5, fontSize + 0.2))}
              className="w-6 h-6 rounded-full flex items-center justify-center font-bold hover:bg-white/10 transition-all"
              style={{ color:"rgba(255,255,255,0.65)", fontSize:"0.95rem" }}>A</button>

            <SBtn active={showQueue} onClick={() => setShowQueue(q=>!q)} color="#fff" title="Queue">≡</SBtn>

            {/* Theme picker */}
            <button onClick={() => setShowThemes(t=>!t)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all hover:scale-105 shrink-0"
              style={showThemes
                ? { background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.25)" }
                : { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.45)", border:"1px solid rgba(255,255,255,0.1)" }}
            >
              {THEME_ICONS[theme]}
            </button>

            {/* Cinema mode */}
            <SBtn active={cinemaMode} onClick={() => setCinemaMode(m => !m)} color="#ff6060" title="Cinema mode (F)">
              {cinemaMode ? "⊠" : "⛶"}
            </SBtn>
          </div>
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
              bottom: 90, right: 12,
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

// ── Button components ──
function Btn({ children, active, onClick, title }: {
  children: ReactNode; active?: boolean; onClick: () => void; title?: string;
}) {
  return (
    <button onClick={onClick} title={title}
      className="w-8 h-8 flex items-center justify-center rounded-full text-base transition-all hover:scale-110 active:scale-90 shrink-0"
      style={{
        color: active ? "var(--extracted-primary, #1DB954)" : "rgba(255,255,255,0.5)",
        background: active ? "var(--extracted-primary-alpha, rgba(29,185,84,0.12))" : "transparent",
      }}
    >{children}</button>
  );
}

function SBtn({ children, active, onClick, color, title }: {
  children: ReactNode; active?: boolean; onClick: () => void; color?: string; title?: string;
}) {
  return (
    <button onClick={onClick} title={title}
      className="w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all hover:scale-110 active:scale-90 shrink-0"
      style={active
        ? { background:`${color || "#fff"}1a`, color: color || "#fff", border:`1px solid ${color || "#fff"}33`,
            boxShadow:`0 0 8px ${color || "#fff"}22` }
        : { color:"rgba(255,255,255,0.38)", background:"transparent" }}
    >{children}</button>
  );
}
