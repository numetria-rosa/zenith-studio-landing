import os from "node:os";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { generateVoiceoverLines } from "./_reel-voiceover.mjs";

export const VOICE = "en-US-GuyNeural";

export const LINES = [
  "POV. You're mid job, and your phone will not stop.",
  "While you worked, it already replied, and grabbed them a time.",
  "Comment or DM LEADS and we'll set this up for your business.",
];

export const VO_DIR = path.join(os.tmpdir(), "zenith-reel-vo-povchaos");

export function ensureVoiceoverLines() {
  mkdirSync(VO_DIR, { recursive: true });
  return generateVoiceoverLines(LINES, VOICE, VO_DIR);
}

if (process.argv[1]?.endsWith("_reel-povchaos-vo-lines.mjs")) {
  const clips = ensureVoiceoverLines();
  clips.forEach((c, i) => console.log(i, c.duration.toFixed(2) + "s", "-", c.text));
  console.log("Total:", clips.reduce((s, c) => s + c.duration, 0).toFixed(2) + "s");
}
