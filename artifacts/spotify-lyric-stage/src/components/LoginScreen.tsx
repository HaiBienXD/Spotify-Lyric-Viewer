import { useState, useCallback } from "react";
import { redirectToSpotifyLogin, saveClientId, getCurrentRedirectUri } from "../lib/spotify";
import { motion, AnimatePresence } from "framer-motion";

const hasEnvClientId = !!import.meta.env.VITE_SPOTIFY_CLIENT_ID;

function getStoredClientId() {
  return window.localStorage.getItem("spotify_client_id") || "";
}

export default function LoginScreen() {
  const [clientId, setClientId] = useState(getStoredClientId);
  const [showSetup, setShowSetup] = useState(!hasEnvClientId && !getStoredClientId());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectUri = getCurrentRedirectUri();

  const handleConnect = useCallback(async () => {
    setError("");
    const id = hasEnvClientId ? import.meta.env.VITE_SPOTIFY_CLIENT_ID : clientId.trim();
    if (!id) {
      setShowSetup(true);
      return;
    }
    if (!hasEnvClientId) {
      saveClientId(id);
    }
    setLoading(true);
    try {
      await redirectToSpotifyLogin();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }, [clientId]);

  const handleSaveAndConnect = useCallback(async () => {
    const id = clientId.trim();
    if (!id) {
      setError("Please enter a valid Client ID.");
      return;
    }
    saveClientId(id);
    setError("");
    setLoading(true);
    try {
      await redirectToSpotifyLogin();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }, [clientId]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-black text-white">
      {/* Aurora background — pointer-events-none so it never blocks clicks */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-purple-900 via-green-900 to-blue-900 blur-3xl animate-pulse mix-blend-screen" />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div
          className="absolute w-[60%] h-[60%] top-[10%] left-[20%] rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(29,185,84,0.5) 0%, transparent 70%)", animation: "pulse 4s ease-in-out infinite alternate" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 text-center flex flex-col items-center px-4 w-full max-w-xl"
      >
        <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter mb-4 leading-none">
          SPOTIFY<br />LYRIC STAGE
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-lg mb-10 font-light">
          A breathtaking, cinematic stage for your music.
        </p>

        <AnimatePresence mode="wait">
          {showSetup ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.35 }}
              className="w-full rounded-2xl p-6 text-left"
              style={{
                backdropFilter: "blur(24px)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <h2 className="text-lg font-semibold mb-1 text-white">Connect your Spotify app</h2>
              <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                You need a free Spotify Developer Client ID. Takes about 2 minutes to set up.
              </p>

              <ol className="text-sm text-gray-300 space-y-3 mb-6 list-none">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1DB954] text-black font-bold flex items-center justify-center text-xs">1</span>
                  <span>
                    Go to{" "}
                    <a
                      href="https://developer.spotify.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1DB954] underline underline-offset-2"
                    >
                      developer.spotify.com/dashboard
                    </a>{" "}
                    and create a new app (any name).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1DB954] text-black font-bold flex items-center justify-center text-xs">2</span>
                  <span>
                    In the app settings, add this exact URL as a <strong className="text-white">Redirect URI</strong>:
                  </span>
                </li>
              </ol>

              {/* Redirect URI box */}
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 mb-6 font-mono text-xs text-[#1DB954] select-all"
                style={{ background: "rgba(29,185,84,0.08)", border: "1px solid rgba(29,185,84,0.25)" }}
                data-testid="text-redirect-uri"
              >
                <span className="flex-1 break-all">{redirectUri}</span>
                <button
                  className="flex-shrink-0 text-gray-400 hover:text-white transition-colors px-1"
                  onClick={() => navigator.clipboard.writeText(redirectUri)}
                  title="Copy"
                  data-testid="button-copy-redirect-uri"
                >
                  Copy
                </button>
              </div>

              <ol className="text-sm text-gray-300 space-y-3 mb-5 list-none">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1DB954] text-black font-bold flex items-center justify-center text-xs">3</span>
                  <span>Copy the <strong className="text-white">Client ID</strong> from the app dashboard and paste it below.</span>
                </li>
              </ol>

              <input
                type="text"
                value={clientId}
                onChange={(e) => { setClientId(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSaveAndConnect()}
                placeholder="Paste Client ID here…"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 mb-4 outline-none focus:ring-2 focus:ring-[#1DB954] transition-all"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}
                data-testid="input-client-id"
                spellCheck={false}
                autoComplete="off"
              />

              {error && (
                <p className="text-red-400 text-xs mb-3">{error}</p>
              )}

              <button
                onClick={handleSaveAndConnect}
                disabled={loading || !clientId.trim()}
                className="w-full py-3 rounded-xl font-bold text-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#1DB954", boxShadow: "0 0 30px rgba(29,185,84,0.35)" }}
                data-testid="button-connect-spotify"
              >
                {loading ? "Redirecting to Spotify…" : "Connect with Spotify"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center gap-4"
            >
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
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
              {!hasEnvClientId && getStoredClientId() && (
                <button
                  onClick={() => { setShowSetup(true); setClientId(getStoredClientId()); }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2"
                  data-testid="button-change-client-id"
                >
                  Change Client ID
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
