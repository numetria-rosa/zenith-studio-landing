import os from "node:os";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { generateVoiceoverLines } from "./_reel-voiceover.mjs";

export const VOICE = "en-US-GuyNeural";

export const LINES = [
  "It's 9:47 PM. A lead just called about your new listing.",
  "By morning, that lead has already called three other agents.",
  "Meet your AI team. It doesn't work nine to five. It works around the clock.",
  "It texts back every new lead in seconds, qualifies them, and books the showing, any hour of the day.",
  "It follows up on leads you forgot about, and wakes up the dormant contacts sitting in your CRM.",
  "It plugs straight into your calendar, your CRM, your transaction pipeline. No new software. Always on.",
  "One AI team. Twelve hundred a month. You'll never lose a lead to a faster agent again.",
];

export const VO_DIR = path.join(os.tmpdir(), "zenith-reel-vo-brokerage");

export function ensureVoiceoverLines() {
  mkdirSync(VO_DIR, { recursive: true });
  return generateVoiceoverLines(LINES, VOICE, VO_DIR);
}

if (process.argv[1]?.endsWith("_reel-brokerage-vo-lines.mjs")) {
  const clips = ensureVoiceoverLines();
  clips.forEach((c, i) => console.log(i, c.duration.toFixed(2) + "s", "-", c.text));
  console.log("Total:", clips.reduce((s, c) => s + c.duration, 0).toFixed(2) + "s");
}
