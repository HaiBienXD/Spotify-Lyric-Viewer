import { useEffect, useRef } from "react";

export default function AuroraBackground() {
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

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.1 + 0.2,
      phase: Math.random() * Math.PI * 2,
    }));

    const getColor = (v: string, fallback: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fallback;

    const render = () => {
      t += 0.003;
      ctx.fillStyle = "#020111";
      ctx.fillRect(0, 0, w, h);

      // Stars
      stars.forEach((s) => {
        const twinkle = 0.3 + 0.5 * Math.abs(Math.sin(t * 1.5 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.7})`;
        ctx.fill();
      });

      const c1 = getColor("--extracted-primary", "#00d4ff");
      const c2 = getColor("--extracted-secondary", "#b400ff");

      ctx.globalCompositeOperation = "screen";

      const drawWave = (
        yFrac: number, ampFrac: number, phase: number,
        speed: number, color: string, alpha: number
      ) => {
        const yBase = h * yFrac;
        const amp = h * ampFrac;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 3) {
          const frac = x / w;
          const y =
            yBase +
            Math.sin(frac * Math.PI * 4 + phase + t * speed) * amp +
            Math.sin(frac * Math.PI * 7 + phase * 1.4 + t * speed * 0.6) * amp * 0.35;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, yBase - amp * 2, 0, yBase + amp * 3);
        g.addColorStop(0, "transparent");
        g.addColorStop(0.45, color);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      };

      drawWave(0.28, 0.1, 0, 1, c1, 0.28);
      drawWave(0.4, 0.09, 2.2, 0.8, c2, 0.22);
      drawWave(0.2, 0.07, 4.5, 1.2, c1, 0.14);
      drawWave(0.5, 0.08, 1.1, 0.6, c2, 0.16);

      ctx.globalCompositeOperation = "source-over";

      // Vignette
      const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9);
      vg.addColorStop(0, "transparent");
      vg.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(render);
    };

    render();
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}
