export default function MinimalBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ background: "#080808" }}>
      {/* Primary soft bloom — top left */}
      <div
        className="absolute rounded-full blur-[180px]"
        style={{
          width: "70%",
          height: "55%",
          top: "-15%",
          left: "-15%",
          background: "var(--extracted-primary, #334155)",
          opacity: 0.18,
        }}
      />
      {/* Secondary bloom — bottom right */}
      <div
        className="absolute rounded-full blur-[200px]"
        style={{
          width: "60%",
          height: "50%",
          bottom: "-10%",
          right: "-10%",
          background: "var(--extracted-secondary, #1e293b)",
          opacity: 0.14,
        }}
      />
      {/* Center vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Very subtle grain */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "200px",
        }}
      />
    </div>
  );
}
