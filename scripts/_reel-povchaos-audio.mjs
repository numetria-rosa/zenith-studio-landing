import os from "node:os";
import path from "node:path";
import { generateSfxLibrary, buildAudioTrack, muxAudioIntoVideo } from "./_reel-sfx.mjs";
import { LINES, VOICE, ensureVoiceoverLines } from "./_reel-povchaos-vo-lines.mjs";

const GAP = 0.4;
const LEAD_IN = 0.3;
let cursor = LEAD_IN;
const DURS = [5.18, 4.13, 4.01];
const sceneStarts = LINES.map((_, i) => {
  const start = cursor;
  cursor = start + DURS[i] + GAP;
  return start;
});
const TOTAL_DURATION = cursor + 0.8;
const [S0, S1, S2] = sceneStarts;

const SFX_CUES = [
  // Scene 0: phone rings, then missed, then pills stack
  { time: S0 + 0.20, sfx: "ring", volume: 0.7 },
  { time: S0 + 0.55, sfx: "ring", volume: 0.7 },
  { time: S0 + 1.00, sfx: "thud", volume: 0.7 },
  { time: S0 + 1.55, sfx: "pop", volume: 0.6 },
  { time: S0 + 1.85, sfx: "pop", volume: 0.6 },
  { time: S0 + 2.15, sfx: "pop", volume: 0.6 },
  // Scene 1: resolve card lands
  { time: S1 + 0.5, sfx: "chime", volume: 0.55 },
  // Scene 2: CTA
  { time: S2 + 0.55, sfx: "chime", volume: 0.6 },
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

const audioWav = path.join(os.tmpdir(), `zenith-reel-povchaos-audio-${Date.now()}.wav`);
console.log("Mixing", CUES.length, "cues, total duration", TOTAL_DURATION.toFixed(2) + "s...");
buildAudioTrack(CUES, TOTAL_DURATION, sfxFiles, audioWav);

const videoIn = "D:/zenith-studio/insta/reels/zenith-povchaos-silent.mp4";
const tmpOut = "D:/zenith-studio/insta/reels/zenith-povchaos.mp4";
console.log("Muxing audio onto video...");
muxAudioIntoVideo(videoIn, audioWav, tmpOut);
console.log("Done:", tmpOut);
console.log("Total video duration:", TOTAL_DURATION.toFixed(2) + "s");
