import { useEffect, useRef } from "react";

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const FS = 14;
    let columns = Math.floor(w / FS);
    let drops = Array.from({ length: columns }, () => Math.random() * (h / FS));
    let raf: number;

    const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF";

    const render = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, w, h);

      ctx.font = `bold ${FS}px monospace`;

      drops.forEach((y, i) => {
        const x = i * FS;
        // Head character — bright
        const headChar = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillStyle = "#ccffcc";
        ctx.fillText(headChar, x, y * FS);

        // Trail character — green
        const trailChar = CHARS[Math.floor(Math.random() * CHARS.length)];
        const alpha = Math.max(0.05, 1 - (y * FS) / h);
        ctx.fillStyle = `rgba(0, 200, 80, ${alpha * 0.6})`;
        ctx.fillText(trailChar, x, (y - 1) * FS);

        drops[i]++;
        if (drops[i] * FS > h && Math.random() > 0.975) {
          drops[i] = 0;
        }
      });

      raf = requestAnimationFrame(render);
    };

    render();
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      columns = Math.floor(w / FS);
      drops = Array.from({ length: columns }, () => Math.random() * (h / FS));
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none bg-black" />;
}
