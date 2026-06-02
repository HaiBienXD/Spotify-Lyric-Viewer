export default function GlassBackground({ albumArt }: { albumArt?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ background: "#080808" }}>
      {albumArt && (
        <>
          {/* Deep blurred background */}
          <div
            className="absolute"
            style={{
              inset: "-20%",
              backgroundImage: `url(${albumArt})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(60px) saturate(1.4) brightness(0.5)",
              transform: "scale(1.1)",
            }}
          />
          {/* Second layer, rotated slightly for depth */}
          <div
            className="absolute"
            style={{
              inset: "-15%",
              backgroundImage: `url(${albumArt})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(100px) saturate(1.8) brightness(0.35)",
              transform: "scale(1.05) rotate(3deg)",
              opacity: 0.6,
            }}
          />
        </>
      )}

      {/* Glass overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(5,5,10,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "256px 256px",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </div>
  );
}
