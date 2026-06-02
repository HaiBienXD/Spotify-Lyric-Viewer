import { useSpotify } from "@/hooks/useSpotify";
import { useLyrics } from "@/hooks/useLyrics";
import { usePlaybackSync } from "@/hooks/usePlaybackSync";
import { useTheme } from "@/hooks/useTheme";
import { useColorExtraction } from "@/hooks/useColorExtraction";
import LyricsDisplay from "@/components/LyricsDisplay";
import ControlsOverlay from "@/components/ControlsOverlay";
import Visualizer from "@/components/Visualizer";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

// Backgrounds
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

export default function LyricStage() {
  const { playbackState, recentlyPlayed } = useSpotify();
  
  const track = playbackState?.item;
  const isPlaying = playbackState?.is_playing ?? false;
  const progressMs = playbackState?.progress_ms ?? 0;
  const durationMs = track?.duration_ms ?? 0;
  
  const artistName = track?.artists[0]?.name;
  const trackName = track?.name;
  const albumName = track?.album.name;
  const albumArt = track?.album.images[0]?.url;

  const { lyrics, isLoading, error } = useLyrics(artistName, trackName, albumName);
  const currentTime = usePlaybackSync(isPlaying, progressMs, durationMs);
  const { theme, setTheme, fontSize, setFontSize } = useTheme();
  useColorExtraction(albumArt);

  const [showControls, setShowControls] = useState(false);
  const [stageMode, setStageMode] = useState(false);
  
  // Default visualizer based on theme
  const defaultVis = ["Minimal", "AMOLED", "Glass"].includes(theme) ? 0 : 1;
  const [visualizerType, setVisualizerType] = useState(defaultVis);

  let controlsTimeout: any;

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(controlsTimeout);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
      setStageMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setStageMode(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setStageMode(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!track) {
    const recentArt = recentlyPlayed?.album?.images[0]?.url;
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-white overflow-hidden relative">
        {recentArt && (
          <div className="absolute inset-0 opacity-20 blur-3xl scale-110">
            <img src={recentArt} alt="Background blur" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="z-10 flex flex-col items-center">
          {recentArt && (
            <img src={recentArt} alt="Album Art" className="w-64 h-64 rounded-xl shadow-2xl mb-8 animate-pulse" />
          )}
          <h2 className="text-3xl font-serif text-white/80 animate-pulse tracking-wide">Waiting for music...</h2>
        </div>
      </div>
    );
  }

  const renderBackground = () => {
    switch (theme) {
      case "Neon": return <NeonBackground />;
      case "Aurora": return <AuroraBackground />;
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

  return (
    <div 
      className="w-full h-screen bg-black text-white overflow-hidden relative font-sans"
      onClick={handleMouseMove}
    >
      {renderBackground()}

      {visualizerType > 0 && <Visualizer type={visualizerType} />}

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80 z-0 pointer-events-none"></div>

      {/* Main Content */}
      <div className="absolute inset-0 z-10 flex flex-col md:flex-row items-center md:items-stretch">
        
        {/* Left/Top side: Album Art & Info */}
        <div className={`p-8 md:p-16 flex flex-col justify-center items-center md:items-start md:w-[40%] transition-all duration-700 ease-in-out ${stageMode ? 'opacity-0 translate-x-[-100%]' : 'opacity-100 translate-x-0'}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            key={albumArt}
          >
            <img 
              src={albumArt} 
              alt={albumName} 
              className="w-56 h-56 md:w-96 md:h-96 rounded-2xl shadow-2xl object-cover ring-1 ring-white/10"
              style={{ boxShadow: '0 20px 80px -10px var(--extracted-primary)' }}
            />
          </motion.div>
          <motion.div 
            className="mt-10 text-center md:text-left max-w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            key={trackName}
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-4 tracking-tight drop-shadow-lg break-words line-clamp-3">{trackName}</h1>
            <h2 className="text-2xl md:text-3xl text-white/70 font-sans font-light tracking-wide">{artistName}</h2>
          </motion.div>
        </div>

        {/* Right/Center side: Lyrics */}
        <div className={`flex-1 relative transition-all duration-700 ease-in-out ${stageMode ? 'w-full md:w-full' : ''}`}>
          <LyricsDisplay 
            lyrics={lyrics}
            currentTime={currentTime}
            fontSize={fontSize}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 glass-panel rounded-full px-8 py-4 shadow-2xl"
          >
            <ControlsOverlay 
              theme={theme}
              setTheme={setTheme}
              fontSize={fontSize}
              setFontSize={setFontSize}
              stageMode={stageMode}
              toggleFullscreen={toggleFullscreen}
              visualizerType={visualizerType}
              setVisualizerType={setVisualizerType}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1.5 bg-white/10 w-full z-40 backdrop-blur-md">
        <div 
          className="h-full bg-white shadow-[0_0_10px_white] transition-all duration-300 ease-linear"
          style={{ width: `${(currentTime * 1000 / durationMs) * 100}%` }}
        />
      </div>
    </div>
  );
}
