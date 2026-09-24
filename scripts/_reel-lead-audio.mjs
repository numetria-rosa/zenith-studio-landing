import os from "node:os";
import path from "node:path";
import { generateSfxLibrary, buildAudioTrack, muxAudioIntoVideo } from "./_reel-sfx.mjs";
import { LINES, VOICE, ensureVoiceoverLines } from "./_reel-lead-vo-lines.mjs";

const GAP = 0.4;
const LEAD_IN = 0.3;
let cursor = LEAD_IN;
const DURS = [6.24, 6.41, 6.55, 5.02, 6.79, 6.24];
const sceneStarts = LINES.map((_, i) => {
  const start = cursor;
  cursor = start + DURS[i] + GAP;
  return start;
});
const TOTAL_DURATION = cursor + 0.8;
const [S0, S1, S2, S3, S4, S5] = sceneStarts;

const SFX_CUES = [
  { time: S0 + 0.1, sfx: "chime", volume: 0.55 },
  // Skill card: typing burst while the prompt types, pop when the "added"
  // pill appears, send when the button pulses
  { time: S1 + 1.1, sfx: "typing_burst", volume: 0.5 },
  { time: S1 + 3.55, sfx: "pop", volume: 0.5 },
  { time: S1 + 3.9, sfx: "send", volume: 0.5 },
  // Phone demo: a pop per SMS bubble landing
  { time: S2 + 1.1, sfx: "pop", volume: 0.4 },
  { time: S2 + 2.2, sfx: "pop", volume: 0.4 },
  { time: S2 + 3.3, sfx: "pop", volume: 0.4 },
  { time: S2 + 4.4, sfx: "pop", volume: 0.4 },
  // Result stat
  { time: S3 + 0.9, sfx: "chime", volume: 0.45 },
  // Connect icons: a pop per icon
  { time: S4 + 0.6, sfx: "pop", volume: 0.45 },
  { time: S4 + 0.85, sfx: "pop", volume: 0.45 },
  { time: S4 + 1.1, sfx: "pop", volume: 0.45 },
  // CTA
  { time: S5 + 0.55, sfx: "chime", volume: 0.6 },
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

const audioWav = path.join(os.tmpdir(), `zenith-reel-lead-audio-${Date.now()}.wav`);
console.log("Mixing", CUES.length, "cues (sfx + voiceover), total duration", TOTAL_DURATION.toFixed(2) + "s...");
buildAudioTrack(CUES, TOTAL_DURATION, sfxFiles, audioWav);

const videoIn = "D:/zenith-studio/insta/reels/zenith-lead-silent.mp4";
const tmpOut = "D:/zenith-studio/insta/reels/zenith-lead.mp4";
console.log("Muxing audio onto video...");
muxAudioIntoVideo(videoIn, audioWav, tmpOut);
console.log("Done:", tmpOut);
console.log("Total video duration:", TOTAL_DURATION.toFixed(2) + "s");
