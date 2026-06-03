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
    let t = 0;
    let raf: number;

    type Ember = {
      x: number; y: number; vx: number; vy: number;
      life: number; maxLife: number; size: number; hue: number;
    };

    const embers: Ember[] = Array.from({ length: 120 }, () => mkEmber(w, h));

    function mkEmber(w: number, h: number): Ember {
      const side = Math.random();
      return {
        x: w * 0.15 + Math.random() * w * 0.7,
        y: h * 0.6 + Math.random() * h * 0.45,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(Math.random() * 1.6 + 0.6),
        life: 0,
        maxLife: Math.random() * 180 + 80,
        size: Math.random() * 2.4 + 0.6,
        hue: Math.random() * 45,        // 0=red, 45=gold
      };
    }

    const render = () => {
      t++;
      ctx.clearRect(0, 0, w, h);

      // Warm gradient base
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.75, 0, w * 0.5, h * 0.75, h * 0.7);
      bg.addColorStop(0,   "rgba(120, 30, 5, 0.32)");
      bg.addColorStop(0.4, "rgba(70, 10, 2, 0.18)");
      bg.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Slow undulating glow columns
      for (let col = 0; col < 5; col++) {
        const cx = w * (0.1 + col * 0.2) + Math.sin(t * 0.008 + col * 1.2) * 30;
        const cy = h * 0.7 + Math.sin(t * 0.006 + col * 0.8) * 20;
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, h * 0.35);
        const hue = 15 + col * 8;
        gr.addColorStop(0,   `hsla(${hue}, 95%, 55%, 0.12)`);
        gr.addColorStop(0.5, `hsla(${hue}, 90%, 40%, 0.05)`);
        gr.addColorStop(1,   "transparent");
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, w, h);
      }

      // Embers
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const e of embers) {
        e.life++;
        e.x += e.vx + Math.sin(t * 0.015 + e.y * 0.01) * 0.3;
        e.y += e.vy;
        e.vy *= 0.998;

        const prog = e.life / e.maxLife;
        const alpha = prog < 0.15
          ? prog / 0.15
          : prog > 0.75
          ? (1 - prog) / 0.25
          : 1;

        const hue = 10 + e.hue;
        const sat = 90 + e.hue;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * (1 - prog * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, ${sat}%, 70%, ${alpha * 0.85})`;
        ctx.fill();

        // Soft halo around brighter embers
        if (e.size > 1.5) {
          const halo = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 4);
          halo.addColorStop(0, `hsla(${hue}, 80%, 65%, ${alpha * 0.15})`);
          halo.addColorStop(1, "transparent");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        if (e.life >= e.maxLife || e.y < -20) {
          Object.assign(e, mkEmber(w, h));
        }
      }
      ctx.restore();

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
