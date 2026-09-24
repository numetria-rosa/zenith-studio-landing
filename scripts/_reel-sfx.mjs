// Synthesizes a small library of UI sound effects with ffmpeg's tone/noise
// generators (no downloaded audio, nothing to license) and mixes them onto
// a reel's video track at exact timestamps.
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function ff(args) {
  execFileSync("ffmpeg", ["-y", ...args], { stdio: "pipe" });
}

// Real, license-free clip downloaded to scripts/_sfx-assets/ — used instead
// of a synthesized click for typing, since that one reads as noticeably
// synthetic. See _sfx-assets/ATTRIBUTION.md for source/license.
const ASSETS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "_sfx-assets");

// Each generator writes one short wav to `file` if it doesn't exist yet.
const GENERATORS = {
  // ~0.4s slice of real smartphone-typing audio, leveled and faded, used
  // as one "typing burst" cue instead of 4 synthesized clicks per burst.
  typing_burst: (file) => ff([
    "-i", path.join(ASSETS_DIR, "typing-smartphone.wav"),
    "-ss", "0.3", "-t", "0.4",
    "-af", "afade=t=in:st=0:d=0.02,afade=t=out:st=0.32:d=0.08,volume=1.3",
    file,
  ]),
  // A run of short tones climbing in pitch, matched to the count-up
  // animation's own duration — reads as tracking the number going up,
  // rather than a flat mechanical loop running underneath it.
  counter_tick: (file) => {
    const n = 9;
    const dur = 1.15 / n;
    const startFreq = 480, endFreq = 1500;
    const inputs = [];
    const labels = [];
    for (let i = 0; i < n; i++) {
      const freq = Math.round(startFreq * Math.pow(endFreq / startFreq, i / (n - 1)));
      inputs.push("-f", "lavfi", "-i", `sine=frequency=${freq}:duration=${dur}`);
      labels.push(`[${i}]afade=t=out:st=${(dur * 0.55).toFixed(3)}:d=${(dur * 0.45).toFixed(3)}[t${i}]`);
    }
    const concatInputs = Array.from({ length: n }, (_, i) => `[t${i}]`).join("");
    ff([
      ...inputs,
      "-filter_complex", `${labels.join(";")};${concatInputs}concat=n=${n}:v=0:a=1,volume=0.6[out]`,
      "-map", "[out]",
      file,
    ]);
  },
  pop: (file) => ff([
    "-f", "lavfi", "-i", "sine=frequency=1000:duration=0.09",
    "-af", "afade=t=out:st=0.02:d=0.07,volume=0.55",
    file,
  ]),
  send: (file) => ff([
    "-f", "lavfi", "-i", "sine=frequency=700:duration=0.12",
    "-af", "afade=t=out:st=0.03:d=0.09,volume=0.5",
    file,
  ]),
  thud: (file) => ff([
    "-f", "lavfi", "-i", "sine=frequency=140:duration=0.25",
    "-af", "afade=t=out:st=0.05:d=0.2,volume=0.55",
    file,
  ]),
  ring: (file) => ff([
    "-f", "lavfi", "-i", "sine=frequency=480:duration=0.35",
    "-f", "lavfi", "-i", "sine=frequency=620:duration=0.35",
    "-filter_complex", "[0][1]amix=inputs=2:duration=first,afade=t=out:st=0.27:d=0.08,volume=0.5",
    file,
  ]),
  chime: (file) => ff([
    "-f", "lavfi", "-i", "sine=frequency=880:duration=0.12",
    "-f", "lavfi", "-i", "sine=frequency=1318:duration=0.18",
    "-filter_complex",
    "[0]afade=t=out:st=0.08:d=0.04[a];[1]afade=t=in:st=0:d=0.02,afade=t=out:st=0.13:d=0.05[b];[a][b]concat=n=2:v=0:a=1,volume=0.5[out]",
    "-map", "[out]",
    file,
  ]),
};

export function generateSfxLibrary(dir) {
  mkdirSync(dir, { recursive: true });
  const files = {};
  for (const [name, gen] of Object.entries(GENERATORS)) {
    const file = path.join(dir, `${name}.wav`);
    if (!existsSync(file)) gen(file);
    files[name] = file;
  }
  return files;
}

// cues: [{ time: seconds, sfx: 'click_a', volume?: 1 }, ...] — sfx names are
// looked up in sfxFiles, which can hold both the synthesized/downloaded sfx
// library and named voiceover clips (same mechanism, just longer files).
export function buildAudioTrack(cues, totalDuration, sfxFiles, outWav) {
  const inputs = ["-f", "lavfi", "-i", `anullsrc=r=44100:cl=stereo:d=${totalDuration}`];
  const labels = [];
  cues.forEach((cue, i) => {
    inputs.push("-i", sfxFiles[cue.sfx]);
    const delayMs = Math.round(cue.time * 1000);
    const label = `a${i}`;
    const vol = cue.volume ?? 1;
    labels.push(`[${i + 1}:a]adelay=${delayMs}|${delayMs},volume=${vol}[${label}]`);
  });
  const mixInputs = ["[0:a]", ...labels.map((l) => `[${l.match(/\[(\w+)\]$/)[1]}]`)].join("");
  const filterComplex = `${labels.join(";")};${mixInputs}amix=inputs=${cues.length + 1}:duration=first:normalize=0[out]`;

  ff([
    ...inputs,
    "-filter_complex", filterComplex,
    "-map", "[out]",
    outWav,
  ]);
}

export function muxAudioIntoVideo(videoPath, audioWav, outPath) {
  ff([
    "-i", videoPath,
    "-i", audioWav,
    "-c:v", "copy",
    "-c:a", "aac",
    "-shortest",
    outPath,
  ]);
}
