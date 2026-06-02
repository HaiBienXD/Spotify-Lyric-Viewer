import React from 'react';

export default function AuroraBackground() {
  return (
    <div className="absolute inset-0 bg-[#020111] overflow-hidden pointer-events-none">
      {/* Stars */}
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px)',
        backgroundSize: '200px 200px',
        backgroundPosition: '0 0, 100px 100px'
      }} />
      
      {/* Aurora Waves */}
      <div className="absolute inset-0 opacity-60 mix-blend-screen">
        <div 
          className="absolute top-[-20%] left-[-10%] w-[120%] h-[80%] rounded-[100%] blur-[100px] animate-pulse duration-[10s]"
          style={{ background: 'var(--extracted-primary, #00ff88)', opacity: 0.4 }}
        />
        <div 
          className="absolute top-[20%] right-[-10%] w-[100%] h-[60%] rounded-[100%] blur-[120px] animate-pulse duration-[15s]"
          style={{ background: 'var(--extracted-secondary, #ff00ff)', opacity: 0.3 }}
        />
      </div>
    </div>
  );
}
