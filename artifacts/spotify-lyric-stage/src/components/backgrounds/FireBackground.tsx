import { useEffect, useRef } from "react";

export default function FireBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let raf: number;

    const mkParticle = () => ({
      x: w * 0.3 + Math.random() * w * 0.4,
      y: h + Math.random() * 40,
      size: Math.random() * 12 + 4,
      speedY: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * 2.5,
      life: Math.random(),
      decay: Math.random() * 0.012 + 0.006,
      hue: Math.random() * 30, // 0-30: red to orange-yellow
    });

    const particles = Array.from({ length: 200 }, mkParticle);

    const render = () => {
      ctx.fillStyle = "rgba(6,0,0,0.22)";
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";

      particles.forEach((p) => {
        const a = Math.max(0, p.life);
        const r = Math.floor(255);
        const g = Math.floor(a * a * 160 + p.hue * 3);
        const b = 0;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        grad.addColorStop(0, `rgba(${r},${g},${b},${a * 0.9})`);
        grad.addColorStop(0.4, `rgba(${r},${Math.floor(g * 0.5)},0,${a * 0.4})`);
        grad.addColorStop(1, "rgba(100,0,0,0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();

        p.y -= p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.02) * 0.5;
        p.size *= 0.996;
        p.life -= p.decay;

        if (p.life <= 0 || p.y < -50) {
          Object.assign(p, mkParticle());
        }
      });

      ctx.globalCompositeOperation = "source-over";

      // Embers
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 3; i++) {
        if (Math.random() > 0.7) {
          const ex = w * 0.3 + Math.random() * w * 0.4;
          const ey = h * 0.5 + Math.random() * h * 0.4;
          ctx.beginPath();
          ctx.arc(ex, ey, Math.random() * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,200,50,${Math.random() * 0.8})`;
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // Floor glow
      const floorGlow = ctx.createLinearGradient(0, h * 0.7, 0, h);
      floorGlow.addColorStop(0, "rgba(200,30,0,0.15)");
      floorGlow.addColorStop(1, "rgba(200,30,0,0.05)");
      ctx.fillStyle = floorGlow;
      ctx.fillRect(0, h * 0.7, w, h * 0.3);

      raf = requestAnimationFrame(render);
    };

    render();
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ background: "#060000" }} />;
}
