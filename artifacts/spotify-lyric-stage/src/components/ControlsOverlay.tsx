import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Theme } from "@/hooks/useTheme";

interface ControlsOverlayProps {
  theme: Theme;
  setTheme: (t: Theme) => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  stageMode: boolean;
  toggleFullscreen: () => void;
  visualizerType: number;
  setVisualizerType: (v: number) => void;
}

export default function ControlsOverlay({
  theme, setTheme, fontSize, setFontSize, stageMode, toggleFullscreen, visualizerType, setVisualizerType
}: ControlsOverlayProps) {
  
  const themes: Theme[] = [
    "Neon", "Aurora", "Galaxy", "Cyberpunk", "Glass", 
    "AMOLED", "Matrix", "Rain", "Fire", "Minimal"
  ];

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      
      <Button 
        variant="outline" 
        onClick={toggleFullscreen} 
        className="bg-white/10 text-white border-white/20 hover:bg-white/20 rounded-full font-bold px-6 py-4"
      >
        {stageMode ? "EXIT STAGE" : "ENTER STAGE MODE"}
      </Button>

      <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-full border border-white/10">
        <label className="text-xs text-white/60 font-semibold uppercase tracking-wider">Theme</label>
        <select 
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
          className="bg-transparent text-white border-none outline-none font-sans font-medium"
        >
          {themes.map(t => (
            <option key={t} value={t} className="bg-gray-900 text-white">{t}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4 bg-black/40 px-6 py-2 rounded-full border border-white/10 w-48">
        <label className="text-xs text-white/60 font-semibold uppercase tracking-wider shrink-0">Text Size</label>
        <Slider 
          value={[fontSize]}
          min={1.2}
          max={4.0}
          step={0.1}
          onValueChange={(val) => setFontSize(val[0])}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-full border border-white/10">
        <label className="text-xs text-white/60 font-semibold uppercase tracking-wider">Vis</label>
        <select 
          value={visualizerType}
          onChange={(e) => setVisualizerType(parseInt(e.target.value))}
          className="bg-transparent text-white border-none outline-none font-sans font-medium"
        >
          <option value={0} className="bg-gray-900">Off</option>
          <option value={1} className="bg-gray-900">Spectrum</option>
          <option value={2} className="bg-gray-900">Equalizer</option>
          <option value={3} className="bg-gray-900">Particles</option>
          <option value={4} className="bg-gray-900">Orbit Rings</option>
        </select>
      </div>

    </div>
  );
}
