import os from "node:os";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { generateVoiceoverLines } from "./_reel-voiceover.mjs";

export const VOICE = "en-US-GuyNeural";

export const LINES = [
  "It's 9:47 PM. Your office is closed. Your next client just called anyway.",
  "By morning, that's three missed calls, and thousands in lost business.",
  "Meet your AI team. It doesn't work nine to five. It works around the clock.",
  "It texts back every missed call in seconds, asks what happened, and books the consult, any hour of the day.",
  "It follows up on leads you forgot about, and logs billable time before it's lost.",
  "It plugs straight into your calendar, your CRM, your billing. No new software. Always on.",
  "One AI team. Twelve hundred a month. You'll never miss a client again.",
];

export const VO_DIR = path.join(os.tmpdir(), "zenith-reel-vo");

export function ensureVoiceoverLines() {
  mkdirSync(VO_DIR, { recursive: true });
  return generateVoiceoverLines(LINES, VOICE, VO_DIR);
}

if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, "/") || process.argv[1]?.endsWith("_reel-law-firm-vo-lines.mjs")) {
  const clips = ensureVoiceoverLines();
  clips.forEach((c, i) => console.log(i, c.duration.toFixed(2) + "s", "-", c.text));
  console.log("Total:", clips.reduce((s, c) => s + c.duration, 0).toFixed(2) + "s");
}
