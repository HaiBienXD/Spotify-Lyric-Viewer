import { useEffect, useRef } from "react";

interface BeatWaveProps {
  beat: number;
  bpm: number;
  isPlaying: boolean;
}

export default function BeatWave({ beat, bpm, isPlaying }: BeatWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beatTimeRef = useRef(performance.now());
  const tRef = useRef(0);
  const animRef = useRef(0);
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    beatTimeRef.current = performance.now();
  }, [beat]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const setSize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    setSize();
    window.addEventListener("resize", setSize);

    const numBars = 24;
    if (barsRef.current.length !== numBars) {
      barsRef.current = Array(numBars).fill(0);
    }

    const render = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      tRef.current += 0.025;

      const style = getComputedStyle(document.documentElement);
      const color = style.getPropertyValue("--extracted-primary").trim() || "#1DB954";

      const beatInterval = bpm > 0 ? 60000 / bpm : 500;
      const elapsed = performance.now() - beatTimeRef.current;
      const phase = Math.min(elapsed / beatInterval, 1);
      const envelope = isPlaying
        ? (phase < 0.06 ? phase / 0.06 : Math.pow(1 - (phase - 0.06) / 0.94, 2.0))
        : 0.05;

      const barWidth = W / numBars;
      const gap = Math.max(1, barWidth * 0.18);
      const bars = barsRef.current;

      for (let i = 0; i < numBars; i++) {
        // Multi-frequency target
        const t = tRef.current;
        const freq1 = Math.sin(t * 2.2 + i * 0.45) * 0.4;
        const freq2 = Math.cos(t * 1.3 + i * 0.28) * 0.3;
        const freq3 = Math.sin(t * 3.8 + i * 0.62) * 0.2;
        const centerBoost = 1 - Math.abs(i - numBars / 2) / (numBars / 2) * 0.35;

        const target = isPlaying
          ? ((freq1 + freq2 + freq3 + 1) / 2) * envelope * centerBoost * 0.85 + 0.05
          : 0.03 + Math.sin(t * 0.5 + i * 0.3) * 0.02;

        // Smooth interpolation
        bars[i] += (target - bars[i]) * 0.18;

        const barH = Math.max(2, bars[i] * H * 0.92);
        const x = i * barWidth + gap / 2;
        const w = barWidth - gap;
        const y = H - barH;

        // Gradient per bar
        const grad = ctx.createLinearGradient(x, H, x, y);
        grad.addColorStop(0, color);
        grad.addColorStop(0.5, color + "cc");
        grad.addColorStop(1, color + "44");

        ctx.fillStyle = grad;
        ctx.beginPath();
        const radius = Math.min(w / 2, 3);
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, H);
        ctx.lineTo(x, H);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();

        // Glow effect on taller bars
        if (bars[i] > 0.4) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = color + "33";
          ctx.fillRect(x, y, w, 2);
          ctx.shadowBlur = 0;
        }

        // Reflection
        const reflGrad = ctx.createLinearGradient(x, H, x, H + barH * 0.3);
        reflGrad.addColorStop(0, color + "15");
        reflGrad.addColorStop(1, color + "00");
        ctx.fillStyle = reflGrad;
        ctx.fillRect(x, H, w, barH * 0.15);
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", setSize);
    };
  }, [bpm, isPlaying]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
