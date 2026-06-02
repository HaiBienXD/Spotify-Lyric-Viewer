import { motion } from "framer-motion";
import { LyricLine } from "../lib/lrcParser";
import { useEffect, useRef } from "react";

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  fontSize: number;
  isLoading: boolean;
  error: string | null;
}

export default function LyricsDisplay({ lyrics, currentTime, fontSize, isLoading, error }: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Find active line index
  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
      break;
    }
  }

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/50 text-2xl font-serif">
        Loading lyrics...
      </div>
    );
  }

  if (error || lyrics.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/50 text-2xl font-serif">
        No lyrics available
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-y-auto pt-[50vh] pb-[50vh] px-8 md:px-24 flex flex-col items-center hide-scrollbar"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none"
      }}
    >
      {lyrics.map((line, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;
        
        let opacity = 0.6; // future
        if (isActive) opacity = 1;
        if (isPast) opacity = 0.4;
        
        let scale = isActive ? 1.1 : 1;

        return (
          <motion.div
            key={index}
            ref={isActive ? activeLineRef : null}
            initial={false}
            animate={{ opacity, scale }}
            transition={{ duration: 0.4 }}
            className={`w-full max-w-4xl text-center py-4 font-sans font-bold leading-tight cursor-default transition-all duration-300 ${isActive ? 'text-white' : 'text-white/60'}`}
            style={{ fontSize: `${fontSize}rem` }}
          >
            {line.text}
          </motion.div>
        );
      })}
    </div>
  );
}
