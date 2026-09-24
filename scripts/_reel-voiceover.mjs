// Generates one mp3 per voiceover line with edge-tts (free MS neural TTS,
// no API key — pip install edge-tts) and reports each clip's real duration,
// so the reel's scene timeline can be built around actual speech pacing
// instead of guessed numbers.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export function synthesizeLine(text, voice, outFile) {
  if (!existsSync(outFile)) {
    execFileSync("python", [
      "-m", "edge_tts",
      "--voice", voice,
      "--text", text,
      "--write-media", outFile,
    ]);
  }
  const out = execFileSync("ffmpeg", ["-i", outFile], { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] })
    .toString();
  return out;
}

export function getDuration(file) {
  try {
    execFileSync("ffmpeg", ["-i", file], { stdio: "pipe" });
  } catch (e) {
    const stderr = e.stderr.toString();
    const m = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
    if (m) return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
  }
  return null;
}

export function generateVoiceoverLines(lines, voice, dir) {
  return lines.map((text, i) => {
    const file = path.join(dir, `vo_${String(i).padStart(2, "0")}.mp3`);
    if (!existsSync(file)) {
      execFileSync("python", [
        "-m", "edge_tts",
        "--voice", voice,
        "--text", text,
        "--write-media", file,
      ]);
    }
    return { text, file, duration: getDuration(file) };
  });
}
