import os from "node:os";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { generateVoiceoverLines } from "./_reel-voiceover.mjs";

export const VOICE = "en-US-GuyNeural";

export const LINES = [
  "The smartest way to close a lead in 2027? Answer before they go cold.",
  "This is the Lead Capture Agent. We built it, and we run it inside our own agency.",
  "The moment someone reaches out, it texts and emails them back, then keeps following up until they book a call.",
  "We haven't chased a lead by hand in months, and our calendar has never been fuller.",
  "It connects straight to your phone number, your inbox, and your calendar. No new app to learn.",
  "Want this running for your business? Comment or DM LEADS and we'll set it up for you.",
];

export const VO_DIR = path.join(os.tmpdir(), "zenith-reel-vo-lead");

export function ensureVoiceoverLines() {
  mkdirSync(VO_DIR, { recursive: true });
  return generateVoiceoverLines(LINES, VOICE, VO_DIR);
}

if (process.argv[1]?.endsWith("_reel-lead-vo-lines.mjs")) {
  const clips = ensureVoiceoverLines();
  clips.forEach((c, i) => console.log(i, c.duration.toFixed(2) + "s", "-", c.text));
  console.log("Total:", clips.reduce((s, c) => s + c.duration, 0).toFixed(2) + "s");
}
