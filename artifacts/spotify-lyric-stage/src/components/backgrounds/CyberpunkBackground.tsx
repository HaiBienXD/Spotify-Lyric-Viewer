import { useEffect, useRef } from "react";

export default function CyberpunkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let t = 0;
    let raf: number;

    const render = () => {
      t += 0.02;

      ctx.fillStyle = "#060008";
      ctx.fillRect(0, 0, w, h);

      // Animated city horizon silhouette
      ctx.fillStyle = "#0a0010";
      const buildingHeights = [0.55, 0.4, 0.65, 0.5, 0.45, 0.6, 0.35, 0.58, 0.42, 0.52, 0.48, 0.38];
      const bw = w / buildingHeights.length;
      buildingHeights.forEach((bh, i) => {
        ctx.fillRect(i * bw, h * bh, bw - 2, h * (1 - bh));
      });

      // Neon horizon line
      const hl = ctx.createLinearGradient(0, 0, w, 0);
      hl.addColorStop(0, "transparent");
      hl.addColorStop(0.2, "#ff00cc");
      hl.addColorStop(0.5, "#ffcc00");
      hl.addColorStop(0.8, "#00ffcc");
      hl.addColorStop(1, "transparent");
      ctx.fillStyle = hl;
      ctx.fillRect(0, h * 0.62, w, 2);

      // Floor grid perspective
      ctx.save();
      ctx.globalAlpha = 0.2;
      for (let col = 0; col <= 20; col++) {
        const x = (col / 20) * w;
        ctx.strokeStyle = "#ff00cc";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, h * 0.62);
        const destX = w / 2 + (x - w / 2) * 0.05;
        ctx.lineTo(destX, h);
        ctx.stroke();
      }
      for (let row = 0; row <= 12; row++) {
        const frac = row / 12;
        const y = h * 0.62 + (h * 0.38) * (frac * frac);
        const xLeft = w / 2 - (w / 2) * (1 - frac * 0.95);
        const xRight = w / 2 + (w / 2) * (1 - frac * 0.95);
        ctx.strokeStyle = "#ff00cc";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(xLeft, y);
        ctx.lineTo(xRight, y);
        ctx.stroke();
      }
      ctx.restore();

      // Glitch flicker bars
      if (Math.random() > 0.96) {
        const glitchY = Math.random() * h;
        ctx.fillStyle = `rgba(255,0,200,${Math.random() * 0.06})`;
        ctx.fillRect(0, glitchY, w, Math.random() * 4 + 1);
      }

      // Scanlines
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 2);
      }

      // Color bloom top
      const bloom = ctx.createRadialGradient(w / 2, -h * 0.2, 0, w / 2, -h * 0.2, h * 0.8);
      bloom.addColorStop(0, "rgba(255,0,200,0.07)");
      bloom.addColorStop(1, "transparent");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(render);
    };

    render();
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}
