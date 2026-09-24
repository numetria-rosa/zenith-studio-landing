import os from "node:os";
import path from "node:path";
import { generateSfxLibrary, buildAudioTrack, muxAudioIntoVideo } from "./_reel-sfx.mjs";
import { LINES, VOICE, ensureVoiceoverLines } from "./_reel-brand-vo-lines.mjs";

// Scene schedule — must match scripts/_reel-brand.js's SCENE_DEFS
// (same durations, same GAP/LEAD_IN) so sfx and voiceover land on the
// same beats as the picture.
const GAP = 0.4;
const LEAD_IN = 0.3;
let cursor = LEAD_IN;
const DURS = [6.02, 7.63, 8.95, 7.25, 7.37, 6.65, 6.55, 10.01, 3.05];
const sceneStarts = LINES.map((_, i) => {
  const start = cursor;
  cursor = start + DURS[i] + GAP;
  return start;
});
const TOTAL_DURATION = cursor + 0.8;
const [S0, S1, S2, S3, S4, S5, S6, S7, S8] = sceneStarts;

const SFX_CUES = [
  // Hero: soft chime as the wordmark lands
  { time: S0 + 0.35, sfx: "chime", volume: 0.6 },
  // Team hub: a pop per satellite reveal (0.55 + i*0.45)
  { time: S1 + 0.55, sfx: "pop", volume: 0.45 },
  { time: S1 + 1.00, sfx: "pop", volume: 0.45 },
  { time: S1 + 1.45, sfx: "pop", volume: 0.45 },
  { time: S1 + 1.90, sfx: "pop", volume: 0.45 },
  { time: S1 + 2.35, sfx: "pop", volume: 0.45 },
  // How it works: a pop per step reveal, a send as each line draws/flows
  { time: S2 + 0.30, sfx: "pop", volume: 0.5 },
  { time: S2 + 0.70, sfx: "send", volume: 0.4 },
  { time: S2 + 1.00, sfx: "pop", volume: 0.5 },
  { time: S2 + 1.80, sfx: "send", volume: 0.4 },
  { time: S2 + 2.10, sfx: "pop", volume: 0.5 },
  { time: S2 + 2.90, sfx: "send", volume: 0.4 },
  { time: S2 + 3.20, sfx: "chime", volume: 0.55 },
  // Service cards: one pop as each lands
  { time: S3 + 0.15, sfx: "pop", volume: 0.55 },
  { time: S4 + 0.15, sfx: "pop", volume: 0.55 },
  { time: S5 + 0.15, sfx: "pop", volume: 0.55 },
  { time: S6 + 0.15, sfx: "pop", volume: 0.55 },
  // Integrations: a pop per icon reveal (0.5 + i*0.3)
  { time: S7 + 0.50, sfx: "pop", volume: 0.45 },
  { time: S7 + 0.80, sfx: "pop", volume: 0.45 },
  { time: S7 + 1.10, sfx: "pop", volume: 0.45 },
  { time: S7 + 1.40, sfx: "pop", volume: 0.45 },
  { time: S7 + 1.70, sfx: "pop", volume: 0.45 },
  // CTA
  { time: S8 + 0.15, sfx: "chime", volume: 0.6 },
  { time: S8 + 1.10, sfx: "send", volume: 0.5 },
];

const sfxDir = path.join(os.tmpdir(), "zenith-reel-sfx");
const sfxFiles = generateSfxLibrary(sfxDir);

console.log("Generating voiceover with", VOICE, "...");
const voClips = ensureVoiceoverLines();
voClips.forEach((c, i) => {
  console.log(` vo${i}: ${c.duration.toFixed(2)}s (expected ${DURS[i]}s) - ${c.text}`);
  sfxFiles[`vo${i}`] = c.file;
});

const VO_CUES = sceneStarts.map((start, i) => ({ time: start + 0.05, sfx: `vo${i}`, volume: 1.0 }));

const CUES = [...SFX_CUES, ...VO_CUES];

const audioWav = path.join(os.tmpdir(), `zenith-reel-audio-${Date.now()}.wav`);
console.log("Mixing", CUES.length, "cues (sfx + voiceover), total duration", TOTAL_DURATION.toFixed(2) + "s...");
buildAudioTrack(CUES, TOTAL_DURATION, sfxFiles, audioWav);

const videoIn = "D:/zenith-studio/insta/reels/zenith-brand-silent.mp4";
const tmpOut = "D:/zenith-studio/insta/reels/zenith-brand.mp4";
console.log("Muxing audio onto video...");
muxAudioIntoVideo(videoIn, audioWav, tmpOut);
console.log("Done:", tmpOut);
console.log("Total video duration:", TOTAL_DURATION.toFixed(2) + "s");
