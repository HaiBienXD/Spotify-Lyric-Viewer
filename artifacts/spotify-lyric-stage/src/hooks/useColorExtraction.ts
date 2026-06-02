import { useState, useEffect } from "react";

export function useColorExtraction(imageUrl: string | undefined) {
  const [colors, setColors] = useState<{ primary: string; secondary: string }>({
    primary: "hsl(240, 10%, 4%)", // default dark
    secondary: "hsl(240, 10%, 10%)"
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

      // Simple extraction: sample a few pixels
      try {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let r = 0, g = 0, b = 0;
        let count = 0;
        
        // Sample center pixel
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        const centerIndex = (centerY * canvas.width + centerX) * 4;
        
        const r1 = data[centerIndex];
        const g1 = data[centerIndex + 1];
        const b1 = data[centerIndex + 2];

        // Sample another pixel
        const r2 = data[0];
        const g2 = data[1];
        const b2 = data[2];

        setColors({
          primary: `rgb(${r1}, ${g1}, ${b1})`,
          secondary: `rgb(${r2}, ${g2}, ${b2})`
        });
        
        // Update CSS variables
        document.documentElement.style.setProperty('--extracted-primary', `rgb(${r1}, ${g1}, ${b1})`);
        document.documentElement.style.setProperty('--extracted-secondary', `rgb(${r2}, ${g2}, ${b2})`);
        
      } catch (e) {
        console.error("Color extraction failed", e);
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  return colors;
}
