import { motion, AnimatePresence } from "framer-motion";

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
              width: "300px",
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

            {/* Currently playing */}
            {currentTrack && (
              <div className="px-4 py-3 border-b border-white/5">
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

            {/* Queue list */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              {queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <p className="text-white/20 text-sm">Queue is empty</p>
                  <p className="text-white/15 text-xs">Play something on Spotify</p>
                </div>
              ) : (
                queue.map((track, i) => (
                  <div
                    key={`${track.id}-${i}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-white/20 text-xs w-4 text-right shrink-0">{i + 1}</span>
                    <img
                      src={track.album.images[0]?.url}
                      className="w-9 h-9 rounded object-cover shrink-0"
                      alt=""
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white/85 text-sm font-medium truncate">{track.name}</p>
                      <p className="text-white/35 text-xs truncate">{track.artists[0]?.name}</p>
                    </div>
                    <span className="text-white/25 text-xs shrink-0">{formatDur(track.duration_ms)}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
