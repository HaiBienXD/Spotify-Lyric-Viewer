import { useSpotify } from "@/hooks/useSpotify";
import { useLyrics } from "@/hooks/useLyrics";
import { usePlaybackSync } from "@/hooks/usePlaybackSync";
import { useTheme } from "@/hooks/useTheme";
import { useColorExtraction } from "@/hooks/useColorExtraction";
import { useBeat } from "@/hooks/useBeat";
import LyricsDisplay, { LyricsMode } from "@/components/LyricsDisplay";
import Visualizer from "@/components/Visualizer";
import BeatFlash from "@/components/BeatFlash";
import BeatWave from "@/components/BeatWave";
import QueuePanel from "@/components/QueuePanel";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
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

const THEMES: Theme[] = ["Aurora","Neon","Galaxy","Glass","Minimal","Cyberpunk","AMOLED","Matrix","Rain","Fire"];
const THEME_ICONS: Record<Theme,string> = {
  Aurora:"🌌",Neon:"⚡",Galaxy:"🌠",Cyberpunk:"🤖",Glass:"💎",
  AMOLED:"🖤",Matrix:"💚",Rain:"🌧",Fire:"🔥",Minimal:"🎨",
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2,"0")}`;
}

type RepeatMode = "off" | "track" | "context";
type LayoutMode = "normal" | "cinema";

export default function LyricStage() {
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

  // ── Feature state ──
  const [layout, setLayout]        = useState<LayoutMode>("normal");
  const [stageMode, setStageMode]  = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [lyricsMode, setLyricsMode] = useState<LyricsMode>("normal");
  const [flashOn, setFlashOn]      = useState(false);
  const [waveOn, setWaveOn]        = useState(true);
  const [showQueue, setShowQueue]  = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [visualizerType, setVisualizerType] = useState(0);

  const [bpm, setBpm]     = useState(120);
  const [shuffle, setShuffle] = useState(playbackState?.shuffle_state ?? false);
  const [repeat, setRepeat]   = useState<RepeatMode>("off");
  const [queue, setQueue]     = useState<any[]>([]);

  const beat = useBeat(bpm, isPlaying && flashOn);

  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch audio features (BPM) on track change ──
  useEffect(() => {
    if (!track?.id) return;
    fetchAudioFeatures(track.id).then(data => {
      if (data?.tempo) setBpm(Math.round(data.tempo));
    }).catch(() => {});
  }, [track?.id]);

  // ── Fetch queue when panel opens ──
  useEffect(() => {
    if (!showQueue) return;
    fetchQueue().then(data => {
      if (data?.queue) setQueue(data.queue.slice(0, 30));
    }).catch(() => {});
  }, [showQueue]);

  // ── Sync shuffle/repeat from playback state ──
  useEffect(() => {
    if (playbackState?.shuffle_state !== undefined) setShuffle(playbackState.shuffle_state);
    if (playbackState?.repeat_state) setRepeat(playbackState.repeat_state as RepeatMode);
  }, [playbackState?.shuffle_state, playbackState?.repeat_state]);

  // ── Auto-hide controls in stage mode ──
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    if (stageMode) {
      controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [stageMode]);

  useEffect(() => {
    window.addEventListener("mousemove", resetControlsTimer);
    window.addEventListener("click", resetControlsTimer);
    return () => {
      window.removeEventListener("mousemove", resetControlsTimer);
      window.removeEventListener("click", resetControlsTimer);
    };
  }, [resetControlsTimer]);

  useEffect(() => {
    if (!stageMode) { setShowControls(true); if (controlsTimer.current) clearTimeout(controlsTimer.current); }
    else resetControlsTimer();
  }, [stageMode, resetControlsTimer]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setStageMode(true);
    } else {
      document.exitFullscreen();
      setStageMode(false);
    }
  };
  useEffect(() => {
    const h = () => setStageMode(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ── Playback handlers ──
  const handleTogglePlay = async () => {
    await controlPlayback(isPlaying ? "pause" : "play").catch(()=>{});
  };
  const handleNext = async () => { await controlPlayback("next").catch(()=>{}); };
  const handlePrev = async () => { await controlPlayback("previous").catch(()=>{}); };
  const handleShuffle = async () => {
    const next = !shuffle;
    setShuffle(next);
    await setShuffleState(next).catch(()=>{});
  };
  const handleRepeat = async () => {
    const modes: RepeatMode[] = ["off","context","track"];
    const next = modes[(modes.indexOf(repeat) + 1) % 3];
    setRepeat(next);
    await setRepeatMode(next).catch(()=>{});
  };

  const renderBg = () => {
    switch (theme) {
      case "Neon":     return <NeonBackground />;
      case "Galaxy":   return <GalaxyBackground />;
      case "Cyberpunk":return <CyberpunkBackground />;
      case "Glass":    return <GlassBackground albumArt={albumArt} />;
      case "AMOLED":   return <AMOLEDBackground />;
      case "Matrix":   return <MatrixBackground />;
      case "Rain":     return <RainBackground />;
      case "Fire":     return <FireBackground />;
      case "Minimal":  return <MinimalBackground />;
      default:         return <AuroraBackground />;
    }
  };

  const progress = Math.min((currentTime * 1000) / durationMs, 1);
  const leftPanelVisible = !stageMode && layout === "normal";

  // ── No track state ──
  if (!track) {
    const rArt = recentlyPlayed?.album?.images[0]?.url;
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-white relative overflow-hidden">
        {rArt && <div className="absolute inset-0 blur-3xl opacity-15 scale-110"><img src={rArt} className="w-full h-full object-cover" alt="" /></div>}
        <div className="z-10 flex flex-col items-center gap-5">
          {rArt && <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/10 shadow-2xl"><img src={rArt} className="w-full h-full object-cover" alt="" /></div>}
          <p className="text-white/40 text-base font-light tracking-widest uppercase">Waiting for music…</p>
          <p className="text-white/20 text-xs">Open Spotify and play something</p>
        </div>
      </div>
    );
  }

  const BOTTOM_H = 96;

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden relative select-none">
      {/* ── Backgrounds ── */}
      {renderBg()}
      {albumArt && (
        <div className="absolute inset-0 pointer-events-none z-[1]">
          <img src={albumArt} className="absolute inset-0 w-full h-full object-cover"
            style={{ filter:"blur(80px) saturate(1.4) brightness(0.3)", transform:"scale(1.1)" }} alt="" />
          <div className="absolute inset-0 bg-black/55" />
        </div>
      )}

      {/* ── Beat Flash overlay ── */}
      {flashOn && <BeatFlash beat={beat} />}

      {/* ── Visualizer ── */}
      {visualizerType > 0 && (
        <div className="absolute inset-0 z-[3] pointer-events-none">
          <Visualizer type={visualizerType} />
        </div>
      )}

      {/* ── Main layout (above bottom bar) ── */}
      <div className="absolute inset-x-0 top-0 z-[10] flex" style={{ bottom: `${BOTTOM_H}px` }}>

        {/* Left panel */}
        <AnimatePresence>
          {leftPanelVisible && (
            <motion.div
              key="left"
              initial={{ opacity:0, x:-40 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-40 }}
              transition={{ duration:0.45, ease:[0.16,1,0.3,1] }}
              className="flex flex-col items-center justify-center shrink-0 px-6 py-6 gap-5"
              style={{ width:"320px" }}
            >
              {/* Disc */}
              <div className="relative" style={{ width:"200px", height:"200px" }}>
                <div className="absolute inset-0 rounded-full"
                  style={{
                    background:"radial-gradient(circle at 30% 30%,#3a3a3a 0%,#111 40%,#1e1e1e 70%,#0a0a0a 100%)",
                    boxShadow:`0 0 0 2px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.9), 0 0 50px var(--extracted-primary,rgba(100,100,255,0.15))`,
                    animation:"disc-spin 22s linear infinite",
                    animationPlayState: isPlaying ? "running" : "paused",
                  }}
                >
                  {[0.87,0.76,0.65].map((s,i)=>(
                    <div key={i} className="absolute rounded-full border border-white/[0.03]" style={{ inset:`${(1-s)*50}%` }} />
                  ))}
                </div>
                <div className="absolute rounded-full overflow-hidden"
                  style={{ inset:"15%", animation:"disc-spin 22s linear infinite", animationPlayState:isPlaying?"running":"paused" }}>
                  {albumArt && <img src={albumArt} className="w-full h-full object-cover" alt="" />}
                </div>
                <div className="absolute rounded-full z-10"
                  style={{ inset:"44%", background:"rgba(255,255,255,0.18)", backdropFilter:"blur(4px)",
                    boxShadow:"0 0 0 2px rgba(0,0,0,0.6)", animation:"disc-spin 22s linear infinite",
                    animationPlayState:isPlaying?"running":"paused" }} />
                {!isPlaying && (
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/25 z-20">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-7 bg-white/60 rounded-full" />
                      <div className="w-1.5 h-7 bg-white/60 rounded-full" />
                    </div>
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="text-center w-full px-2">
                <h2 className="text-white font-bold leading-snug mb-1 line-clamp-2"
                  style={{ fontSize:"1.1rem", letterSpacing:"-0.02em" }}>{trackName}</h2>
                <p className="text-white/50 text-sm line-clamp-1">{artistName}</p>
                <p className="text-white/25 text-xs mt-0.5 line-clamp-1">{albumName}</p>
              </div>

              {/* Disconnect */}
              <button onClick={() => { clearTokens(); window.location.reload(); }}
                className="text-xs text-white/15 hover:text-white/40 transition-colors tracking-wide mt-auto">
                disconnect
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinema mini-disc PiP */}
        <AnimatePresence>
          {(layout === "cinema" && !stageMode) && (
            <motion.div
              key="pip"
              initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.5 }}
              className="absolute top-4 left-4 z-20 flex flex-col items-center gap-1.5"
            >
              <div className="relative rounded-full overflow-hidden shadow-2xl"
                style={{ width:"60px",height:"60px",
                  boxShadow:"0 0 0 2px rgba(255,255,255,0.12),0 8px 32px rgba(0,0,0,0.8)",
                  animation:"disc-spin 22s linear infinite",
                  animationPlayState:isPlaying?"running":"paused" }}>
                {albumArt && <img src={albumArt} className="w-full h-full object-cover" alt="" />}
              </div>
              <div className="text-center px-1">
                <p className="text-white/60 text-xs font-medium truncate max-w-[80px]">{trackName}</p>
                <p className="text-white/30 text-xs truncate max-w-[80px]">{artistName}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lyrics panel */}
        <div className="flex-1 min-w-0 relative">
          <LyricsDisplay
            lyrics={lyrics}
            currentTime={currentTime}
            fontSize={layout === "cinema" ? fontSize * 1.35 : fontSize}
            isLoading={isLoading}
            error={error}
            mode={lyricsMode}
          />
        </div>
      </div>

      {/* ── Queue panel ── */}
      <QueuePanel
        isOpen={showQueue}
        onClose={() => setShowQueue(false)}
        queue={queue}
        currentTrack={track}
      />

      {/* ── Bottom bar ── */}
      <AnimatePresence>
        {(!stageMode || showControls) && (
          <motion.div
            key="bottom"
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:16 }}
            transition={{ duration:0.28 }}
            className="absolute bottom-0 inset-x-0 z-[20] flex flex-col"
            style={{
              height:`${BOTTOM_H}px`,
              background:"linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 80%, transparent 100%)",
              backdropFilter:"blur(12px)",
            }}
          >
            {/* Progress bar row */}
            <div className="flex items-center gap-2 px-4 pt-2">
              <span className="text-white/35 text-xs tabular-nums w-10 text-right shrink-0">{fmt(currentTime)}</span>
              <div className="flex-1 h-1 rounded-full overflow-hidden cursor-pointer" style={{ background:"rgba(255,255,255,0.12)" }}>
                <motion.div className="h-full rounded-full"
                  style={{ background:"var(--extracted-primary,#1DB954)", width:`${progress*100}%`,
                    boxShadow:"0 0 6px var(--extracted-primary,#1DB954)" }}
                  animate={{ width:`${progress*100}%` }} transition={{ duration:0.25, ease:"linear" }} />
              </div>
              <span className="text-white/35 text-xs tabular-nums w-10 shrink-0">{fmt(durationMs/1000)}</span>
            </div>

            {/* Controls row */}
            <div className="flex-1 flex items-center px-3 gap-1.5">

              {/* ─ Left group: shuffle + prev + play/pause + next + repeat ─ */}
              <div className="flex items-center gap-1">
                {/* Shuffle */}
                <button onClick={handleShuffle}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/10 text-lg"
                  style={{ color: shuffle ? "var(--extracted-primary,#1DB954)" : "rgba(255,255,255,0.45)" }}
                  title="Shuffle"
                >⇄</button>

                {/* Prev */}
                <button onClick={handlePrev}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
                  style={{ color:"rgba(255,255,255,0.75)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
                  </svg>
                </button>

                {/* Play/Pause */}
                <button onClick={handleTogglePlay}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 font-bold shadow-lg"
                  style={{ background:"var(--extracted-primary,#1DB954)", color:"#000" }}
                >
                  {isPlaying ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft:"2px" }}>
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>

                {/* Next */}
                <button onClick={handleNext}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
                  style={{ color:"rgba(255,255,255,0.75)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 4V8l-5.5 4zm7.5-6h2v12h-2z"/>
                  </svg>
                </button>

                {/* Repeat */}
                <button onClick={handleRepeat}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/10 text-sm relative"
                  style={{ color: repeat!=="off" ? "var(--extracted-primary,#1DB954)" : "rgba(255,255,255,0.45)" }}
                  title={`Repeat: ${repeat}`}
                >
                  {repeat === "track" ? "🔂" : "🔁"}
                  {repeat !== "off" && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                      style={{ background:"var(--extracted-primary,#1DB954)" }} />
                  )}
                </button>
              </div>

              <div className="flex-1" />

              {/* ─ Beat Wave section ─ */}
              {waveOn && isPlaying && (
                <div className="flex items-end" style={{ width:"120px", height:"32px" }}>
                  <BeatWave beat={beat} bpm={bpm} isPlaying={isPlaying} />
                </div>
              )}

              <div className="flex-1" />

              {/* ─ Right group: effect/mode toggles ─ */}
              <div className="flex items-center gap-1">

                {/* Flash toggle */}
                <button onClick={() => setFlashOn(f=>!f)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105"
                  style={flashOn
                    ? { background:"rgba(255,220,0,0.2)", color:"#ffd700", border:"1px solid rgba(255,220,0,0.3)" }
                    : { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.1)" }}
                  title="Beat Flash"
                >⚡</button>

                {/* Wave toggle */}
                <button onClick={() => setWaveOn(w=>!w)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105"
                  style={waveOn
                    ? { background:"rgba(var(--extracted-primary-rgb,29,185,84),0.2)", color:"var(--extracted-primary,#1DB954)", border:"1px solid rgba(255,255,255,0.15)" }
                    : { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.1)" }}
                  title="Beat Wave"
                >〜</button>

                {/* Lyrics mode toggle */}
                <button onClick={() => setLyricsMode(m => m === "normal" ? "word" : "normal")}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105"
                  style={lyricsMode === "word"
                    ? { background:"rgba(180,100,255,0.25)", color:"#c879ff", border:"1px solid rgba(180,100,255,0.35)" }
                    : { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.1)" }}
                  title="Word-by-word mode"
                >字</button>

                {/* Visualizer */}
                <button onClick={() => setVisualizerType(v => (v + 1) % 5)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105"
                  style={visualizerType > 0
                    ? { background:"rgba(0,120,255,0.2)", color:"#60a5fa", border:"1px solid rgba(0,120,255,0.3)" }
                    : { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.1)" }}
                  title="Visualizer"
                >
                  {["♪","≋","▌▐","✦","⊙"][visualizerType]}
                </button>

                {/* Cinema / layout mode */}
                <button onClick={() => setLayout(l => l === "normal" ? "cinema" : "normal")}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105"
                  style={layout === "cinema"
                    ? { background:"rgba(255,160,0,0.2)", color:"#ffa500", border:"1px solid rgba(255,160,0,0.3)" }
                    : { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.1)" }}
                  title="Cinema mode"
                >🎬</button>

                {/* Stage/Fullscreen */}
                <button onClick={toggleFullscreen}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105"
                  style={stageMode
                    ? { background:"rgba(255,80,80,0.2)", color:"#ff6060", border:"1px solid rgba(255,80,80,0.3)" }
                    : { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.1)" }}
                  title="Fullscreen"
                >{stageMode ? "⊠" : "⛶"}</button>

                {/* Theme picker toggle */}
                <button onClick={() => setShowThemes(t=>!t)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105"
                  style={showThemes
                    ? { background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)" }
                    : { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.1)" }}
                >🎨 {theme}</button>

                {/* Font size */}
                <div className="flex items-center gap-0.5">
                  <button onClick={() => setFontSize(Math.max(1.2,fontSize-0.2))}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-white/10 transition-all"
                    style={{ color:"rgba(255,255,255,0.45)" }}>A</button>
                  <button onClick={() => setFontSize(Math.min(4.0,fontSize+0.2))}
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm hover:bg-white/10 transition-all"
                    style={{ color:"rgba(255,255,255,0.65)" }}>A</button>
                </div>

                {/* Queue */}
                <button onClick={() => setShowQueue(q=>!q)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105"
                  style={showQueue
                    ? { background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)" }
                    : { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.1)" }}
                  title="Queue"
                >≡</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Theme picker flyout ── */}
      <AnimatePresence>
        {showThemes && (
          <motion.div
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
            className="absolute z-[25] px-3 py-2 rounded-2xl flex flex-wrap gap-1.5"
            style={{
              bottom:`${BOTTOM_H+8}px`, right:"12px",
              background:"rgba(12,12,18,0.95)", backdropFilter:"blur(20px)",
              border:"1px solid rgba(255,255,255,0.1)", maxWidth:"360px",
            }}
          >
            {THEMES.map(t=>(
              <button key={t} onClick={() => { setTheme(t); setShowThemes(false); }}
                className="px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105 whitespace-nowrap"
                style={theme===t
                  ? { background:"var(--extracted-primary,rgba(29,185,84,0.9))", color:"#000", fontWeight:700 }
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
