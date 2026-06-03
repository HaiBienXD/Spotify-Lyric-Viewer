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

function getActiveIndex(lyrics: { time: number }[], currentTime: number) {
  const adj = currentTime + LYRIC_OFFSET;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (adj >= lyrics[i].time) return i;
  }
  return -1;
}

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

  const activeIndex = getActiveIndex(lyrics, currentTime);

  // ── Feature state ──
  const [lyricsMode, setLyricsMode]     = useState<LyricsMode>("line");
  const [stageMode, setStageMode]       = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [flashOn, setFlashOn]           = useState(false);
  const [waveOn, setWaveOn]             = useState(true);
  const [showQueue, setShowQueue]       = useState(false);
  const [showThemes, setShowThemes]     = useState(false);
  const [visType, setVisType]           = useState(0);

  const [bpm, setBpm]         = useState(120);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat]   = useState<RepeatMode>("off");
  const [queue, setQueue]     = useState<any[]>([]);

  const beat = useBeat(bpm, isPlaying);

  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio features → BPM
  useEffect(() => {
    if (!track?.id) return;
    fetchAudioFeatures(track.id).then(d => { if (d?.tempo) setBpm(Math.round(d.tempo)); }).catch(()=>{});
  }, [track?.id]);

  // Queue panel - refetch when track changes too
  useEffect(() => {
    if (!showQueue) return;
    fetchQueue().then(d => { if (d?.queue) setQueue(d.queue); }).catch(()=>{});
  }, [showQueue, track?.id]);

  // Sync shuffle/repeat
  useEffect(() => {
    if (playbackState?.shuffle_state !== undefined) setShuffle(playbackState.shuffle_state);
    if ((playbackState as any)?.repeat_state) setRepeat((playbackState as any).repeat_state);
  }, [(playbackState as any)?.shuffle_state, (playbackState as any)?.repeat_state]);

  // Auto-hide controls in stage mode
  const resetTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    if (stageMode) controlsTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, [stageMode]);

  useEffect(() => {
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    return () => { window.removeEventListener("mousemove", resetTimer); window.removeEventListener("touchstart", resetTimer); };
  }, [resetTimer]);

  useEffect(() => {
    if (!stageMode) { setShowControls(true); if (controlsTimer.current) clearTimeout(controlsTimer.current); }
    else resetTimer();
  }, [stageMode, resetTimer]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setStageMode(true);
      } else {
        await document.exitFullscreen();
        setStageMode(false);
      }
    } catch {
      // Fullscreen not supported (e.g. iframe) — just toggle stage mode visually
      setStageMode(s => !s);
    }
  };
  useEffect(() => {
    const h = () => setStageMode(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // Playback handlers
  const play    = () => controlPlayback(isPlaying ? "pause" : "play").catch(()=>{});
  const next    = () => controlPlayback("next").catch(()=>{});
  const prev    = () => controlPlayback("previous").catch(()=>{});
  const doShuffle = () => { const n=!shuffle; setShuffle(n); setShuffleState(n).catch(()=>{}); };
  const doRepeat  = () => {
    const modes: RepeatMode[] = ["off","context","track"];
    const n = modes[(modes.indexOf(repeat)+1)%3];
    setRepeat(n); setRepeatMode(n).catch(()=>{});
  };

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

  // ── No track waiting screen ──
  if (!track) {
    const rArt = recentlyPlayed?.album?.images[0]?.url;
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-white relative overflow-hidden">
        {rArt && <div className="absolute inset-0 scale-110" style={{ filter:"blur(80px) brightness(0.3)" }}><img src={rArt} className="w-full h-full object-cover" alt="" /></div>}
        <div className="z-10 flex flex-col items-center gap-6">
          {rArt && (
            <div className="w-32 h-32 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/10"
              style={{ animation:"disc-spin 20s linear infinite" }}>
              <img src={rArt} className="w-full h-full object-cover" alt="" />
            </div>
          )}
          <p className="text-white/40 text-base tracking-widest uppercase font-light">Waiting for music…</p>
        </div>
      </div>
    );
  }

  // ── Disc component ──
  const DiscArt = ({ size, showPause = true, className = "" }: { size: number; showPause?: boolean; className?: string }) => (
    <div className={`relative ${className}`} style={{ width: size, height: size, flexShrink: 0 }}>
      <div className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 32% 28%, #3a3a3a 0%, #111 42%, #1e1e1e 70%, #080808 100%)",
          boxShadow: `0 0 0 2px rgba(255,255,255,0.05), 0 ${size*0.1}px ${size*0.3}px rgba(0,0,0,0.9), 0 0 ${size*0.25}px var(--extracted-primary, rgba(80,80,200,0.15))`,
          animation: "disc-spin 22s linear infinite",
          animationPlayState: isPlaying ? "running" : "paused",
        }}
      >
        {[0.87, 0.76, 0.65].map((s, i) => (
          <div key={i} className="absolute rounded-full border border-white/[0.035]" style={{ inset: `${(1-s)*50}%` }} />
        ))}
      </div>
      <div className="absolute rounded-full overflow-hidden"
        style={{ inset: "15%", animation:"disc-spin 22s linear infinite", animationPlayState: isPlaying?"running":"paused" }}>
        {albumArt && <img src={albumArt} className="w-full h-full object-cover" alt={albumName} />}
      </div>
      <div className="absolute rounded-full z-10"
        style={{ inset:"44%", background:"rgba(255,255,255,0.2)", backdropFilter:"blur(4px)",
          boxShadow:"0 0 0 2px rgba(0,0,0,0.5)",
          animation:"disc-spin 22s linear infinite", animationPlayState:isPlaying?"running":"paused" }} />
      {showPause && !isPlaying && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/25 z-20">
          <div className="flex gap-1.5">
            <div className="bg-white/60 rounded-full" style={{ width:"max(2px,6%)", height:"30%" }} />
            <div className="bg-white/60 rounded-full" style={{ width:"max(2px,6%)", height:"30%" }} />
          </div>
        </div>
      )}
    </div>
  );

  // Should show centered disc in word mode?
  const showCenteredDisc = lyricsMode === "word" && activeIndex < 0 && !isLoading;
  // Disc should fade as lyrics approach
  const lyricsApproaching = lyrics.length > 0 && activeIndex < 0 && currentTime > 0;
  // Calculate fade: if first lyric is within 3 seconds, start fading
  const firstLyricTime = lyrics.length > 0 ? lyrics[0].time : Infinity;
  const timeToFirstLyric = firstLyricTime - (currentTime + LYRIC_OFFSET);
  const discOpacity = timeToFirstLyric < 3 ? Math.max(0, timeToFirstLyric / 3) : 1;

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden relative select-none flex flex-col"
      style={{ fontFamily:"Inter, sans-serif" }}>

      {/* Backgrounds */}
      {renderBg()}
      {albumArt && (
        <div className="absolute inset-0 pointer-events-none z-[1]">
          <img src={albumArt} className="absolute inset-0 w-full h-full object-cover"
            style={{ filter:"blur(80px) saturate(1.5) brightness(0.28)", transform:"scale(1.12)" }} alt="" />
          <div className="absolute inset-0 bg-black/58" />
        </div>
      )}

      {/* Visualizer */}
      {visType > 0 && <div className="absolute inset-0 z-[3] pointer-events-none"><Visualizer type={visType} /></div>}

      {/* Beat flash */}
      {flashOn && <BeatFlash beat={beat} />}

      {/* ── Stage mode PiP (top-right corner) ── */}
      <AnimatePresence>
        {stageMode && (
          <motion.div
            key="stage-pip"
            initial={{ opacity:0, scale:0.5, x:20 }}
            animate={{ opacity: showControls ? 1 : 0.6, scale:1, x:0 }}
            exit={{ opacity:0, scale:0.5 }}
            transition={{ duration:0.4, ease:[0.16,1,0.3,1] }}
            className="absolute top-4 right-4 z-[25] flex items-start gap-3"
          >
            {/* Disc with progress ring */}
            <div className="relative">
              <svg width="82" height="82" className="absolute -inset-[5px]" style={{ filter: "drop-shadow(0 0 6px var(--extracted-primary, rgba(30,185,84,0.4)))" }}>
                <circle cx="41" cy="41" r="38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                <circle cx="41" cy="41" r="38"
                  fill="none"
                  stroke="var(--extracted-primary, #1DB954)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 38}`}
                  strokeDashoffset={`${2 * Math.PI * 38 * (1 - progress)}`}
                  transform="rotate(-90 41 41)"
                  style={{ transition: "stroke-dashoffset 0.3s linear" }}
                />
              </svg>
              <DiscArt size={72} showPause={false} />
            </div>
            <div className="flex flex-col gap-1 pt-1" style={{ maxWidth:120 }}>
              <p className="text-white/80 text-xs font-semibold truncate">{trackName}</p>
              <p className="text-white/40 text-xs truncate">{artistName}</p>
              <p className="text-white/25 text-xs tabular-nums">{fmt(currentTime)} / {fmt(durationMs/1000)}</p>
              {/* Mini controls */}
              <div className="flex items-center gap-1 mt-1">
                <button onClick={prev} className="w-6 h-6 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                </button>
                <button onClick={play} className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background:"var(--extracted-primary,#1DB954)", color:"#000" }}>
                  {isPlaying
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  }
                </button>
                <button onClick={next} className="w-6 h-6 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z"/></svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Word mode: Centered disc when no lyrics yet ── */}
      <AnimatePresence>
        {showCenteredDisc && (
          <motion.div
            key="word-disc-center"
            initial={{ opacity:0, scale:0.8 }}
            animate={{ opacity: discOpacity, scale:1 }}
            exit={{ opacity:0, scale:0.85, transition: { duration: 0.8 } }}
            transition={{ duration:0.6, ease:[0.16,1,0.3,1] }}
            className="absolute inset-0 z-[15] flex flex-col items-center justify-center gap-6"
          >
            <DiscArt size={240} />
            <div className="text-center px-8">
              <h2 className="text-white font-bold text-2xl mb-1" style={{ letterSpacing:"-0.02em" }}>{trackName}</h2>
              <p className="text-white/45 text-base">{artistName}</p>
            </div>
            <motion.p
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}
              className="text-white/30 text-xs tracking-widest uppercase"
            >
              ♪ waiting for lyrics ♪
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main layout — flex-1 to fill remaining space ── */}
      <div className="flex-1 min-h-0 relative z-[10] flex">
        {/* Left panel: disc + info — hidden in stage mode, hidden in word mode when lyrics playing */}
        <AnimatePresence>
          {!stageMode && !(lyricsMode === "word" && activeIndex >= 0) && (
            <motion.div
              key="left"
              initial={{ opacity:0, x:-40 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-40 }}
              transition={{ duration:0.45, ease:[0.16,1,0.3,1] }}
              className="flex flex-col items-center justify-center shrink-0 gap-4 px-6 py-6"
              style={{ width: "clamp(240px, 28vw, 320px)" }}
            >
              <DiscArt size={Math.min(200, Math.max(140, window.innerWidth * 0.18))} />

              <div className="text-center w-full px-2">
                <h2 className="text-white font-bold line-clamp-2 leading-snug"
                  style={{ fontSize:"clamp(0.9rem, 1.2vw, 1.15rem)", letterSpacing:"-0.02em" }}>
                  {trackName}
                </h2>
                <p className="text-white/45 text-sm line-clamp-1 mt-1">{artistName}</p>
                <p className="text-white/22 text-xs line-clamp-1 mt-0.5">{albumName}</p>
              </div>

              <button onClick={() => { clearTokens(); window.location.reload(); }}
                className="text-xs text-white/15 hover:text-white/40 transition-colors">
                disconnect
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lyrics panel */}
        <div className="flex-1 min-w-0 relative">
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

      {/* ── Bottom bar — fixed height, always at bottom ── */}
      <AnimatePresence>
        {(!stageMode || showControls) && (
          <motion.div
            key="bottom"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
            transition={{ duration:0.25 }}
            className="relative z-[20] shrink-0"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Progress bar */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
              <span className="text-white/30 text-xs tabular-nums w-9 text-right shrink-0">{fmt(currentTime)}</span>
              <div className="flex-1 h-[3px] rounded-full cursor-pointer overflow-hidden"
                style={{ background:"rgba(255,255,255,0.1)" }}>
                <motion.div className="h-full rounded-full"
                  style={{ background:"var(--extracted-primary,#1DB954)", boxShadow:"0 0 6px var(--extracted-primary,#1DB954)" }}
                  animate={{ width:`${progress*100}%` }}
                  transition={{ duration:0.25, ease:"linear" }} />
              </div>
              <span className="text-white/30 text-xs tabular-nums w-9 shrink-0">{fmt(durationMs/1000)}</span>
            </div>

            {/* Controls row — 3 columns: left effects | center playback | right tools */}
            <div className="grid pb-2 pt-1 px-3" style={{ gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:"0 8px" }}>

              {/* LEFT: effects */}
              <div className="flex items-center gap-1">
                <SmallBtn active={flashOn} onClick={() => setFlashOn(f=>!f)} color="#ffd700" title="Beat Flash">⚡</SmallBtn>
                <SmallBtn active={waveOn}  onClick={() => setWaveOn(w=>!w)}  color="var(--extracted-primary,#1DB954)" title="Wave">〜</SmallBtn>
                <SmallBtn active={lyricsMode==="word"} onClick={() => setLyricsMode(m => m==="line"?"word":"line")} color="#c879ff" title="Word mode">字</SmallBtn>
                <SmallBtn active={visType>0} onClick={() => setVisType(v=>(v+1)%VISUALIZER_COUNT)} color="#60a5fa"
                  title={VisualizerNames[visType]}>
                  {["♫","◎","▌▐","✦","≋","⬡","⚡","⊙","✶","✺","◈","⬢","✧","⌘","❋","◉","⟡","⊛","⬟"][visType] || "♫"}
                </SmallBtn>
                {waveOn && (
                  <div className="self-stretch flex items-end overflow-hidden" style={{ width:60, height:32 }}>
                    <BeatWave beat={beat} bpm={bpm} isPlaying={isPlaying} />
                  </div>
                )}
              </div>

              {/* CENTER: playback controls */}
              <div className="flex items-center gap-1">
                <Btn active={shuffle} onClick={doShuffle} title="Shuffle">⇄</Btn>

                <Btn onClick={prev} title="Previous">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                </Btn>

                <button onClick={play}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0"
                  style={{ background:"var(--extracted-primary,#1DB954)", color:"#000" }}
                >
                  {isPlaying
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft:2 }}><path d="M8 5v14l11-7z"/></svg>
                  }
                </button>

                <Btn onClick={next} title="Next">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z"/></svg>
                </Btn>

                <Btn active={repeat !== "off"} onClick={doRepeat} title={`Repeat: ${repeat}`}>
                  {repeat === "track" ? "🔂" : "🔁"}
                </Btn>
              </div>

              {/* RIGHT: theme, font, queue, stage */}
              <div className="flex items-center gap-1 justify-end">
                {/* Font size */}
                <button onClick={() => setFontSize(Math.max(1.2,fontSize-0.2))}
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
                  style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.65rem" }}>A</button>
                <button onClick={() => setFontSize(Math.min(4.5,fontSize+0.2))}
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold hover:bg-white/10 transition-all"
                  style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.95rem" }}>A</button>

                {/* Queue */}
                <SmallBtn active={showQueue} onClick={() => setShowQueue(q=>!q)} color="#fff" title="Queue">≡</SmallBtn>

                {/* Theme */}
                <button onClick={() => setShowThemes(t=>!t)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all hover:scale-105 shrink-0"
                  style={showThemes
                    ? { background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.25)" }
                    : { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.5)", border:"1px solid rgba(255,255,255,0.1)" }}
                >
                  {THEME_ICONS[theme]}
                </button>

                {/* Stage */}
                <SmallBtn active={stageMode} onClick={toggleFullscreen} color="#ff6060" title="Cinema mode">
                  {stageMode ? "⊠" : "⛶"}
                </SmallBtn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme picker flyout */}
      <AnimatePresence>
        {showThemes && (
          <motion.div
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
            className="absolute z-[25] px-3 py-2 rounded-2xl flex flex-wrap gap-1.5"
            style={{
              bottom: 90, right:12,
              background:"rgba(10,10,16,0.97)", backdropFilter:"blur(24px)",
              border:"1px solid rgba(255,255,255,0.1)", maxWidth:340,
            }}
          >
            {THEMES.map(t => (
              <button key={t} onClick={() => { setTheme(t); setShowThemes(false); }}
                className="px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105 whitespace-nowrap"
                style={theme===t
                  ? { background:"var(--extracted-primary,#1DB954)", color:"#000", fontWeight:700 }
                  : { background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.65)", border:"1px solid rgba(255,255,255,0.1)" }}
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

// ── Small icon button ──
function Btn({ children, active, onClick, title, color }: {
  children: React.ReactNode; active?: boolean; onClick: ()=>void; title?: string; color?: string;
}) {
  return (
    <button onClick={onClick} title={title}
      className="w-8 h-8 flex items-center justify-center rounded-full text-base transition-all hover:scale-110 active:scale-95 shrink-0"
      style={{ color: active ? "var(--extracted-primary,#1DB954)" : "rgba(255,255,255,0.55)", background: "transparent" }}
    >{children}</button>
  );
}

function SmallBtn({ children, active, onClick, color, title }: {
  children: React.ReactNode; active?: boolean; onClick: ()=>void; color?: string; title?: string;
}) {
  return (
    <button onClick={onClick} title={title}
      className="w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all hover:scale-110 active:scale-95 shrink-0"
      style={active
        ? { background: `${(color||"#fff")}22`, color: color||"#fff", border:`1px solid ${(color||"#fff")}44` }
        : { color:"rgba(255,255,255,0.4)", background:"transparent" }}
    >{children}</button>
  );
}
