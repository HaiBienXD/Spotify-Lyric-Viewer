import { useEffect, useRef } from "react";

export default function RainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let raf: number;

    const drops = Array.from({ length: 250 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      len: Math.random() * 22 + 8,
      speed: Math.random() * 18 + 12,
      alpha: Math.random() * 0.4 + 0.15,
      width: Math.random() * 0.8 + 0.3,
    }));

    // Reflected drops (at bottom)
    const reflections = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: h - Math.random() * h * 0.25,
      r: Math.random() * 1.5 + 0.5,
      life: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
    }));

    const render = () => {
      ctx.fillStyle = "rgba(8,12,20,0.35)";
      ctx.fillRect(0, 0, w, h);

      // City lights glow at bottom
      const glow = ctx.createLinearGradient(0, h * 0.7, 0, h);
      glow.addColorStop(0, "transparent");
      glow.addColorStop(1, "rgba(30,60,120,0.25)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Rain drops
      ctx.lineCap = "round";
      drops.forEach((d) => {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.len * 0.15, d.y + d.len);
        ctx.strokeStyle = `rgba(180,210,255,${d.alpha})`;
        ctx.lineWidth = d.width;
        ctx.stroke();

        d.y += d.speed;
        if (d.y > h + d.len) {
          d.y = -d.len;
          d.x = Math.random() * w;
        }
      });

      // Ripples / splashes at bottom
      ctx.globalCompositeOperation = "screen";
      reflections.forEach((r) => {
        r.life += r.speed;
        if (r.life > 1) {
          r.life = 0;
          r.x = Math.random() * w;
          r.y = h - Math.random() * h * 0.2;
          r.r = Math.random() * 1.5 + 0.5;
        }
        const a = 1 - r.life;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r * (1 + r.life * 6), r.r * (1 + r.life * 2), 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(150,200,255,${a * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(render);
    };

    render();
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ background: "#080c14" }} />;
}
