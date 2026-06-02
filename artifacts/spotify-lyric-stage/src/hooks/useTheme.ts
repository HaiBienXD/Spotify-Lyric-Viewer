import { useState, useEffect } from "react";

export type Theme = "Neon" | "Aurora" | "Galaxy" | "Cyberpunk" | "Glass" | "AMOLED" | "Matrix" | "Rain" | "Fire" | "Minimal";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem("lyric_stage_theme");
    return (saved as Theme) || "Aurora";
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = window.localStorage.getItem("lyric_stage_font_size");
    return saved ? parseFloat(saved) : 2.4;
  });

  useEffect(() => {
    window.localStorage.setItem("lyric_stage_theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("lyric_stage_font_size", fontSize.toString());
  }, [fontSize]);

  return { theme, setTheme, fontSize, setFontSize };
}
