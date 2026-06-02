import { useState, useCallback, useEffect } from "react";
import {
  buildSpotifyAuthUrl,
  redirectToSpotifyLogin,
} from "../lib/spotify";
import { motion } from "framer-motion";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    buildSpotifyAuthUrl().then(({ redirectUri: uri }) => {
      setRedirectUri(uri);
    });
  }, []);

  const handleCopy = useCallback(() => {
    if (!redirectUri) return;
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
        <div className="absolute w-[60%] h-[60%] top-[10%] left-[20%] rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(29,185,84,0.5) 0%, transparent 70%)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-4 w-full max-w-lg py-12"
      >
        <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter mb-3 leading-none text-center">
          SPOTIFY<br />LYRIC STAGE
        </h1>
        <p className="text-lg text-gray-400 mb-10 font-light text-center">
          A breathtaking, cinematic stage for your music.
        </p>

        <div className="w-full mb-6 rounded-2xl p-5 text-left"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            One-time setup — register your Redirect URI
          </p>

          <ol className="text-xs text-gray-400 space-y-2 mb-4 list-none">
            <li><span className="text-[#1DB954] font-bold mr-2">1.</span>
              Open{" "}
              <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer"
                className="text-[#1DB954] underline underline-offset-2">
                Spotify Developer Dashboard
              </a>
              {" "}→ your app → <strong className="text-white">Edit Settings</strong>
            </li>
            <li><span className="text-[#1DB954] font-bold mr-2">2.</span>
              Under <strong className="text-white">Redirect URIs</strong>, add exactly this URL:
            </li>
          </ol>

          <div className="flex items-center gap-2 rounded-xl px-3 py-3 font-mono text-xs mb-3"
            style={{ background: "rgba(29,185,84,0.08)", border: "1px solid rgba(29,185,84,0.3)" }}>
            <span className="text-[#1DB954] break-all flex-1 select-all leading-relaxed">
              {redirectUri || "Loading…"}
            </span>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 text-xs px-2 py-1 rounded-lg font-semibold transition-all hover:scale-105"
              style={{ background: copied ? "#1DB954" : "rgba(29,185,84,0.15)", color: copied ? "black" : "#1DB954" }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <p className="text-xs text-gray-500">
            <span className="text-[#1DB954] font-bold">3.</span>{" "}
            Click <strong className="text-white">Add</strong> then scroll down and click{" "}
            <strong className="text-white">Save</strong>. Wait a few seconds, then connect below.
          </p>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <button
          onClick={handleConnect}
          disabled={loading || !redirectUri}
          className="w-full py-5 rounded-2xl font-bold text-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#1DB954", boxShadow: "0 0 50px rgba(29,185,84,0.35)" }}
        >
          {loading ? "Redirecting to Spotify…" : "Connect with Spotify"}
        </button>

        <p className="mt-4 text-[11px] text-gray-600 text-center">
          Client ID: 0b0dd397bce54d04af1df5bcada7904e — make sure this matches your Spotify Developer app
        </p>
      </motion.div>
    </div>
  );
}
