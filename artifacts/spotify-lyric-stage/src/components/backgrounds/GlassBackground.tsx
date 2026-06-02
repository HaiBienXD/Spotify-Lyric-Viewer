import React from 'react';

export default function GlassBackground({ albumArt }: { albumArt?: string }) {
  return (
    <div className="absolute inset-0 bg-black overflow-hidden pointer-events-none">
      {albumArt && (
        <div 
          className="absolute inset-[-10%] bg-cover bg-center blur-[80px] opacity-60 scale-110"
          style={{ backgroundImage: `url(${albumArt})` }}
        />
      )}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[50px] mix-blend-overlay" />
    </div>
  );
}
