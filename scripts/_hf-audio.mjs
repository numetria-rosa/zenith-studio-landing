import os from "node:os";
import path from "node:path";
import { generateSfxLibrary, buildAudioTrack, muxAudioIntoVideo } from "./_reel-sfx.mjs";

// Cues mirror the entrance timings in scripts/_hf-assets/composition-template.html's
// GSAP timeline (no voiceover on this one — it's a fast kinetic-type piece).
const CUES = [
  // Scene 1: kinetic type
  { time: 0.15, sfx: "pop", volume: 0.4 },
  { time: 0.75, sfx: "chime", volume: 0.55 },
  // Scene 2: services chips
  { time: 3.10, sfx: "pop", volume: 0.4 },
  { time: 3.22, sfx: "pop", volume: 0.4 },
  { time: 3.34, sfx: "pop", volume: 0.4 },
  { time: 3.46, sfx: "pop", volume: 0.4 },
  // Scene 3: Gmail, Zoho
  { time: 6.10, sfx: "pop", volume: 0.5 },
  { time: 6.35, sfx: "pop", volume: 0.5 },
  // Scene 4: Yahoo, Google Calendar, Phone, hub
  { time: 9.15, sfx: "pop", volume: 0.5 },
  { time: 9.35, sfx: "pop", volume: 0.5 },
  { time: 9.55, sfx: "pop", volume: 0.5 },
  { time: 9.90, sfx: "chime", volume: 0.6 },
  // Shader transition moment
  { time: 11.70, sfx: "send", volume: 0.5 },
  // Scene 5: CTA
  { time: 12.50, sfx: "pop", volume: 0.5 },
];

const TOTAL_DURATION = 15.0;

const sfxDir = path.join(os.tmpdir(), "zenith-reel-sfx");
const sfxFiles = generateSfxLibrary(sfxDir);

const audioWav = path.join(os.tmpdir(), `zenith-hf-audio-${Date.now()}.wav`);
console.log("Mixing", CUES.length, "sfx cues, total duration", TOTAL_DURATION + "s...");
buildAudioTrack(CUES, TOTAL_DURATION, sfxFiles, audioWav);

const videoIn = "D:/zenith-studio/insta/reels/zenith-hyperframes-silent.mp4";
const tmpOut = "D:/zenith-studio/insta/reels/zenith-hyperframes.mp4";
console.log("Muxing audio onto video...");
muxAudioIntoVideo(videoIn, audioWav, tmpOut);
console.log("Done:", tmpOut);
