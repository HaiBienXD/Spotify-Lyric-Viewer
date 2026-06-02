import React from 'react';

export default function MinimalBackground() {
  return (
    <div className="absolute inset-0 bg-[#0a0a0a] overflow-hidden pointer-events-none">
      <div 
        className="absolute top-[-50%] left-[-20%] w-[140%] h-[100%] opacity-20 blur-[150px] rounded-[100%]"
        style={{ background: 'var(--extracted-primary, #ffffff)' }}
      />
    </div>
  );
}
