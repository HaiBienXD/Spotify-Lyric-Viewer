export default function AMOLEDBackground() {
  return (
    <div className="absolute inset-0 bg-black overflow-hidden pointer-events-none">
      {/* Barely visible color accent from album art — 5% so AMOLED pixels stay mostly off */}
      <div
        className="absolute rounded-full blur-[200px]"
        style={{
          width: "80%",
          height: "60%",
          top: "20%",
          left: "10%",
          background: "var(--extracted-primary, #ffffff)",
          opacity: 0.04,
        }}
      />
      <div
        className="absolute rounded-full blur-[160px]"
        style={{
          width: "50%",
          height: "40%",
          bottom: "10%",
          right: "5%",
          background: "var(--extracted-secondary, #ffffff)",
          opacity: 0.03,
        }}
      />
    </div>
  );
}
