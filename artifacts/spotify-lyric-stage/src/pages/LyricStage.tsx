import { useSpotify } from "@/hooks/useSpotify";
import { useLyrics } from "@/hooks/useLyrics";
import { usePlaybackSync } from "@/hooks/usePlaybackSync";
import { useTheme } from "@/hooks/useTheme";
import { useColorExtraction } from "@/hooks/useColorExtraction";
import LyricsDisplay from "@/components/LyricsDisplay";
import Visualizer from "@/components/Visualizer";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
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

const THEMES: Theme[] = ["Aurora","Neon","Galaxy","Glass","Minimal","Cyberpunk","AMOLED","Matrix","Rain","Fire"];
const THEME_ICONS: Record<Theme, string> = {
  Aurora:"🌌", Neon:"⚡", Galaxy:"🌠", Cyberpunk:"🤖", Glass:"💎",
  AMOLED:"🖤", Matrix:"💚", Rain:"🌧", Fire:"🔥", Minimal:"🎨",
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2,"0")}`;
}

export default function LyricStage() {
  const { playbackState, recentlyPlayed } = useSpotify();

  const track = playbackState?.item;
  const isPlaying = playbackState?.is_playing ?? false;
  const progressMs = playbackState?.progress_ms ?? 0;
  const durationMs = track?.duration_ms ?? 1;

  const artistName = track?.artists[0]?.name ?? "";
  const trackName = track?.name ?? "";
  const albumName = track?.album.name ?? "";
  const albumArt = track?.album.images[0]?.url;

  const { lyrics, isLoading, error } = useLyrics(artistName, trackName, albumName);
  const currentTime = usePlaybackSync(isPlaying, progressMs, durationMs);
  const { theme, setTheme, fontSize, setFontSize } = useTheme();
  useColorExtraction(albumArt);

  const [stageMode, setStageMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visualizerType, setVisualizerType] = useState(0);

  const progress = Math.min((currentTime * 1000) / durationMs, 1);

  // Auto-hide controls in stage mode
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
    const handler = () => setStageMode(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const renderBg = () => {
    switch (theme) {
      case "Neon": return <NeonBackground />;
      case "Galaxy": return <GalaxyBackground />;
      case "Cyberpunk": return <CyberpunkBackground />;
      case "Glass": return <GlassBackground albumArt={albumArt} />;
      case "AMOLED": return <AMOLEDBackground />;
      case "Matrix": return <MatrixBackground />;
      case "Rain": return <RainBackground />;
      case "Fire": return <FireBackground />;
      case "Minimal": return <MinimalBackground />;
      default: return <AuroraBackground />;
    }
  };

  if (!track) {
    const rArt = recentlyPlayed?.album?.images[0]?.url;
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-white relative overflow-hidden">
        {rArt && (
          <div className="absolute inset-0 blur-3xl opacity-20 scale-110">
            <img src={rArt} className="w-full h-full object-cover" alt="" />
          </div>
        )}
        <div className="z-10 flex flex-col items-center gap-6">
          {rArt && (
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/10 animate-pulse shadow-2xl">
              <img src={rArt} className="w-full h-full object-cover" alt="" />
            </div>
          )}
          <p className="text-white/50 text-lg font-light tracking-widest uppercase">Waiting for music…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-screen bg-black text-white overflow-hidden relative select-none"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Theme background */}
      {renderBg()}

      {/* Album art blurred background overlay — always present */}
      {albumArt && (
        <div className="absolute inset-0 pointer-events-none z-[1]">
          <img
            src={albumArt}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "blur(80px) saturate(1.4) brightness(0.35)", transform: "scale(1.1)" }}
            alt=""
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Visualizer */}
      {visualizerType > 0 && (
        <div className="absolute inset-0 z-[2] pointer-events-none">
          <Visualizer type={visualizerType} />
        </div>
      )}

      {/* Main content */}
      <div
        className="absolute inset-0 z-[10] flex"
        style={{ bottom: stageMode ? "0" : "72px" }}
      >
        {/* ── Left Panel: Disc + Info ── */}
        <AnimatePresence>
          {!stageMode && (
            <motion.div
              key="left-panel"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
              className="flex flex-col items-center justify-center shrink-0 px-8 py-8 gap-6"
              style={{ width: "340px" }}
            >
              {/* Vinyl disc */}
              <div className="relative" style={{ width: "220px", height: "220px" }}>
                {/* Outer vinyl ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle at 30% 30%, #333 0%, #111 40%, #222 60%, #0a0a0a 100%)",
                    boxShadow: `0 0 0 2px rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.8), 0 0 40px var(--extracted-primary, rgba(100,100,255,0.2))`,
                    animation: "disc-spin 24s linear infinite",
                    animationPlayState: isPlaying ? "running" : "paused",
                  }}
                >
                  {/* Groove rings */}
                  {[0.88, 0.78, 0.68].map((s, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full border border-white/[0.04]"
                      style={{
                        inset: `${(1 - s) * 50}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Album art circle */}
                <div
                  className="absolute rounded-full overflow-hidden"
                  style={{
                    inset: "16%",
                    animation: "disc-spin 24s linear infinite",
                    animationPlayState: isPlaying ? "running" : "paused",
                  }}
                >
                  {albumArt && (
                    <img src={albumArt} className="w-full h-full object-cover" alt={albumName} />
                  )}
                </div>

                {/* Center spindle */}
                <div
                  className="absolute rounded-full bg-white/30 backdrop-blur-sm z-10"
                  style={{
                    inset: "45%",
                    boxShadow: "0 0 0 2px rgba(0,0,0,0.5)",
                    animation: "disc-spin 24s linear infinite",
                    animationPlayState: isPlaying ? "running" : "paused",
                  }}
                />

                {/* Pause indicator */}
                {!isPlaying && (
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 z-20">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-8 bg-white/70 rounded-full" />
                      <div className="w-1.5 h-8 bg-white/70 rounded-full" />
                    </div>
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="text-center px-2 w-full">
                <h2
                  className="text-white font-bold leading-tight mb-1 line-clamp-2"
                  style={{ fontSize: "1.15rem", letterSpacing: "-0.02em" }}
                  title={trackName}
                >
                  {trackName}
                </h2>
                <p className="text-white/50 text-sm font-normal tracking-wide line-clamp-1">{artistName}</p>
                <p className="text-white/30 text-xs mt-0.5 line-clamp-1">{albumName}</p>
              </div>

              {/* Progress bar */}
              <div className="w-full px-2">
                <div
                  className="w-full h-1 rounded-full overflow-hidden mb-2 cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress * 100}%`,
                      background: "var(--extracted-primary, #1DB954)",
                      boxShadow: "0 0 8px var(--extracted-primary, #1DB954)",
                    }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.25, ease: "linear" }}
                  />
                </div>
                <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(durationMs / 1000)}</span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={() => { clearTokens(); window.location.reload(); }}
                className="text-xs text-white/20 hover:text-white/50 transition-colors tracking-wide"
              >
                disconnect
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Right Panel: Lyrics ── */}
        <div className="flex-1 min-w-0 relative">
          <LyricsDisplay
            lyrics={lyrics}
            currentTime={currentTime}
            fontSize={fontSize}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>

      {/* ── Bottom Controls Bar ── */}
      <AnimatePresence>
        {(!stageMode || showControls) && (
          <motion.div
            key="bottom-bar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 inset-x-0 z-[20] flex items-center gap-3 px-4 py-3"
            style={{
              height: "72px",
              background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Stage / Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              {stageMode ? (
                <><span>⊠</span> Exit</>
              ) : (
                <><span>⛶</span> Stage</>
              )}
            </button>

            {/* Themes */}
            <div className="flex-1 overflow-x-auto flex items-center gap-1.5" style={{ scrollbarWidth: "none" }}>
              {THEMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className="shrink-0 px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105 whitespace-nowrap"
                  style={
                    theme === t
                      ? { background: "var(--extracted-primary, rgba(29,185,84,0.9))", color: "#000", fontWeight: 700, border: "none" }
                      : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)" }
                  }
                >
                  {THEME_ICONS[t]} {t}
                </button>
              ))}
            </div>

            {/* Font Size */}
            <div className="shrink-0 flex items-center gap-1">
              <button
                onClick={() => setFontSize(Math.max(1.2, fontSize - 0.2))}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all hover:scale-110"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
              >A</button>
              <button
                onClick={() => setFontSize(Math.min(4.0, fontSize + 0.2))}
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all hover:scale-110"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", fontSize: "1.1rem" }}
              >A</button>
            </div>

            {/* Visualizer */}
            <button
              onClick={() => setVisualizerType((visualizerType + 1) % 5)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
              style={{ background: visualizerType > 0 ? "rgba(29,185,84,0.2)" : "rgba(255,255,255,0.08)", color: visualizerType > 0 ? "#1DB954" : "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {["Off","Spectrum","EQ","Particles","Orbit"][visualizerType]} ♫
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
