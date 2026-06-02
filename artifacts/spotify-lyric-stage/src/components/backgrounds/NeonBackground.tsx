import React from 'react';

export default function NeonBackground() {
  return (
    <div className="absolute inset-0 bg-black overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: 'linear-gradient(to bottom, transparent 50%, var(--extracted-primary, #ff00ff) 100%)',
        }}
      />
      {/* Grid */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg) translateY(100px) scale(3)',
          transformOrigin: 'bottom center',
        }}
      />
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-50" />
    </div>
  );
}
