// Captures a reel HTML page (must expose window.renderFrame(t) and
// window.TOTAL_DURATION) as deterministic PNG frames, then encodes them to
// mp4 with ffmpeg. Usage:
//   node scripts/_reel-capture.mjs <html-file> <output.mp4> [fps]
import puppeteer from "puppeteer";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const [, , htmlPath, outPath, fpsArg] = process.argv;
if (!htmlPath || !outPath) {
  console.error("Usage: node scripts/_reel-capture.mjs <html-file> <output.mp4> [fps]");
  process.exit(1);
}
const fps = Number(fpsArg) || 30;

const frameDir = path.join(os.tmpdir(), "zenith-reel-frames-" + Date.now());
mkdirSync(frameDir, { recursive: true });

// WebGL args are needed for pages that render Three.js content; harmless
// no-ops for plain CSS/SVG reels.
const browser = await puppeteer.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto("file://" + path.resolve(htmlPath));
// Wait for webfonts before measuring anything (pages that lay out connector
// lines from real element positions need final, not fallback-font, metrics).
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => window.onFontsReady && window.onFontsReady());

const duration = await page.evaluate(() => window.TOTAL_DURATION);
if (!duration) throw new Error("Page did not expose window.TOTAL_DURATION");

const totalFrames = Math.ceil(duration * fps);
console.log(`Capturing ${totalFrames} frames (${duration}s @ ${fps}fps)...`);

for (let i = 0; i < totalFrames; i++) {
  const t = i / fps;
  await page.evaluate((t) => window.renderFrame(t), t);
  const frameFile = path.join(frameDir, `frame_${String(i).padStart(5, "0")}.png`);
  await page.screenshot({ path: frameFile });
  if (i % 30 === 0) console.log(`  frame ${i}/${totalFrames}`);
}

await browser.close();

console.log("Encoding with ffmpeg...");
if (existsSync(outPath)) rmSync(outPath);
execFileSync("ffmpeg", [
  "-y",
  "-framerate", String(fps),
  "-i", path.join(frameDir, "frame_%05d.png"),
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-r", String(fps),
  outPath,
], { stdio: "inherit" });

rmSync(frameDir, { recursive: true, force: true });
console.log("Done:", outPath);
