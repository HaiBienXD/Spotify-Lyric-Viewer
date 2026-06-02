import { useState, useCallback, useEffect } from "react";
import {
  buildSpotifyAuthUrl,
  redirectToSpotifyLogin,
  getCurrentRedirectUri,
  saveRedirectUriOverride,
  clearRedirectUriOverride,
} from "../lib/spotify";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [authUrl, setAuthUrl] = useState("");
  const [showAuthUrl, setShowAuthUrl] = useState(false);

  // Build the auth URL on mount so we can show the exact redirect_uri
  useEffect(() => {
    buildSpotifyAuthUrl().then(({ url, redirectUri: uri }) => {
      setRedirectUri(uri);
      setAuthUrl(url);
      setDraft(uri);
    });
  }, []);

  const refreshUri = useCallback(async () => {
    const { url, redirectUri: uri } = await buildSpotifyAuthUrl();
    setRedirectUri(uri);
    setAuthUrl(url);
    setDraft(uri);
  }, []);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleSaveOverride = useCallback(async () => {
    const val = draft.trim().replace(/\/$/, "");
    if (!val) return;
    saveRedirectUriOverride(val);
    setEditing(false);
    setError("");
    await refreshUri();
  }, [draft, refreshUri]);

  const handleClearOverride = useCallback(async () => {
    clearRedirectUriOverride();
    setEditing(false);
    await refreshUri();
  }, [refreshUri]);

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

  const hasOverride = !!window.localStorage.getItem("spotify_redirect_uri_override");

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
        <p className="text-lg text-gray-400 mb-8 font-light text-center">
          A breathtaking, cinematic stage for your music.
        </p>

        {/* Step 1 */}
        <div className="w-full mb-4 rounded-2xl p-4 text-left"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Step 1 — Register this Redirect URI in Spotify
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Go to{" "}
            <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer"
              className="text-[#1DB954] underline underline-offset-2">
              Spotify Developer Dashboard
            </a>{" "}
            → your app → <strong className="text-gray-300">Edit Settings</strong> → add this URI under <strong className="text-gray-300">Redirect URIs</strong> → click <strong className="text-gray-300">Add</strong> then <strong className="text-gray-300">Save</strong>.
          </p>

          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-xs text-gray-500 mb-2">
                  Override the auto-detected URI. Paste your published app URL — no trailing slash.
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSaveOverride()}
                    placeholder="https://yourapp.replit.app"
                    className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-[#1DB954]"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}
                    spellCheck={false}
                    autoComplete="off"
                    data-testid="input-redirect-uri"
                  />
                  <button onClick={handleSaveOverride}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-black transition-all hover:scale-105"
                    style={{ background: "#1DB954" }}>
                    Save
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                    Cancel
                  </button>
                  {hasOverride && (
                    <button onClick={handleClearOverride} className="text-xs text-red-500 hover:text-red-400 transition-colors">
                      Clear override (use auto-detected)
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* The exact redirect_uri being sent */}
                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 font-mono text-xs mb-2"
                  style={{ background: "rgba(29,185,84,0.08)", border: "1px solid rgba(29,185,84,0.3)" }}>
                  <span className="text-[#1DB954] break-all flex-1 select-all leading-relaxed" data-testid="text-redirect-uri">
                    {redirectUri || "Loading…"}
                  </span>
                  <button onClick={() => handleCopy(redirectUri)}
                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors text-xs px-1 mt-0.5"
                    data-testid="button-copy-redirect-uri">
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setEditing(true); setDraft(redirectUri); }}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2">
                    {hasOverride ? "Override active — edit" : "Wrong URL? Override"}
                  </button>
                  <button onClick={() => setShowAuthUrl(v => !v)}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2">
                    {showAuthUrl ? "Hide" : "Show full auth URL"}
                  </button>
                </div>
                <AnimatePresence>
                  {showAuthUrl && authUrl && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} className="mt-2 overflow-hidden">
                      <p className="text-xs text-gray-500 mb-1">
                        This is the exact URL sent to Spotify. Open it in your browser to see what Spotify receives:
                      </p>
                      <div className="rounded-xl px-3 py-2 font-mono text-[10px] leading-relaxed"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <span className="text-gray-400 break-all select-all">{authUrl}</span>
                      </div>
                      <button onClick={() => handleCopy(authUrl)}
                        className="mt-1 text-xs text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2">
                        Copy full auth URL
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 2 */}
        <div className="w-full mb-6 rounded-2xl p-4 text-left"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Step 2 — Connect
          </p>
          <p className="text-xs text-gray-500">
            After saving the URI in Spotify's dashboard, click the button below.
          </p>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <button
          onClick={handleConnect}
          disabled={loading || !redirectUri}
          className="w-full py-5 rounded-2xl font-bold text-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#1DB954", boxShadow: "0 0 50px rgba(29,185,84,0.35)" }}
          data-testid="button-connect-spotify"
        >
          {loading ? "Redirecting to Spotify…" : "Connect with Spotify"}
        </button>
      </motion.div>
    </div>
  );
}
