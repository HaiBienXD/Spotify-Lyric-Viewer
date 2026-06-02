import { useState, useCallback } from "react";
import { redirectToSpotifyLogin, getCurrentRedirectUri } from "../lib/spotify";
import { motion } from "framer-motion";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const redirectUri = getCurrentRedirectUri();

  const copyUri = useCallback(() => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [redirectUri]);

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
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-purple-900 via-green-900 to-blue-900 blur-3xl animate-pulse mix-blend-screen" />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div
          className="absolute w-[60%] h-[60%] top-[10%] left-[20%] rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(29,185,84,0.5) 0%, transparent 70%)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 text-center flex flex-col items-center px-4"
      >
        <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter mb-4 leading-none">
          SPOTIFY<br />LYRIC STAGE
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-lg mb-12 font-light">
          A breathtaking, cinematic stage for your music.
        </p>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleConnect}
          disabled={loading}
          className="px-10 py-5 rounded-full font-bold text-black text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#1DB954", boxShadow: "0 0 50px rgba(29,185,84,0.4)" }}
          data-testid="button-connect-spotify"
        >
          {loading ? "Redirecting…" : "Connect with Spotify"}
        </button>

        {/* Redirect URI helper */}
        <div className="mt-8 w-full max-w-md text-center">
          <p className="text-xs text-gray-500 mb-2">
            Register this exact URL as a Redirect URI in your{" "}
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 underline underline-offset-2 hover:text-white transition-colors"
            >
              Spotify Developer Dashboard
            </a>
          </p>
          <div
            className="w-full rounded-xl px-4 pt-3 pb-2 font-mono text-xs text-left"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <span className="text-[#1DB954] break-all select-all">{redirectUri}</span>
            <div className="flex justify-end mt-2">
              <button
                onClick={copyUri}
                className="text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded text-xs"
                data-testid="button-copy-redirect-uri"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
