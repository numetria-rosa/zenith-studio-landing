import os from "node:os";
import path from "node:path";
import { generateSfxLibrary, buildAudioTrack, muxAudioIntoVideo } from "./_reel-sfx.mjs";
import { LINES, VOICE, ensureVoiceoverLines } from "./_reel-lead-results-vo-lines.mjs";

const GAP = 0.4;
const LEAD_IN = 0.3;
let cursor = LEAD_IN;
const DURS = [5.71, 7.34, 6.24];
const sceneStarts = LINES.map((_, i) => {
  const start = cursor;
  cursor = start + DURS[i] + GAP;
  return start;
});
const TOTAL_DURATION = cursor + 0.8;
const [S0, S1, S2] = sceneStarts;

const SFX_CUES = [
  { time: S0 + 0.1, sfx: "chime", volume: 0.55 },
  { time: S1 + 1.0, sfx: "pop", volume: 0.4 },
  { time: S1 + 2.0, sfx: "pop", volume: 0.4 },
  { time: S1 + 3.0, sfx: "pop", volume: 0.4 },
  { time: S1 + 4.0, sfx: "pop", volume: 0.4 },
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

const audioWav = path.join(os.tmpdir(), `zenith-reel-lead-results-audio-${Date.now()}.wav`);
console.log("Mixing", CUES.length, "cues, total duration", TOTAL_DURATION.toFixed(2) + "s...");
buildAudioTrack(CUES, TOTAL_DURATION, sfxFiles, audioWav);

const videoIn = "D:/zenith-studio/insta/reels/zenith-lead-results-silent.mp4";
const tmpOut = "D:/zenith-studio/insta/reels/zenith-lead-results.mp4";
console.log("Muxing audio onto video...");
muxAudioIntoVideo(videoIn, audioWav, tmpOut);
console.log("Done:", tmpOut);
console.log("Total video duration:", TOTAL_DURATION.toFixed(2) + "s");
