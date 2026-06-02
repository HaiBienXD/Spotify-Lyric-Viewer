import React, { useEffect, useRef } from 'react';

export default function RainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const drops = Array.from({ length: 200 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 20 + 10,
      speed: Math.random() * 15 + 10,
    }));

    let animationId: number;

    const render = () => {
      ctx.fillStyle = 'rgba(10, 15, 20, 0.3)';
      ctx.fillRect(0, 0, width, height);

      const style = getComputedStyle(document.documentElement);
      const color = style.getPropertyValue('--extracted-primary').trim() || 'rgba(100, 150, 255, 0.5)';

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';

      ctx.beginPath();
      drops.forEach(drop => {
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        
        drop.y += drop.speed;
        
        if (drop.y > height) {
          drop.y = -20;
          drop.x = Math.random() * width;
        }
      });
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none bg-[#0a0f14]" />;
}
