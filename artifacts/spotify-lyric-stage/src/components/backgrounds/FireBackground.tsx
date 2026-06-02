import React, { useEffect, useRef } from 'react';

export default function FireBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * width,
      y: height + Math.random() * 100,
      size: Math.random() * 5 + 2,
      speedY: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 2,
      life: Math.random() * 100 + 50,
      maxLife: 150,
    }));

    let animationId: number;

    const render = () => {
      ctx.fillStyle = 'rgba(10, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';

      particles.forEach(p => {
        const opacity = Math.max(0, p.life / p.maxLife);
        
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(255, 200, 0, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(255, 50, 0, ${opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.y -= p.speedY;
        p.x += p.speedX;
        p.life--;

        if (p.life <= 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
          p.life = p.maxLife;
          p.size = Math.random() * 5 + 2;
        }
      });

      ctx.globalCompositeOperation = 'source-over';

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

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none bg-[#0a0000]" />;
}
