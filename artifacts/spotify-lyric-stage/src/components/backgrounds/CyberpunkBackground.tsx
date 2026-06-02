import React from 'react';

export default function CyberpunkBackground() {
  return (
    <div className="absolute inset-0 bg-[#0a0a0c] overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 2px, #ffb800 2px, #ffb800 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, #ffb800 2px, #ffb800 4px)
          `,
          backgroundSize: '100px 100px',
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-full h-[50%] bg-gradient-to-t from-[#ffb800] to-transparent opacity-20 mix-blend-color-dodge"
      />
      {/* Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-50" />
    </div>
  );
}
