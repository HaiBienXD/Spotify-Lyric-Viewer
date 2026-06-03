import { useEffect, useRef } from "react";

interface BeatWaveProps {
  beat: number;
  bpm: number;
  isPlaying: boolean;
}

export default function BeatWave({ beat, bpm, isPlaying }: BeatWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastBeatRef = useRef(performance.now());
  const animRef = useRef<number>(0);

  useEffect(() => {
    lastBeatRef.current = performance.now();
  }, [beat]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let timeOffset = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      timeOffset += 0.04;

      const style = getComputedStyle(document.documentElement);
      const color = style.getPropertyValue("--extracted-primary").trim() || "#1DB954";

      const beatInterval = bpm > 0 ? 60000 / bpm : 500;
      const timeSince = performance.now() - lastBeatRef.current;
      // Amplitude: quick spike then smooth decay
      const t = Math.min(timeSince / beatInterval, 1);
      const rawDecay = t < 0.1 ? t / 0.1 : Math.pow(1 - (t - 0.1) / 0.9, 1.8);
      const amplitude = isPlaying ? (0.25 + 0.75 * rawDecay) : 0.1;

      const bars = 80;
      const barW = W / bars;
      const maxH = H * 0.85;

      for (let i = 0; i < bars; i++) {
        const phase = (i / bars) * Math.PI * 4 + timeOffset * 2.5;
        const wave1 = Math.sin(phase) * 0.5 + 0.5;
        const wave2 = Math.sin(phase * 0.7 + timeOffset) * 0.3 + 0.3;
        const combined = (wave1 * 0.65 + wave2 * 0.35);
        const barH = maxH * amplitude * (0.15 + 0.85 * combined);

        const alpha = 0.4 + 0.6 * amplitude;
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha * (0.5 + 0.5 * combined);

        const x = i * barW + barW * 0.15;
        const w = barW * 0.7;
        const y = H - barH;

        ctx.beginPath();
        ctx.roundRect(x, y, w, barH, w / 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [bpm, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
