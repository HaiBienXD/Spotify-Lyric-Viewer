import { useEffect, useRef } from "react";

export default function GalaxyBackground() {
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

    const stars = Array.from({ length: 400 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.1,
      brightness: Math.random(),
      speed: Math.random() * 0.08 + 0.01,
      phase: Math.random() * Math.PI * 2,
    }));

    const getColor = (v: string, fb: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb;

    const render = () => {
      t += 0.005;
      ctx.fillStyle = "rgba(1,1,12,0.18)";
      ctx.fillRect(0, 0, w, h);

      // Stars with slow drift + twinkle
      stars.forEach((s) => {
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(t + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${twinkle * s.brightness})`;
        ctx.fill();
        s.y -= s.speed;
        if (s.y < 0) { s.y = h; s.x = Math.random() * w; }
      });

      const c1 = getColor("--extracted-primary", "#6600ff");
      const c2 = getColor("--extracted-secondary", "#00aaff");

      ctx.globalCompositeOperation = "screen";

      // Two slow rotating nebula clouds
      const draw = (cx: number, cy: number, radius: number, color: string, alpha: number) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        g.addColorStop(0, color);
        g.addColorStop(0.5, color);
        g.addColorStop(1, "transparent");
        ctx.globalAlpha = alpha;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      };

      const ox1 = Math.sin(t * 0.4) * w * 0.18;
      const oy1 = Math.cos(t * 0.3) * h * 0.14;
      const ox2 = Math.cos(t * 0.35) * w * 0.15;
      const oy2 = Math.sin(t * 0.45) * h * 0.12;

      draw(w / 2 + ox1, h / 2 + oy1, Math.min(w, h) * 0.45, c1, 0.09);
      draw(w / 2 + ox2, h / 2 + oy2, Math.min(w, h) * 0.38, c2, 0.08);
      draw(w * 0.2, h * 0.3, Math.min(w, h) * 0.25, c1, 0.05);
      draw(w * 0.8, h * 0.7, Math.min(w, h) * 0.25, c2, 0.05);

      ctx.globalCompositeOperation = "source-over";

      // Vignette
      const vg = ctx.createRadialGradient(w/2, h/2, h*0.25, w/2, h/2, h*0.85);
      vg.addColorStop(0, "transparent");
      vg.addColorStop(1, "rgba(0,0,8,0.7)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(render);
    };

    render();
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ background: "#01010c" }} />;
}
