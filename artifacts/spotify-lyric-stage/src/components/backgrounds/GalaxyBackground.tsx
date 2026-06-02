import React, { useEffect, useRef } from 'react';

export default function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const stars = Array.from({ length: 300 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2,
      speed: Math.random() * 0.5 + 0.1,
    }));

    let animationId: number;

    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#fff';
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        star.y -= star.speed;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }
      });

      // Draw nebula clouds using extracted colors
      const style = getComputedStyle(document.documentElement);
      const color1 = style.getPropertyValue('--extracted-primary').trim() || 'rgba(100, 0, 255, 0.1)';
      const color2 = style.getPropertyValue('--extracted-secondary').trim() || 'rgba(0, 200, 255, 0.1)';

      const time = Date.now() * 0.0005;

      const grad1 = ctx.createRadialGradient(
        width / 2 + Math.sin(time) * 200, 
        height / 2 + Math.cos(time) * 200, 
        0, 
        width / 2, height / 2, width / 2
      );
      // Hacky parse of rgb string to add alpha, just overlaying it with globalAlpha instead
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = color1;
      ctx.beginPath();
      ctx.arc(width/2 + Math.sin(time)*200, height/2 + Math.cos(time)*200, width/2, 0, Math.PI*2);
      ctx.fill();

      ctx.fillStyle = color2;
      ctx.beginPath();
      ctx.arc(width/2 + Math.cos(time*1.2)*200, height/2 + Math.sin(time*0.8)*200, width/2, 0, Math.PI*2);
      ctx.fill();
      
      ctx.globalAlpha = 1.0;

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

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none bg-black" />;
}
