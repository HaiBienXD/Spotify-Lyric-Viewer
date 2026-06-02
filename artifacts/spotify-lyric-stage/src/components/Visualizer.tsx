import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  type: number;
}

export default function Visualizer({ type }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let animationId: number;
    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.05;

      const style = getComputedStyle(document.documentElement);
      const color = style.getPropertyValue('--extracted-primary').trim() || '#fff';

      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.3;

      if (type === 1) { // Circular Spectrum
        const cx = width / 2;
        const cy = height / 2;
        const radius = 200;
        const bars = 64;
        
        ctx.beginPath();
        for (let i = 0; i < bars; i++) {
          const angle = (i / bars) * Math.PI * 2;
          const noise = Math.sin(time * 2 + i) * Math.cos(time + i * 2) * 50 + 50;
          
          const x1 = cx + Math.cos(angle) * radius;
          const y1 = cy + Math.sin(angle) * radius;
          const x2 = cx + Math.cos(angle) * (radius + noise);
          const y2 = cy + Math.sin(angle) * (radius + noise);
          
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
      } 
      else if (type === 2) { // Equalizer Bars
        const bars = 32;
        const barWidth = width / bars;
        
        for (let i = 0; i < bars; i++) {
          const noise = Math.abs(Math.sin(time * 3 + i * 0.5) * Math.cos(time + i * 0.2)) * 200 + 20;
          ctx.fillRect(i * barWidth + barWidth * 0.2, height - noise, barWidth * 0.6, noise);
        }
      }
      else if (type === 3) { // Floating Particles
        for (let i = 0; i < 50; i++) {
          const x = (Math.sin(time * 0.5 + i) * 0.5 + 0.5) * width;
          const y = ((Math.cos(time * 0.2 + i) * 0.5 + 0.5) * height + time * 50) % height;
          const size = Math.sin(time + i) * 5 + 5;
          
          ctx.beginPath();
          ctx.arc(x, height - y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      else if (type === 4) { // Orbit Rings
        const cx = width / 2;
        const cy = height / 2;
        
        for (let i = 1; i <= 4; i++) {
          const radius = i * 100;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.lineWidth = 2;
          ctx.stroke();
          
          const pAngle = time * (1/i);
          const px = cx + Math.cos(pAngle) * radius;
          const py = cy + Math.sin(pAngle) * radius;
          
          ctx.beginPath();
          ctx.arc(px, py, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }

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
  }, [type]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none mix-blend-screen" />;
}
