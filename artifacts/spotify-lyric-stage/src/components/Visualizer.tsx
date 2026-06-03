import { useEffect, useRef } from "react";

interface VisualizerProps {
  type: number; // 0=off, 1-9=effects
}

export const VISUALIZER_COUNT = 10; // 0 through 9

const NAMES = ["Off","Ripple","Equalizer","Particle Storm","Aurora Waves","DNA Helix","Glitch","Wormhole","Starfield","Kaleidoscope"];
export { NAMES as VisualizerNames };

export default function Visualizer({ type }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || type === 0) return;
    const ctx = canvas.getContext("2d")!;

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let t = 0;
    let animId: number;

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);

    const getColor = () => {
      const s = getComputedStyle(document.documentElement);
      return s.getPropertyValue("--extracted-primary").trim() || "#fff";
    };

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.016;
      const color = getColor();
      const cx = W / 2, cy = H / 2;

      // ── 1: Ripple Rings ──
      if (type === 1) {
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 6; i++) {
          const phase = (t * 0.8 + i * 0.9) % (Math.PI * 2);
          const r = ((phase / (Math.PI * 2)) * Math.min(W, H) * 0.55);
          const alpha = 0.7 * (1 - phase / (Math.PI * 2));
          ctx.strokeStyle = color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // ── 2: Equalizer Bars ──
      else if (type === 2) {
        const bars = 48;
        const bw = W / bars;
        for (let i = 0; i < bars; i++) {
          const h = Math.abs(Math.sin(t * 2.5 + i * 0.4) * Math.cos(t + i * 0.18)) * H * 0.55 + 10;
          const gradient = ctx.createLinearGradient(0, H, 0, H - h);
          gradient.addColorStop(0, `${color}cc`);
          gradient.addColorStop(1, `${color}22`);
          ctx.fillStyle = gradient;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.roundRect(i * bw + bw * 0.12, H - h, bw * 0.76, h, 3);
          ctx.fill();
        }
      }

      // ── 3: Particle Storm ──
      else if (type === 3) {
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 80; i++) {
          const angle = (i / 80) * Math.PI * 2 + t * 0.3;
          const dist = ((Math.sin(t * 0.8 + i * 0.5) * 0.5 + 0.5) * 0.4 + 0.05) * Math.min(W, H);
          const x = cx + Math.cos(angle) * dist;
          const y = cy + Math.sin(angle) * dist;
          const size = Math.sin(t * 1.5 + i) * 3 + 5;
          const alpha = Math.sin(t + i * 0.3) * 0.3 + 0.5;
          ctx.globalAlpha = alpha * 0.7;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── 4: Aurora Waves ──
      else if (type === 4) {
        const waves = 5;
        for (let w = 0; w < waves; w++) {
          const gradient = ctx.createLinearGradient(0, 0, W, 0);
          gradient.addColorStop(0, `${color}00`);
          gradient.addColorStop(0.3 + w * 0.08, `${color}${Math.round((0.2 + w * 0.08) * 255).toString(16).padStart(2,"0")}`);
          gradient.addColorStop(1, `${color}00`);

          ctx.beginPath();
          ctx.moveTo(0, cy);
          for (let x = 0; x <= W; x += 3) {
            const phase = (x / W) * Math.PI * (2 + w) + t * (0.8 + w * 0.3) + w * 1.2;
            const amplitude = (H * 0.15 + w * 25);
            const y = cy + Math.sin(phase) * amplitude * Math.sin(t * 0.2 + w * 0.5);
            ctx.lineTo(x, y);
          }
          ctx.lineTo(W, cy);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3 - w * 0.3;
          ctx.globalAlpha = 0.6 - w * 0.08;
          ctx.stroke();
        }
      }

      // ── 5: DNA Helix ──
      else if (type === 5) {
        const helixW = 120, helixH = H * 0.85;
        const startY = H * 0.08;
        const steps = 60;
        const period = 0.18;

        for (let i = 0; i < steps; i++) {
          const progress = i / steps;
          const y = startY + progress * helixH;
          const phase = progress * Math.PI * 6 + t * 1.5;
          const x1 = cx - helixW / 2 + (Math.cos(phase) * 0.5 + 0.5) * helixW;
          const x2 = cx - helixW / 2 + (Math.cos(phase + Math.PI) * 0.5 + 0.5) * helixW;
          const depth1 = (Math.cos(phase) + 1) / 2;
          const depth2 = (Math.cos(phase + Math.PI) + 1) / 2;
          const size = 4 + depth1 * 4;
          const size2 = 4 + depth2 * 4;

          ctx.globalAlpha = 0.3 + depth1 * 0.6;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x1, y, size, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 0.3 + depth2 * 0.6;
          ctx.beginPath();
          ctx.arc(x2, y, size2, 0, Math.PI * 2);
          ctx.fill();

          // Bridge line every 3 steps
          if (i % 3 === 0) {
            ctx.globalAlpha = 0.15;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.stroke();
          }
        }
      }

      // ── 6: Glitch Effect ──
      else if (type === 6) {
        const glitchPhase = Math.sin(t * 7) > 0.6;
        if (glitchPhase) {
          // Horizontal scan lines
          for (let i = 0; i < 8; i++) {
            const y = Math.random() * H;
            const h2 = Math.random() * 20 + 2;
            const xOffset = (Math.random() - 0.5) * 80;
            ctx.globalAlpha = 0.15 + Math.random() * 0.2;
            ctx.fillStyle = color;
            ctx.fillRect(xOffset, y, W - xOffset, h2);
          }
        }
        // Chromatic aberration bars
        for (let i = 0; i < 3; i++) {
          const y = cy + Math.sin(t * 3 + i * 2.1) * H * 0.3;
          const offset = 8 * (i - 1);
          ctx.globalAlpha = 0.12;
          ctx.strokeStyle = ["#ff0044","#00ff88","#0088ff"][i];
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, y + offset);
          ctx.lineTo(W, y + offset);
          ctx.stroke();
        }
        // Noise blocks
        for (let i = 0; i < 5; i++) {
          if (Math.random() > 0.7) {
            ctx.globalAlpha = 0.08;
            ctx.fillStyle = color;
            ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 200 + 20, Math.random() * 5 + 1);
          }
        }
      }

      // ── 7: Wormhole Spiral ──
      else if (type === 7) {
        for (let ring = 1; ring <= 20; ring++) {
          const angle = t * 1.2 + ring * 0.5;
          const r = ring * (Math.min(W, H) / 2 / 20);
          const alpha = 1 - ring / 20;
          const wobble = Math.sin(t * 2 + ring * 0.8) * 15;
          ctx.strokeStyle = color;
          ctx.globalAlpha = alpha * 0.5;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(angle) * wobble, cy + Math.sin(angle) * wobble * 0.4,
            r, r * (0.2 + ring / 40), angle, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // ── 8: Starfield Warp ──
      else if (type === 8) {
        const stars = 120;
        for (let i = 0; i < stars; i++) {
          const seed = i * 137.5;
          const angle = seed * 0.618 * Math.PI * 2;
          const baseDist = (seed % 1) * Math.min(W, H) * 0.55;
          // Warp: stars move outward
          const warpSpeed = 0.6;
          const dist = ((baseDist + t * warpSpeed * 80 * (baseDist / (Math.min(W, H) * 0.55) + 0.1)) % (Math.min(W, H) * 0.55));
          const x = cx + Math.cos(angle) * dist;
          const y = cy + Math.sin(angle) * dist * 0.55;
          const size = (dist / (Math.min(W, H) * 0.55)) * 4 + 0.5;
          const alpha = dist / (Math.min(W, H) * 0.55);

          ctx.globalAlpha = alpha * 0.8;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── 9: Kaleidoscope ──
      else if (type === 9) {
        const segments = 8;
        ctx.save();
        ctx.translate(cx, cy);
        for (let seg = 0; seg < segments; seg++) {
          ctx.save();
          ctx.rotate((seg / segments) * Math.PI * 2 + t * 0.1);
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(W, H) * 0.4);
          gradient.addColorStop(0, `${color}00`);
          gradient.addColorStop(0.5, `${color}${Math.round((0.3 + Math.sin(t + seg) * 0.15) * 255).toString(16).padStart(2,"0")}`);
          gradient.addColorStop(1, `${color}00`);

          for (let j = 0; j < 5; j++) {
            const r = (j * 0.2 + Math.sin(t * 1.2 + seg * 0.8 + j) * 0.1 + 0.1) * Math.min(W, H) * 0.45;
            const a = Math.sin(t * 0.8 + j * 0.7) * Math.PI * 0.4;
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(r * 0.5, 0, r * 0.35, a - 0.8, a + 0.8);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [type]);

  if (type === 0) return null;
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none mix-blend-screen" />;
}
