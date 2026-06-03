import { useEffect, useRef } from "react";

interface VisualizerProps {
  type: number; // 0=off, 1-18=effects
}

export const VISUALIZER_COUNT = 19; // 0 through 18

const NAMES = [
  "Off", "Ripple", "Equalizer", "Particle Storm", "Aurora Waves", "DNA Helix",
  "Glitch", "Wormhole", "Starfield", "Kaleidoscope", "Plasma", "Neon Grid",
  "Fireworks", "Snowfall", "Lightning", "Ocean Waves", "Fractal Tree", "Sound Rings", "Pulse Circles"
];
export { NAMES as VisualizerNames };

export default function Visualizer({ type }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || type === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let t = 0;
    let animId: number;

    // Persistent state
    const fireworks: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[] = [];
    const snowflakes: { x: number; y: number; size: number; speed: number; wobble: number; opacity: number }[] = [];
    const lightningBolts: { points: { x: number; y: number }[]; life: number; opacity: number }[] = [];

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);

    const getColor = () => {
      const s = getComputedStyle(document.documentElement);
      return s.getPropertyValue("--extracted-primary").trim() || "#fff";
    };

    // Parse hex color to rgb
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) || 255;
      const g = parseInt(hex.slice(3, 5), 16) || 255;
      const b = parseInt(hex.slice(5, 7), 16) || 255;
      return { r, g, b };
    };

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.016;
      const color = getColor();
      const cx = W / 2, cy = H / 2;
      const minDim = Math.min(W, H);

      // ── 1: Ripple Rings ──
      if (type === 1) {
        for (let i = 0; i < 8; i++) {
          const phase = (t * 0.8 + i * 0.75) % (Math.PI * 2);
          const r = ((phase / (Math.PI * 2)) * minDim * 0.55);
          const alpha = 0.6 * (1 - phase / (Math.PI * 2));
          ctx.strokeStyle = color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 2 + (1 - phase / (Math.PI * 2)) * 3;
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
          const x = i * bw + bw * 0.12, y = H - h, w2 = bw * 0.76, r2 = 3;
          ctx.beginPath();
          ctx.moveTo(x + r2, y); ctx.lineTo(x + w2 - r2, y);
          ctx.arcTo(x + w2, y, x + w2, y + r2, r2);
          ctx.lineTo(x + w2, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + r2);
          ctx.arcTo(x, y, x + r2, y, r2); ctx.closePath();
          ctx.fill();
        }
      }

      // ── 3: Particle Storm ──
      else if (type === 3) {
        for (let i = 0; i < 120; i++) {
          const angle = (i / 120) * Math.PI * 2 + t * 0.3;
          const dist = ((Math.sin(t * 0.8 + i * 0.5) * 0.5 + 0.5) * 0.4 + 0.05) * minDim;
          const x = cx + Math.cos(angle) * dist;
          const y = cy + Math.sin(angle) * dist;
          const size = Math.sin(t * 1.5 + i) * 3 + 4;
          const alpha = Math.sin(t + i * 0.3) * 0.3 + 0.5;
          ctx.globalAlpha = alpha * 0.6;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          // Trail
          ctx.globalAlpha = alpha * 0.15;
          const trailLen = 15;
          const trailAngle = angle - 0.03;
          const trailDist = dist - 5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(cx + Math.cos(trailAngle) * trailDist, cy + Math.sin(trailAngle) * trailDist);
          ctx.strokeStyle = color;
          ctx.lineWidth = size * 0.5;
          ctx.stroke();
        }
      }

      // ── 4: Aurora Waves ──
      else if (type === 4) {
        const waves = 6;
        for (let w = 0; w < waves; w++) {
          const gradient = ctx.createLinearGradient(0, 0, W, 0);
          gradient.addColorStop(0, `${color}00`);
          gradient.addColorStop(0.3 + w * 0.06, `${color}${Math.round((0.2 + w * 0.06) * 255).toString(16).padStart(2, "0")}`);
          gradient.addColorStop(0.7 - w * 0.04, `${color}${Math.round((0.15 + w * 0.04) * 255).toString(16).padStart(2, "0")}`);
          gradient.addColorStop(1, `${color}00`);
          ctx.beginPath();
          ctx.moveTo(0, cy);
          for (let x = 0; x <= W; x += 3) {
            const phase = (x / W) * Math.PI * (2 + w) + t * (0.8 + w * 0.3) + w * 1.2;
            const amplitude = (H * 0.18 + w * 20);
            const y = cy + Math.sin(phase) * amplitude * Math.sin(t * 0.2 + w * 0.5) + Math.cos(phase * 0.7 + t) * 15;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(W, cy);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3 - w * 0.25;
          ctx.globalAlpha = 0.55 - w * 0.06;
          ctx.stroke();
        }
      }

      // ── 5: DNA Helix ──
      else if (type === 5) {
        const helixW = 140, helixH = H * 0.85;
        const startY = H * 0.08;
        const steps = 70;
        for (let i = 0; i < steps; i++) {
          const progress = i / steps;
          const y = startY + progress * helixH;
          const phase = progress * Math.PI * 6 + t * 1.5;
          const x1 = cx - helixW / 2 + (Math.cos(phase) * 0.5 + 0.5) * helixW;
          const x2 = cx - helixW / 2 + (Math.cos(phase + Math.PI) * 0.5 + 0.5) * helixW;
          const depth1 = (Math.cos(phase) + 1) / 2;
          const depth2 = (Math.cos(phase + Math.PI) + 1) / 2;
          const size = 4 + depth1 * 5;
          const size2 = 4 + depth2 * 5;

          ctx.globalAlpha = 0.3 + depth1 * 0.6;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x1, y, size, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 0.3 + depth2 * 0.6;
          ctx.beginPath();
          ctx.arc(x2, y, size2, 0, Math.PI * 2);
          ctx.fill();

          if (i % 3 === 0) {
            ctx.globalAlpha = 0.12;
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
          for (let i = 0; i < 12; i++) {
            const y = Math.random() * H;
            const h2 = Math.random() * 25 + 2;
            const xOffset = (Math.random() - 0.5) * 100;
            ctx.globalAlpha = 0.12 + Math.random() * 0.18;
            ctx.fillStyle = color;
            ctx.fillRect(xOffset, y, W - xOffset, h2);
          }
        }
        for (let i = 0; i < 4; i++) {
          const y = cy + Math.sin(t * 3 + i * 2.1) * H * 0.3;
          const offset = 10 * (i - 1.5);
          ctx.globalAlpha = 0.15;
          ctx.strokeStyle = ["#ff0044", "#00ff88", "#0088ff", "#ffaa00"][i];
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, y + offset);
          ctx.lineTo(W, y + offset);
          ctx.stroke();
        }
        for (let i = 0; i < 8; i++) {
          if (Math.random() > 0.65) {
            ctx.globalAlpha = 0.06 + Math.random() * 0.06;
            ctx.fillStyle = color;
            ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 250 + 20, Math.random() * 6 + 1);
          }
        }
      }

      // ── 7: Wormhole Spiral ──
      else if (type === 7) {
        for (let ring = 1; ring <= 25; ring++) {
          const angle = t * 1.2 + ring * 0.5;
          const r = ring * (minDim / 2 / 25);
          const alpha = 1 - ring / 25;
          const wobble = Math.sin(t * 2 + ring * 0.8) * 15;
          ctx.strokeStyle = color;
          ctx.globalAlpha = alpha * 0.5;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(angle) * wobble, cy + Math.sin(angle) * wobble * 0.4,
            r, r * (0.2 + ring / 50), angle, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // ── 8: Starfield Warp ──
      else if (type === 8) {
        const stars = 200;
        for (let i = 0; i < stars; i++) {
          const seed = i * 137.5;
          const angle = seed * 0.618 * Math.PI * 2;
          const baseDist = (seed % 1) * minDim * 0.55;
          const warpSpeed = 0.6;
          const dist = ((baseDist + t * warpSpeed * 80 * (baseDist / (minDim * 0.55) + 0.1)) % (minDim * 0.55));
          const x = cx + Math.cos(angle) * dist;
          const y = cy + Math.sin(angle) * dist * 0.55;
          const size = (dist / (minDim * 0.55)) * 4 + 0.5;
          const alpha = dist / (minDim * 0.55);

          ctx.globalAlpha = alpha * 0.7;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();

          // Star trails
          if (size > 2) {
            ctx.globalAlpha = alpha * 0.2;
            ctx.strokeStyle = color;
            ctx.lineWidth = size * 0.5;
            const trailLen = size * 3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - Math.cos(angle) * trailLen, y - Math.sin(angle) * trailLen * 0.55);
            ctx.stroke();
          }
        }
      }

      // ── 9: Kaleidoscope ──
      else if (type === 9) {
        const segments = 10;
        ctx.save();
        ctx.translate(cx, cy);
        for (let seg = 0; seg < segments; seg++) {
          ctx.save();
          ctx.rotate((seg / segments) * Math.PI * 2 + t * 0.1);
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, minDim * 0.4);
          gradient.addColorStop(0, `${color}00`);
          gradient.addColorStop(0.5, `${color}${Math.round((0.3 + Math.sin(t + seg) * 0.15) * 255).toString(16).padStart(2, "0")}`);
          gradient.addColorStop(1, `${color}00`);
          for (let j = 0; j < 6; j++) {
            const r = (j * 0.18 + Math.sin(t * 1.2 + seg * 0.8 + j) * 0.1 + 0.1) * minDim * 0.45;
            const a = Math.sin(t * 0.8 + j * 0.7) * Math.PI * 0.4;
            ctx.globalAlpha = 0.22;
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

      // ── 10: Plasma Flow ──
      else if (type === 10) {
        const { r, g, b } = hexToRgb(color);
        const step = 32;
        for (let x = 0; x < W; x += step) {
          for (let y = 0; y < H; y += step) {
            const v1 = Math.sin(x * 0.003 + t);
            const v2 = Math.sin(y * 0.004 + t * 0.7);
            const v3 = Math.sin((x * 0.002 + y * 0.002) + t * 0.5);
            const v4 = Math.sin(Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) * 0.003 - t * 1.2);
            const v = (v1 + v2 + v3 + v4) / 4;
            const intensity = (v + 1) / 2;
            ctx.globalAlpha = intensity * 0.25;
            ctx.fillStyle = `rgb(${Math.round(r * intensity)}, ${Math.round(g * intensity)}, ${Math.round(b * (1 - intensity * 0.3))})`;
            ctx.fillRect(x, y, step, step);
          }
        }
      }

      // ── 11: Neon Grid ──
      else if (type === 11) {
        const gridSize = 60;
        const perspective = 0.003;
        const horizonY = H * 0.35;

        // Horizontal lines
        for (let i = 0; i < 20; i++) {
          const baseY = horizonY + (i * i * 3) + ((t * 60) % (gridSize * 1.5));
          if (baseY > H + 20 || baseY < horizonY - 10) continue;
          const alpha = Math.min(1, (baseY - horizonY) / (H * 0.4)) * 0.4;
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, baseY);
          ctx.lineTo(W, baseY);
          ctx.stroke();
        }

        // Vertical lines (perspective)
        for (let i = -15; i <= 15; i++) {
          const x = cx + i * gridSize;
          const topX = cx + i * 5;
          const alpha = 0.3 - Math.abs(i) * 0.015;
          if (alpha <= 0) continue;
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(topX, horizonY);
          ctx.lineTo(x, H);
          ctx.stroke();
        }

        // Horizon glow
        const horizGlow = ctx.createLinearGradient(0, horizonY - 30, 0, horizonY + 30);
        horizGlow.addColorStop(0, `${color}00`);
        horizGlow.addColorStop(0.5, `${color}40`);
        horizGlow.addColorStop(1, `${color}00`);
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = horizGlow;
        ctx.fillRect(0, horizonY - 30, W, 60);

        // Sun
        const sunR = 50 + Math.sin(t * 0.5) * 5;
        const sunGrad = ctx.createRadialGradient(cx, horizonY - 20, 0, cx, horizonY - 20, sunR * 2);
        sunGrad.addColorStop(0, `${color}88`);
        sunGrad.addColorStop(0.5, `${color}33`);
        sunGrad.addColorStop(1, `${color}00`);
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(cx, horizonY - 20, sunR * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── 12: Fireworks ──
      else if (type === 12) {
        // Spawn new fireworks
        if (Math.random() > 0.96) {
          const fx = Math.random() * W;
          const fy = Math.random() * H * 0.5 + H * 0.1;
          const num = 30 + Math.random() * 40;
          const { r, g, b } = hexToRgb(color);
          for (let i = 0; i < num; i++) {
            const angle = (i / num) * Math.PI * 2 + Math.random() * 0.3;
            const speed = 1.5 + Math.random() * 3;
            fireworks.push({
              x: fx, y: fy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
              color: `rgb(${r + Math.random() * 50}, ${g + Math.random() * 50}, ${b + Math.random() * 50})`,
              size: 2 + Math.random() * 2,
            });
          }
        }

        // Update & draw
        for (let i = fireworks.length - 1; i >= 0; i--) {
          const p = fireworks[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.03; // gravity
          p.life -= 0.012;
          if (p.life <= 0) { fireworks.splice(i, 1); continue; }
          ctx.globalAlpha = p.life * 0.7;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
          // Glow
          ctx.globalAlpha = p.life * 0.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        // Cap particles
        if (fireworks.length > 800) fireworks.splice(0, 200);
      }

      // ── 13: Snowfall ──
      else if (type === 13) {
        // Init snowflakes
        while (snowflakes.length < 150) {
          snowflakes.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: 1 + Math.random() * 4,
            speed: 0.3 + Math.random() * 1.2,
            wobble: Math.random() * Math.PI * 2,
            opacity: 0.2 + Math.random() * 0.6,
          });
        }

        for (const s of snowflakes) {
          s.y += s.speed;
          s.x += Math.sin(t + s.wobble) * 0.5;
          if (s.y > H + 10) { s.y = -10; s.x = Math.random() * W; }
          if (s.x > W + 10) s.x = -10;
          if (s.x < -10) s.x = W + 10;

          ctx.globalAlpha = s.opacity;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();

          // Sparkle on larger flakes
          if (s.size > 2.5) {
            ctx.globalAlpha = s.opacity * 0.3;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ── 14: Lightning Storm ──
      else if (type === 14) {
        // Background flicker
        if (Math.random() > 0.97) {
          ctx.globalAlpha = 0.04 + Math.random() * 0.04;
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, W, H);
        }

        // Generate bolts
        if (Math.random() > 0.95) {
          const startX = Math.random() * W;
          const points: { x: number; y: number }[] = [{ x: startX, y: 0 }];
          let px = startX, py = 0;
          const segments = 12 + Math.floor(Math.random() * 8);
          for (let i = 0; i < segments; i++) {
            px += (Math.random() - 0.5) * 80;
            py += H / segments + Math.random() * 20;
            points.push({ x: px, y: py });
          }
          lightningBolts.push({ points, life: 1, opacity: 0.6 + Math.random() * 0.4 });
        }

        // Draw & fade bolts
        for (let i = lightningBolts.length - 1; i >= 0; i--) {
          const bolt = lightningBolts[i];
          bolt.life -= 0.04;
          if (bolt.life <= 0) { lightningBolts.splice(i, 1); continue; }

          // Glow
          ctx.globalAlpha = bolt.life * bolt.opacity * 0.3;
          ctx.strokeStyle = color;
          ctx.lineWidth = 8;
          ctx.lineCap = "round";
          ctx.beginPath();
          bolt.points.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
          ctx.stroke();

          // Core
          ctx.globalAlpha = bolt.life * bolt.opacity;
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          bolt.points.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
          ctx.stroke();

          // Branches
          for (let j = 3; j < bolt.points.length; j += 3) {
            if (Math.random() > 0.5) continue;
            const bp = bolt.points[j];
            const bLen = 3;
            ctx.globalAlpha = bolt.life * 0.3;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bp.x, bp.y);
            let bx = bp.x, by = bp.y;
            for (let k = 0; k < bLen; k++) {
              bx += (Math.random() - 0.5) * 40;
              by += 15 + Math.random() * 10;
              ctx.lineTo(bx, by);
            }
            ctx.stroke();
          }
        }
        if (lightningBolts.length > 10) lightningBolts.splice(0, 5);
      }

      // ── 15: Ocean Waves ──
      else if (type === 15) {
        const waveCount = 8;
        for (let w = 0; w < waveCount; w++) {
          const baseY = H * 0.5 + w * 35;
          const amplitude = 20 - w * 1.5;
          const freq = 0.006 + w * 0.001;
          const speed = t * (0.8 + w * 0.15);
          const alpha = 0.35 - w * 0.035;

          ctx.beginPath();
          ctx.moveTo(0, H);
          for (let x = 0; x <= W; x += 2) {
            const y = baseY +
              Math.sin(x * freq + speed) * amplitude +
              Math.sin(x * freq * 2.3 + speed * 1.4) * amplitude * 0.4 +
              Math.cos(x * freq * 0.7 + speed * 0.6) * amplitude * 0.3;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(W, H);
          ctx.closePath();

          const gradient = ctx.createLinearGradient(0, baseY - amplitude, 0, H);
          gradient.addColorStop(0, `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`);
          gradient.addColorStop(0.5, `${color}${Math.round(alpha * 0.5 * 255).toString(16).padStart(2, "0")}`);
          gradient.addColorStop(1, `${color}08`);

          ctx.globalAlpha = 1;
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Foam dots
        for (let i = 0; i < 30; i++) {
          const fx = (i / 30) * W + Math.sin(t + i) * 20;
          const fy = H * 0.5 + Math.sin(fx * 0.008 + t * 0.8) * 18 - 3;
          ctx.globalAlpha = 0.3 + Math.sin(t * 2 + i) * 0.15;
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(fx, fy, 1.5 + Math.sin(t + i) * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── 16: Fractal Tree ──
      else if (type === 16) {
        ctx.strokeStyle = color;
        ctx.lineCap = "round";

        const drawBranch = (x: number, y: number, angle: number, length: number, depth: number) => {
          if (depth <= 0 || length < 3) return;

          const endX = x + Math.cos(angle) * length;
          const endY = y + Math.sin(angle) * length;

          ctx.globalAlpha = 0.15 + (depth / 10) * 0.4;
          ctx.lineWidth = depth * 0.7;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Leaves at tips
          if (depth <= 2) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(endX, endY, 3, 0, Math.PI * 2);
            ctx.fill();
          }

          const sway = Math.sin(t * 0.8 + depth * 0.5) * 0.08;
          const spread = 0.4 + Math.sin(t * 0.3 + depth) * 0.08;

          drawBranch(endX, endY, angle - spread + sway, length * 0.72, depth - 1);
          drawBranch(endX, endY, angle + spread + sway, length * 0.72, depth - 1);
        };

        drawBranch(cx, H * 0.9, -Math.PI / 2, H * 0.22, 9);
      }

      // ── 17: Sound Rings ──
      else if (type === 17) {
        for (let i = 0; i < 12; i++) {
          const baseR = 30 + i * 25;
          const wobble = Math.sin(t * 2 + i * 0.8) * 15;
          const r = baseR + wobble;
          const segments = 64;

          ctx.beginPath();
          for (let s = 0; s <= segments; s++) {
            const angle = (s / segments) * Math.PI * 2;
            const distortion = Math.sin(angle * (3 + i) + t * (1.5 + i * 0.2)) * (8 + i * 2);
            const px = cx + Math.cos(angle) * (r + distortion);
            const py = cy + Math.sin(angle) * (r + distortion);
            s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath();

          ctx.globalAlpha = 0.25 - i * 0.015;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Fill with very low opacity
          ctx.globalAlpha = 0.03;
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      // ── 18: Pulse Circles ──
      else if (type === 18) {
        const numPulses = 6;
        for (let i = 0; i < numPulses; i++) {
          const phase = (t * 0.6 + i * (1 / numPulses)) % 1;
          const maxR = minDim * 0.45;
          const r = phase * maxR;
          const alpha = (1 - phase) * 0.5;

          // Outer ring
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = color;
          ctx.lineWidth = 3 * (1 - phase) + 1;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();

          // Inner glow
          const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r);
          glowGrad.addColorStop(0, `${color}00`);
          glowGrad.addColorStop(1, `${color}${Math.round(alpha * 0.3 * 255).toString(16).padStart(2, "0")}`);
          ctx.globalAlpha = 1;
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Central pulse
        const beatPulse = Math.sin(t * 4) * 0.3 + 0.7;
        ctx.globalAlpha = 0.3 * beatPulse;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, 15 * beatPulse, 0, Math.PI * 2);
        ctx.fill();

        // Rotating particles around center
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2 + t * 0.5;
          const dist = 40 + Math.sin(t * 2 + i) * 15;
          const px = cx + Math.cos(angle) * dist;
          const py = cy + Math.sin(angle) * dist;
          ctx.globalAlpha = 0.4 + Math.sin(t + i * 0.5) * 0.2;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
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
