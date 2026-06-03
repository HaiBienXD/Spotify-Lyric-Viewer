import { useEffect, useState } from "react";

export default function BeatFlash({ beat }: { beat: number }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    setOpacity(0.22);
    const t = setTimeout(() => setOpacity(0), 90);
    return () => clearTimeout(t);
  }, [beat]);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[50]"
      style={{
        background: "white",
        opacity,
        transition: "opacity 0.12s ease-out",
        mixBlendMode: "overlay",
      }}
    />
  );
}
