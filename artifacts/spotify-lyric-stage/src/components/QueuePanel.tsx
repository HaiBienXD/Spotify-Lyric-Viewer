import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { playTrack, getRecommendations, searchTracks } from "../lib/spotify";

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[]; name: string };
  duration_ms: number;
}

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Track[];
  currentTrack: Track | null;
}

function formatDur(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function QueuePanel({ isOpen, onClose, queue, currentTrack }: QueuePanelProps) {
  const [activeTab, setActiveTab] = useState<"queue" | "recommend" | "search">("queue");

  // Deduplicate consecutive duplicate track IDs in the queue
  const uniqueQueue = queue.filter(
    (track, index, self) => index === 0 || track.id !== self[index - 1].id
  );

  // Recommendations state & loading
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    if (!currentTrack?.id || activeTab !== "recommend") return;
    setRecLoading(true);
    getRecommendations(currentTrack.id)
      .then((d) => {
        if (d?.tracks) {
          setRecommendations(d.tracks);
        }
      })
      .catch(console.error)
      .finally(() => setRecLoading(false));
  }, [currentTrack?.id, activeTab]);

  // Search state & loading
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(() => {
      setSearchLoading(true);
      searchTracks(searchQuery)
        .then((d) => {
          if (d?.tracks?.items) {
            setSearchResults(d.tracks.items);
          }
        })
        .catch(console.error)
        .finally(() => setSearchLoading(false));
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const renderTrackItem = (track: Track, idx: number) => (
    <div
      key={`${track.id}-${idx}`}
      onClick={() => {
        playTrack(`spotify:track:${track.id}`).catch(console.error);
      }}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group cursor-pointer animate-fade-in"
    >
      <span className="text-white/20 text-xs w-4 text-right shrink-0 group-hover:text-[#1db954] transition-colors">
        {idx + 1}
      </span>
      <img
        src={track.album.images[0]?.url}
        className="w-9 h-9 rounded object-cover shrink-0 shadow"
        alt=""
      />
      <div className="min-w-0 flex-1">
        <p className="text-white/85 text-sm font-medium truncate group-hover:text-[#1db954] transition-colors">
          {track.name}
        </p>
        <p className="text-white/35 text-xs truncate">{track.artists[0]?.name}</p>
      </div>
      <span className="text-white/25 text-xs shrink-0">{formatDur(track.duration_ms)}</span>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[28]"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute right-0 top-0 z-[29] flex flex-col"
            style={{
              width: "320px",
              height: "calc(100% - 96px)",
              background: "rgba(10,10,14,0.95)",
              backdropFilter: "blur(24px)",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h3 className="text-white font-semibold tracking-wide">Next Up</h3>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-4 pt-2 pb-2 gap-1.5 border-b border-white/5 bg-white/[0.01] shrink-0">
              {(["queue", "recommend", "search"] as const).map((tab) => {
                const isActive = activeTab === tab;
                let label = "Next Up";
                if (tab === "recommend") label = "Suggest";
                if (tab === "search") label = "Search";
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200"
                    style={{
                      color: isActive ? "#000" : "rgba(255,255,255,0.45)",
                      background: isActive ? "var(--extracted-primary, #1db954)" : "transparent",
                      boxShadow: isActive ? "0 2px 8px rgba(29, 185, 84, 0.3)" : "none",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Currently playing */}
            {currentTrack && activeTab === "queue" && (
              <div className="px-4 py-3 border-b border-white/5 shrink-0">
                <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Playing</p>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={currentTrack.album.images[0]?.url}
                      className="w-10 h-10 rounded-md object-cover"
                      alt=""
                    />
                    <div className="absolute inset-0 rounded-md ring-2 ring-green-500/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{currentTrack.name}</p>
                    <p className="text-white/40 text-xs truncate">{currentTrack.artists[0]?.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Content area */}
            <div className="flex-1 min-h-0 flex flex-col">
              {activeTab === "queue" && (
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {uniqueQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2">
                      <p className="text-white/20 text-sm">Queue is empty</p>
                      <p className="text-white/15 text-xs">Play something on Spotify</p>
                    </div>
                  ) : (
                    uniqueQueue.map((track, i) => renderTrackItem(track, i))
                  )}
                </div>
              )}

              {activeTab === "recommend" && (
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {recLoading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
                      <p className="text-white/20 text-xs tracking-wider uppercase">Loading recommendations</p>
                    </div>
                  ) : recommendations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 px-6 text-center">
                      <p className="text-white/20 text-sm">No recommendations</p>
                      <p className="text-white/15 text-xs font-light">Play a track to get recommended suggestions</p>
                    </div>
                  ) : (
                    recommendations.map((track, i) => renderTrackItem(track, i))
                  )}
                </div>
              )}

              {activeTab === "search" && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Search Input Bar */}
                  <div className="p-3 border-b border-white/5 shrink-0">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search songs..."
                        className="w-full bg-white/5 hover:bg-white/8 focus:bg-white/10 text-white placeholder-white/25 text-xs rounded-xl py-2 pl-3 pr-8 outline-none border border-white/5 focus:border-white/15 transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Results List */}
                  <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                    {searchLoading ? (
                      <div className="flex flex-col items-center justify-center h-40 gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
                        <p className="text-white/20 text-xs tracking-wider uppercase">Searching Spotify</p>
                      </div>
                    ) : searchQuery.trim() === "" ? (
                      <div className="flex flex-col items-center justify-center h-40 gap-2 px-6 text-center">
                        <p className="text-white/20 text-sm">Search for tracks</p>
                        <p className="text-white/15 text-xs font-light">Type a song title, artist, or album</p>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 gap-2">
                        <p className="text-white/20 text-sm">No results found</p>
                        <p className="text-white/15 text-xs">Try searching for something else</p>
                      </div>
                    ) : (
                      searchResults.map((track, i) => renderTrackItem(track, i))
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
