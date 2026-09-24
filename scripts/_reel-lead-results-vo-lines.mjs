import os from "node:os";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { generateVoiceoverLines } from "./_reel-voiceover.mjs";

export const VOICE = "en-US-GuyNeural";

export const LINES = [
  "It replied to a new lead in eight seconds, and had them booked before I even saw the notification.",
  "Here's the exact conversation. It replies, qualifies them, and books the call automatically.",
  "Want this running for your business? Comment or DM LEADS and we'll set it up for you.",
];

export const VO_DIR = path.join(os.tmpdir(), "zenith-reel-vo-lead-results");

export function ensureVoiceoverLines() {
  mkdirSync(VO_DIR, { recursive: true });
  return generateVoiceoverLines(LINES, VOICE, VO_DIR);
}

if (process.argv[1]?.endsWith("_reel-lead-results-vo-lines.mjs")) {
  const clips = ensureVoiceoverLines();
  clips.forEach((c, i) => console.log(i, c.duration.toFixed(2) + "s", "-", c.text));
  console.log("Total:", clips.reduce((s, c) => s + c.duration, 0).toFixed(2) + "s");
}
