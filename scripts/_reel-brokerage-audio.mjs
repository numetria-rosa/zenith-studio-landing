import os from "node:os";
import path from "node:path";
import { generateSfxLibrary, buildAudioTrack, muxAudioIntoVideo } from "./_reel-sfx.mjs";
import { LINES, VOICE, ensureVoiceoverLines } from "./_reel-brokerage-vo-lines.mjs";

// Scene schedule — must match scripts/_reel-brokerage.html's SCENE_DEFS
// (same durations, same GAP/LEAD_IN) so sfx and voiceover land on the
// same beats as the picture.
const GAP = 0.4;
const LEAD_IN = 0.3;
let cursor = LEAD_IN;
const DURS = [5.71, 4.06, 7.03, 6.26, 5.95, 8.95, 7.75];
const sceneStarts = LINES.map((_, i) => {
  const start = cursor;
  cursor = start + DURS[i] + GAP;
  return start;
});
const TOTAL_DURATION = cursor + 0.8;
const [S0, S1, S2, S3, S4, S5, S6] = sceneStarts;

const SFX_CUES = [
  // Scene 0: phone rings -> missed -> pills stack
  { time: S0 + 0.20, sfx: "ring", volume: 0.7 },
  { time: S0 + 0.55, sfx: "ring", volume: 0.7 },
  { time: S0 + 1.00, sfx: "thud", volume: 0.7 },
  { time: S0 + 1.55, sfx: "pop", volume: 0.6 },
  { time: S0 + 1.90, sfx: "pop", volume: 0.6 },
  { time: S0 + 2.25, sfx: "pop", volume: 0.6 },
  // Scene 1: counter ticking up (real cash-counting-machine clip)
  { time: S1 + 0.20, sfx: "counter_tick", volume: 0.9 },
  // Scene 2: 24/7 — soft chime as the numeral lands, pops as each team role lands
  { time: S2 + 0.30, sfx: "chime", volume: 0.6 },
  { time: S2 + 0.70, sfx: "pop", volume: 0.45 },
  { time: S2 + 0.85, sfx: "pop", volume: 0.45 },
  { time: S2 + 1.00, sfx: "pop", volume: 0.45 },
  // Scene 3: chat — typing burst before each bubble, pop/send as it lands
  { time: S3 + 0.05, sfx: "typing_burst", volume: 0.6 },
  { time: S3 + 0.40, sfx: "pop", volume: 0.5 },
  { time: S3 + 0.85, sfx: "typing_burst", volume: 0.6 },
  { time: S3 + 1.20, sfx: "send", volume: 0.5 },
  { time: S3 + 1.65, sfx: "typing_burst", volume: 0.6 },
  { time: S3 + 2.00, sfx: "pop", volume: 0.5 },
  { time: S3 + 2.45, sfx: "typing_burst", volume: 0.6 },
  { time: S3 + 2.80, sfx: "send", volume: 0.5 },
  { time: S3 + 3.50, sfx: "chime", volume: 0.6 },
  // Scene 4: vignette cards
  { time: S4 + 0.40, sfx: "pop", volume: 0.5 },
  { time: S4 + 1.30, sfx: "pop", volume: 0.5 },
  // Scene 5: diagram — inputs, hub, outputs
  { time: S5 + 0.30, sfx: "pop", volume: 0.5 }, { time: S5 + 0.45, sfx: "pop", volume: 0.5 }, { time: S5 + 0.60, sfx: "pop", volume: 0.5 },
  { time: S5 + 0.95, sfx: "chime", volume: 0.6 },
  { time: S5 + 1.25, sfx: "pop", volume: 0.5 }, { time: S5 + 1.40, sfx: "pop", volume: 0.5 }, { time: S5 + 1.55, sfx: "pop", volume: 0.5 },
  // Scene 6: price pop, CTA send
  { time: S6 + 0.15, sfx: "pop", volume: 0.6 },
  { time: S6 + 3.60, sfx: "send", volume: 0.5 },
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

const videoIn = "D:/zenith-studio/insta/reels/brokerage-ai-team-silent.mp4";
const tmpOut = "D:/zenith-studio/insta/reels/brokerage-ai-team.mp4";
console.log("Muxing audio onto video...");
muxAudioIntoVideo(videoIn, audioWav, tmpOut);
console.log("Done:", tmpOut);
console.log("Total video duration:", TOTAL_DURATION.toFixed(2) + "s");
