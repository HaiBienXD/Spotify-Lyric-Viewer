import { useCallback, useState } from "react";
import { redirectToSpotifyLogin } from "../lib/spotify";
import { motion } from "framer-motion";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      await redirectToSpotifyLogin();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-black text-white">
      {/* Background glow layers */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 50% 120%, rgba(29,185,84,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 30%, rgba(120,0,255,0.12) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 80% 20%, rgba(0,180,255,0.1) 0%, transparent 60%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        {/* Spotify logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="mb-10"
        >
          <svg width="64" height="64" viewBox="0 0 168 168" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="84" cy="84" r="84" fill="#1DB954" />
            <path
              d="M120.3 117.9c-1.5 2.4-4.7 3.2-7.1 1.7C94.4 108.3 71 105.8 43.3 112c-2.8.6-5.5-1.1-6.1-3.8-.6-2.8 1.1-5.5 3.9-6.1 30.3-6.9 56.3-4 77.4 8.7 2.4 1.5 3.2 4.7 1.8 7.1zm9.4-21.3c-1.9 3-6 4-9 2.1-21-12.9-53-16.7-77.8-9.1-3.2 1-6.6-.8-7.6-4-1-3.2.8-6.6 4-7.6 28.4-8.6 63.7-4.4 87.8 10.4 3 1.9 4 6 2.6 8.2zm.8-22.2C107.2 60 75.4 59 54.6 65.5c-3.8 1.2-7.9-1-9-4.8-1.2-3.8 1-7.9 4.8-9C73.3 44.3 108.7 45.5 133 59.4c3.5 2 4.6 6.5 2.5 10-.9 1.5-2.4 2.5-4 2.9-.5.1-.9.1-1.3.1z"
              fill="white"
            />
          </svg>
        </motion.div>

        <h1
          className="text-5xl md:text-7xl font-bold tracking-tighter mb-3 leading-none"
          style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif", letterSpacing: "-0.04em" }}
        >
          Lyric Stage
        </h1>
        <p className="text-base md:text-lg text-white/40 mb-14 font-light tracking-wide">
          Your music, on a cinematic stage.
        </p>

        {error && (
          <p className="text-red-400 text-sm mb-5">{error}</p>
        )}

        <button
          onClick={handleConnect}
          disabled={loading}
          className="group flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-black text-base transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: "#1DB954",
            boxShadow: loading ? "none" : "0 0 60px rgba(29,185,84,0.4), 0 4px 20px rgba(29,185,84,0.3)",
          }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Connecting…
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 168 168" fill="none">
                <circle cx="84" cy="84" r="84" fill="black" fillOpacity="0.15" />
                <path d="M120.3 117.9c-1.5 2.4-4.7 3.2-7.1 1.7C94.4 108.3 71 105.8 43.3 112c-2.8.6-5.5-1.1-6.1-3.8-.6-2.8 1.1-5.5 3.9-6.1 30.3-6.9 56.3-4 77.4 8.7 2.4 1.5 3.2 4.7 1.8 7.1zm9.4-21.3c-1.9 3-6 4-9 2.1-21-12.9-53-16.7-77.8-9.1-3.2 1-6.6-.8-7.6-4-1-3.2.8-6.6 4-7.6 28.4-8.6 63.7-4.4 87.8 10.4 3 1.9 4 6 2.6 8.2zm.8-22.2C107.2 60 75.4 59 54.6 65.5c-3.8 1.2-7.9-1-9-4.8-1.2-3.8 1-7.9 4.8-9C73.3 44.3 108.7 45.5 133 59.4c3.5 2 4.6 6.5 2.5 10-.9 1.5-2.4 2.5-4 2.9-.5.1-.9.1-1.3.1z" fill="black" fillOpacity="0.7"/>
              </svg>
              Continue with Spotify
            </>
          )}
        </button>

        <p className="mt-8 text-xs text-white/20 max-w-xs leading-relaxed">
          We only read what's currently playing. Nothing is stored or shared.
        </p>
      </motion.div>
    </div>
  );
}
