export interface LyricLine {
  time: number;
  text: string;
  translation?: string;
}

export function parseLrc(lrcText: string): LyricLine[] {
  const lines = lrcText.split("\n");
  const parsed: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (!match) continue;

    const minutes      = parseInt(match[1], 10);
    const seconds      = parseInt(match[2], 10);
    const milliseconds = parseInt(match[3].padEnd(3, "0"), 10);
    const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
    const text = line.replace(timeRegex, "").trim();

    if (!text) continue;

    const last = parsed[parsed.length - 1];
    if (last && Math.abs(last.time - timeInSeconds) < 0.15 && !last.translation) {
      last.translation = text;
    } else {
      parsed.push({ time: timeInSeconds, text: text || "♪" });
    }
  }

  return parsed.sort((a, b) => a.time - b.time);
}
