export default function NeonBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ background: "#04000f" }}>
      {/* Horizon glow */}
      <div
        className="absolute w-full"
        style={{
          bottom: "30%",
          height: "2px",
          background: "linear-gradient(90deg, transparent 0%, var(--extracted-primary, #ff00cc) 30%, var(--extracted-secondary, #00ccff) 70%, transparent 100%)",
          boxShadow: "0 0 40px 10px var(--extracted-primary, #ff00cc)",
          opacity: 0.8,
        }}
      />
      {/* Perspective floor grid */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: 0,
          height: "55%",
          backgroundImage: `
            linear-gradient(to right, var(--extracted-primary, #ff00cc) 1px, transparent 1px),
            linear-gradient(to bottom, var(--extracted-primary, #ff00cc) 1px, transparent 1px)
          `,
          backgroundSize: "60px 30px",
          transform: "perspective(400px) rotateX(75deg)",
          transformOrigin: "50% 100%",
          opacity: 0.25,
        }}
      />
      {/* Ceiling grid */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: 0,
          height: "30%",
          backgroundImage: `
            linear-gradient(to right, var(--extracted-secondary, #00ccff) 1px, transparent 1px),
            linear-gradient(to bottom, var(--extracted-secondary, #00ccff) 1px, transparent 1px)
          `,
          backgroundSize: "60px 30px",
          transform: "perspective(400px) rotateX(-70deg)",
          transformOrigin: "50% 0%",
          opacity: 0.15,
        }}
      />
      {/* Color blooms */}
      <div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: "50%", height: "40%",
          left: "5%", bottom: "25%",
          background: "var(--extracted-primary, #ff00cc)",
          opacity: 0.12,
        }}
      />
      <div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: "50%", height: "40%",
          right: "5%", bottom: "25%",
          background: "var(--extracted-secondary, #00ccff)",
          opacity: 0.12,
        }}
      />
      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 4px)",
        }}
      />
    </div>
  );
}
