import { useState, useEffect } from "react";

function ensureBrightColor(r: number, g: number, b: number): { r: number; g: number; b: number } {
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  
  // If the color is extremely dark or black, fall back to a beautiful vibrant green (Spotify Green)
  if (luminance < 40) {
    return { r: 30, g: 215, b: 96 };
  }
  
  if (luminance < 155) {
    const factor = 175 / Math.max(luminance, 1);
    let newR = Math.min(255, Math.round(r * factor));
    let newG = Math.min(255, Math.round(g * factor));
    let newB = Math.min(255, Math.round(b * factor));
    
    const newLuminance = 0.299 * newR + 0.587 * newG + 0.114 * newB;
    if (newLuminance < 140) {
      newR = Math.round(newR * 0.5 + 255 * 0.5);
      newG = Math.round(newG * 0.5 + 255 * 0.5);
      newB = Math.round(newB * 0.5 + 255 * 0.5);
    }
    return { r: newR, g: newG, b: newB };
  }
  return { r, g, b };
}

export function useColorExtraction(imageUrl: string | undefined) {
  const [colors, setColors] = useState<{ primary: string; secondary: string }>({
    primary: "rgb(29, 185, 84)", // default spotify green for high visibility
    secondary: "rgb(25, 20, 20)"
  });

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        // Sample center pixel
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        const centerIndex = (centerY * canvas.width + centerX) * 4;
        
        const rawR1 = data[centerIndex];
        const rawG1 = data[centerIndex + 1];
        const rawB1 = data[centerIndex + 2];

        // Sample top-left pixel
        const rawR2 = data[0];
        const rawG2 = data[1];
        const rawB2 = data[2];

        // Ensure bright, high-contrast colors
        const c1 = ensureBrightColor(rawR1, rawG1, rawB1);
        const c2 = ensureBrightColor(rawR2, rawG2, rawB2);

        setColors({
          primary: `rgb(${c1.r}, ${c1.g}, ${c1.b})`,
          secondary: `rgb(${c2.r}, ${c2.g}, ${c2.b})`
        });
        
        // Update CSS variables
        document.documentElement.style.setProperty('--extracted-primary', `rgb(${c1.r}, ${c1.g}, ${c1.b})`);
        document.documentElement.style.setProperty('--extracted-secondary', `rgb(${c2.r}, ${c2.g}, ${c2.b})`);
        
      } catch (e) {
        console.error("Color extraction failed", e);
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  return colors;
}
