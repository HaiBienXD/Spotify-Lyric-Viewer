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

// Lyric offset (in seconds) applied globally for active-index calculation
const LYRIC_OFFSET = 0.5;

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

  const artistName = track?.artists?.[0]?.name ?? "";
  const trackName  = track?.name ?? "";
  const albumName  = track?.album?.name ?? "";
  const albumArt   = track?.album?.images?.[0]?.url;

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

  const [isLandscape, setIsLandscape]   = useState(window.innerWidth > window.innerHeight);
  const [discSize, setDiscSize]         = useState(200);

  // Resize handler for adaptive layout and disc sizes (QQ Music Landscape Style)
  useEffect(() => {
    const handleResize = () => {
      const land = window.innerWidth > window.innerHeight;
      setIsLandscape(land);
      const size = land 
        ? Math.min(300, Math.max(180, window.innerWidth * 0.22))
        : Math.min(220, Math.max(140, window.innerWidth * 0.18));
      setDiscSize(size);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Queue panel
  useEffect(() => {
    if (!showQueue) return;
    fetchQueue().then(d => { if (d?.queue) setQueue(d.queue.slice(0, 30)); }).catch(()=>{});
  }, [showQueue]);

  // Sync shuffle/repeat
  useEffect(() => {
    if (playbackState?.shuffle_state !== undefined) setShuffle(playbackState.shuffle_state);
    if (playbackState?.repeat_state) setRepeat(playbackState.repeat_state as RepeatMode);
  }, [playbackState?.shuffle_state, playbackState?.repeat_state]);

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

  const toggleFullscreen = () => {
    const docEl = document.documentElement;
    const requestFs = docEl.requestFullscreen || 
                      (docEl as any).webkitRequestFullscreen || 
                      (docEl as any).mozRequestFullScreen || 
                      (docEl as any).msRequestFullscreen;
                      
    const isFs = !!(document.fullscreenElement || 
                    (document as any).webkitFullscreenElement || 
                    (document as any).mozFullScreenElement || 
                    (document as any).msFullscreenElement);

    if (!isFs) {
      if (requestFs) {
        Promise.resolve(requestFs.call(docEl))
          .then(() => setStageMode(true))
          .catch((err) => {
            console.warn("Fullscreen failed, fallback to stageMode:", err);
            setStageMode(!stageMode);
          });
      } else {
        console.warn("Fullscreen API not supported, fallback to stageMode only");
        setStageMode(!stageMode);
      }
    } else {
      const exitFs = document.exitFullscreen || 
                     (document as any).webkitExitFullscreen || 
                     (document as any).mozCancelFullScreen || 
                     (document as any).msExitFullscreen;
      if (exitFs) {
        Promise.resolve(exitFs.call(document))
          .then(() => setStageMode(false))
          .catch(() => setStageMode(false));
      } else {
        setStageMode(false);
      }
    }
  };
  useEffect(() => {
    const h = () => {
      const isFs = !!(document.fullscreenElement || 
                      (document as any).webkitFullscreenElement || 
                      (document as any).mozFullScreenElement || 
                      (document as any).msFullscreenElement);
      setStageMode(isFs);
    };
    document.addEventListener("fullscreenchange", h);
    document.addEventListener("webkitfullscreenchange", h);
    document.addEventListener("mozfullscreenchange", h);
    document.addEventListener("MSFullscreenChange", h);
    return () => {
      document.removeEventListener("fullscreenchange", h);
      document.removeEventListener("webkitfullscreenchange", h);
      document.removeEventListener("mozfullscreenchange", h);
      document.removeEventListener("MSFullscreenChange", h);
    };
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
              style={{ animation: "disc-spin 20s linear infinite" }}>
              <img src={rArt} className="w-full h-full object-cover" alt="" />
            </div>
          )}
          <p className="text-white/40 text-base tracking-widest uppercase font-light">Waiting for music…</p>
        </div>
      </div>
    );
  }

  // ── Disc component (reused in multiple positions) ──
  const DiscArt = ({ size, showPause = true }: { size: number; showPause?: boolean }) => (
    <div className="relative" style={{ width: size, height: size, flexShrink: 0 }}>
      {/* Vinyl body */}
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
      {/* Album art */}
      <div className="absolute rounded-full overflow-hidden"
        style={{
          inset: "15%",
          animation: "disc-spin 22s linear infinite",
          animationPlayState: isPlaying ? "running" : "paused",
        }}>
        {albumArt && <img src={albumArt} className="w-full h-full object-cover" alt={albumName} />}
      </div>
      {/* Center spindle */}
      <div className="absolute rounded-full z-10"
        style={{
          inset:"44%", background:"rgba(255,255,255,0.2)", backdropFilter:"blur(4px)",
          boxShadow:"0 0 0 2px rgba(0,0,0,0.5)",
          animation: "disc-spin 22s linear infinite",
          animationPlayState: isPlaying ? "running" : "paused",
        }} />
      {/* Pause indicator */}
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

  const BOTTOM_H = 96;

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden relative select-none"
      style={{ fontFamily:"'Be Vietnam Pro', 'Inter', sans-serif" }}>

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



      {/* ── Word mode: Centered disc when no lyrics yet ── */}
      <AnimatePresence>
        {lyricsMode === "word" && activeIndex < 0 && !isLoading && (
          <motion.div
            key="word-disc-center"
            initial={{ opacity:0, scale:0.8 }}
            animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:0.85 }}
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

      {/* ── Main layout ── */}
      <div className="absolute inset-x-0 top-0 z-[10] flex"
        style={{
          bottom: `${BOTTOM_H}px`,
          flexDirection: isLandscape ? "row" : "column",
          alignItems: "center",
          justifyContent: "center",
        }}>

        {/* Left panel: disc + info — hidden in word mode when lyrics playing */}
        <AnimatePresence>
          {!(lyricsMode === "word" && activeIndex >= 0) && (
            <motion.div
              key="left"
              initial={{ opacity:0, x:-40 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-40 }}
              transition={{ duration:0.45, ease:[0.16,1,0.3,1] }}
              className="flex flex-col items-center justify-center shrink-0 gap-6 px-6 py-6"
              style={{ width: isLandscape ? "clamp(340px, 35vw, 450px)" : "clamp(240px, 28vw, 320px)" }}
            >
              {/* Disc container with tonearm */}
              <div className="relative" style={{ width: discSize, height: discSize }}>
                <DiscArt size={discSize} showPause={false} />
                
                {/* Tonearm/Needle SVG */}
                <div 
                  className="absolute"
                  style={{
                    top: `-${discSize * 0.12}px`,
                    right: `-${discSize * 0.12}px`,
                    width: `${discSize * 0.4}px`,
                    height: `${discSize * 0.8}px`,
                    transformOrigin: "78% 18%",
                    transform: isPlaying ? "rotate(8deg)" : "rotate(-18deg)",
                    transition: "transform 0.9s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    zIndex: 25,
                    pointerEvents: "none",
                  }}
                >
                  <svg viewBox="0 0 60 120" className="w-full h-full drop-shadow-2xl">
                    {/* Metal hinge & pivot rod */}
                    <circle cx="45" cy="20" r="11" fill="url(#metal-grad)" stroke="#444" strokeWidth="1" />
                    <circle cx="45" cy="20" r="6" fill="#111" />
                    
                    {/* Tonearm metal body */}
                    <path d="M45 20 C42 45, 38 70, 24 95 L20 106" stroke="url(#metal-grad-arm)" strokeWidth="3" strokeLinecap="round" fill="none" />
                    
                    {/* Counterweight */}
                    <rect x="40" y="5" width="10" height="7" rx="1" fill="#111" stroke="#333" strokeWidth="1" />
                    
                    {/* Cartridge headshell */}
                    <rect x="11" y="103" width="18" height="9" rx="1.5" fill="#181818" stroke="#3a3a3a" strokeWidth="1" transform="rotate(-18 20 107)" />
                    <circle cx="20" cy="107" r="2" fill="#e53e3e" />
                    
                    <defs>
                      <linearGradient id="metal-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#8e9eab" />
                        <stop offset="50%" stopColor="#eef2f3" />
                        <stop offset="100%" stopColor="#5c6e7a" />
                      </linearGradient>
                      <linearGradient id="metal-grad-arm" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#dcdcdc" />
                        <stop offset="50%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#a9a9a9" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              <div className="text-center w-full px-2">
                <h2 className="text-white font-bold line-clamp-2 leading-snug"
                  style={{ fontSize: isLandscape ? "clamp(1.1rem, 1.4vw, 1.5rem)" : "clamp(0.9rem, 1.2vw, 1.15rem)", letterSpacing:"-0.02em" }}>
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
            beat={beat}
          />
        </div>
      </div>

      {/* Queue panel */}
      <QueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} queue={queue} currentTrack={track} />

      {/* ── Bottom bar ── */}
      <AnimatePresence>
        {(!stageMode || showControls) && (
          <motion.div
            key="bottom"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
            transition={{ duration:0.25 }}
            className="absolute bottom-0 inset-x-0 z-[20] flex flex-col"
            style={{
              height: `${BOTTOM_H}px`,
              background: "linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.55) 85%, transparent 100%)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Progress bar */}
            <div className="flex items-center gap-2 px-3 pt-2 pb-1">
              <span className="text-white/30 text-xs tabular-nums w-8 text-right shrink-0">{fmt(currentTime)}</span>
              <div className="flex-1 h-[3px] rounded-full cursor-pointer overflow-hidden"
                style={{ background:"rgba(255,255,255,0.1)" }}>
                <motion.div className="h-full rounded-full"
                  style={{ background:"var(--extracted-primary,#1DB954)", boxShadow:"0 0 6px var(--extracted-primary,#1DB954)" }}
                  animate={{ width:`${progress*100}%` }}
                  transition={{ duration:0.25, ease:"linear" }} />
              </div>
              <span className="text-white/30 text-xs tabular-nums w-8 shrink-0">{fmt(durationMs/1000)}</span>
            </div>

            {/* Controls row */}
            <div className="grid grid-cols-3 items-center px-4 flex-1">
              
              {/* Left Column: Visual effects */}
              <div className="flex items-center gap-1.5 justify-start">
                <SmallBtn active={flashOn} onClick={() => setFlashOn(f=>!f)} color="#ffd700" title="Beat Flash">⚡</SmallBtn>
                <SmallBtn active={waveOn}  onClick={() => setWaveOn(w=>!w)}  color="var(--extracted-primary,#1DB954)" title="Wave">〜</SmallBtn>
                <SmallBtn active={lyricsMode==="word"} onClick={() => setLyricsMode(m => m==="line"?"word":"line")} color="#c879ff" title="Word mode">字</SmallBtn>
                
                {/* Visualizer cycle */}
                <SmallBtn active={visType>0} onClick={() => setVisType(v=>(v+1)%VISUALIZER_COUNT)} color="#60a5fa" title={VisualizerNames[visType]}>
                  {["♫","◎","▌▐","✦","≋","⬡","⚡","⊙","✶","✺"][visType] || "♫"}
                </SmallBtn>

                {/* Beat wave (mini) */}
                {waveOn && (
                  <div className="h-6 w-20 overflow-hidden ml-2 flex items-end">
                    <BeatWave beat={beat} bpm={bpm} isPlaying={isPlaying} />
                  </div>
                )}
              </div>

              {/* Center Column: Playback Controls */}
              <div className="flex items-center justify-center gap-4">
                <Btn active={shuffle} onClick={doShuffle} title="Shuffle">⇄</Btn>
                
                <Btn onClick={prev} title="Previous">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                </Btn>
                
                {/* Play/Pause */}
                <button onClick={play}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  style={{ background:"var(--extracted-primary,#1DB954)", color:"#000" }}
                >
                  {isPlaying
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft:2 }}><path d="M8 5v14l11-7z"/></svg>
                  }
                </button>
                
                <Btn onClick={next} title="Next">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 4V8l-5.5 4zm7.5-6h2v12h-2z"/></svg>
                </Btn>
                
                <Btn active={repeat !== "off"} onClick={doRepeat} title={`Repeat: ${repeat}`}>
                  {repeat === "track" ? "🔂" : "🔁"}
                </Btn>
              </div>

              {/* Right Column: Secondary controls / Themes / Fullscreen */}
              <div className="flex items-center gap-2 justify-end">
                {/* Font controls */}
                <div className="flex items-center gap-0.5">
                  <button onClick={() => setFontSize(Math.max(1.2,fontSize-0.2))}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-white/10 transition-all"
                    style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.7rem" }}>A</button>
                  <button onClick={() => setFontSize(Math.min(4.5,fontSize+0.2))}
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold hover:bg-white/10 transition-all"
                    style={{ color:"rgba(255,255,255,0.7)", fontSize:"1rem" }}>A</button>
                </div>

                {/* Queue */}
                <SmallBtn active={showQueue} onClick={() => setShowQueue(q=>!q)} color="#fff" title="Queue">≡</SmallBtn>

                {/* Theme picker trigger */}
                <button onClick={() => setShowThemes(t=>!t)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105"
                  style={showThemes
                    ? { background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.25)" }
                    : { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.5)", border:"1px solid rgba(255,255,255,0.1)" }}
                >
                  {THEME_ICONS[theme]}
                </button>

                {/* Cinema Mode */}
                <SmallBtn active={stageMode} onClick={toggleFullscreen} color="#ff6060" title="Fullscreen">
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
              bottom: `${BOTTOM_H+8}px`, right:12,
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
