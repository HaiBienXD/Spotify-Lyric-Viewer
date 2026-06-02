export interface LyricLine {
  time: number;
  text: string;
}

export function parseLrc(lrcText: string): LyricLine[] {
  const lines = lrcText.split("\n");
  const parsed: LyricLine[] = [];

  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      
      const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, "").trim();

      parsed.push({
        time: timeInSeconds,
        text: text || " " // preserve empty lines for instrumental gaps
      });
    }
  }

  return parsed.sort((a, b) => a.time - b.time);
}
