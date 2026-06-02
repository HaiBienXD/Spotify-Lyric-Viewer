import { redirectToSpotifyLogin } from "../lib/spotify";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function LoginScreen() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-black text-white">
      {/* Aurora background simulation for login */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-purple-900 via-green-900 to-blue-900 blur-3xl animate-pulse mix-blend-screen" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="z-10 text-center flex flex-col items-center"
      >
        <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter mb-4">
          SPOTIFY<br />LYRIC STAGE
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-lg mb-12 font-sans font-light px-4">
          A breathtaking, cinematic stage for your music.
        </p>

        <Button 
          onClick={redirectToSpotifyLogin}
          className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold px-8 py-6 rounded-full text-lg shadow-[0_0_40px_rgba(29,185,84,0.4)] transition-all hover:scale-105"
        >
          Connect with Spotify
        </Button>
      </motion.div>
    </div>
  );
}
