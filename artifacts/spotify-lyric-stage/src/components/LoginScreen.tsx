import { useState, useCallback } from "react";
import { redirectToSpotifyLogin, getCurrentRedirectUri } from "../lib/spotify";
import { motion, AnimatePresence } from "framer-motion";

const LS_KEY = "spotify_redirect_uri_override";

function getOverride() {
  return window.localStorage.getItem(LS_KEY) || "";
}

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftUri, setDraftUri] = useState(() => getOverride() || getCurrentRedirectUri());
  const detectedUri = getCurrentRedirectUri();
  const activeUri = getOverride() || detectedUri;

  const copyUri = useCallback(() => {
    navigator.clipboard.writeText(activeUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeUri]);

  const saveOverride = useCallback(() => {
    const val = draftUri.trim().replace(/\/$/, "");
    window.localStorage.setItem(LS_KEY, val);
    setEditing(false);
    setError("");
    window.location.reload();
  }, [draftUri]);

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
        className="relative z-10 text-center flex flex-col items-center px-4 w-full max-w-lg"
      >
        <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter mb-4 leading-none">
          SPOTIFY<br />LYRIC STAGE
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-lg mb-10 font-light">
          A breathtaking, cinematic stage for your music.
        </p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          onClick={handleConnect}
          disabled={loading}
          className="px-10 py-5 rounded-full font-bold text-black text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#1DB954", boxShadow: "0 0 50px rgba(29,185,84,0.4)" }}
          data-testid="button-connect-spotify"
        >
          {loading ? "Redirecting…" : "Connect with Spotify"}
        </button>

        {/* Redirect URI section */}
        <div className="mt-8 w-full text-left">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-gray-500">
              Redirect URI — must match your{" "}
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 underline underline-offset-2 hover:text-white transition-colors"
              >
                Spotify Dashboard
              </a>
            </p>
            <button
              onClick={() => { setEditing(e => !e); setDraftUri(activeUri); }}
              className="text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-2"
            >
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs text-gray-500 mb-2">
                  Paste your published app URL here (e.g. <span className="text-gray-400">https://myapp.replit.app</span>). No trailing slash.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={draftUri}
                    onChange={e => setDraftUri(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveOverride()}
                    placeholder="https://yourapp.replit.app"
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-[#1DB954]"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}
                    spellCheck={false}
                    autoComplete="off"
                    data-testid="input-redirect-uri"
                  />
                  <button
                    onClick={saveOverride}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:scale-105 active:scale-95"
                    style={{ background: "#1DB954" }}
                    data-testid="button-save-redirect-uri"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="display"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl px-4 pt-3 pb-2 font-mono text-xs"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <span className="text-[#1DB954] break-all select-all" data-testid="text-redirect-uri">
                  {activeUri}
                </span>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={copyUri}
                    className="text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded text-xs"
                    data-testid="button-copy-redirect-uri"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
