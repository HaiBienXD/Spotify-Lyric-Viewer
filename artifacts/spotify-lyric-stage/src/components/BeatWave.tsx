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
      // Spike on beat then smooth decay
      const envelope = isPlaying ? (phase < 0.08 ? phase / 0.08 : Math.pow(1 - (phase - 0.08) / 0.92, 1.6)) : 0.08;
      const amp = 0.08 + 0.92 * envelope;

      // Draw 3 layered wave bands
      const waves = [
        { freq: 1.8, phaseOffset: 0,       alpha: 0.55, yScale: 0.9 },
        { freq: 2.6, phaseOffset: Math.PI, alpha: 0.35, yScale: 0.7 },
        { freq: 3.4, phaseOffset: 1.2,     alpha: 0.20, yScale: 0.5 },
      ];

      waves.forEach(({ freq, phaseOffset, alpha, yScale }) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, H);
        gradient.addColorStop(0, `${color}${Math.round(alpha * 255).toString(16).padStart(2,"0")}`);
        gradient.addColorStop(1, `${color}00`);

        ctx.beginPath();
        ctx.moveTo(0, H);

        for (let x = 0; x <= W; x += 2) {
          const t = (x / W) * Math.PI * 2 * freq + tRef.current * 3 + phaseOffset;
          const wave = Math.sin(t) * 0.55 + Math.sin(t * 1.7 + 0.5) * 0.3 + Math.sin(t * 0.5) * 0.15;
          const y = H - (H * amp * yScale * 0.85) * ((wave + 1) / 2 + 0.05);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
      });

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
