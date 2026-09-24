// Renders a HyperFrames-contract composition (GSAP timeline registered on
// window.__timelines[id], data-duration on the composition root) to MP4 by
// deterministically seeking the timeline per frame — same idea as
// _reel-capture.mjs's renderFrame(t), just driving GSAP's own seek() instead
// of a hand-rolled function, since the "Send to HyperFrames" contract is
// authored exactly for this kind of frame-by-frame determinism.
import puppeteer from "puppeteer";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const [, , htmlPath, outPath, fpsArg] = process.argv;
if (!htmlPath || !outPath) {
  console.error("Usage: node scripts/_hf-capture.mjs <html-file> <output.mp4> [fps]");
  process.exit(1);
}
const fps = Number(fpsArg) || 30;

const frameDir = path.join(os.tmpdir(), "zenith-hf-frames-" + Date.now());
mkdirSync(frameDir, { recursive: true });

const browser = await puppeteer.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage();
page.on("console", (m) => console.log("PAGE:", m.text()));
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

await page.goto("file://" + path.resolve(htmlPath));
await page.evaluate(() => document.fonts.ready);

// Wait for the runtime CDN scripts + composition script to register the
// timeline. Puppeteer's waitForFunction polling is flaky against file://
// origins here, so poll manually instead.
let registered = false;
for (let i = 0; i < 40; i++) {
  registered = await page.evaluate(() => !!(window.__timelines && window.__timelines.main));
  if (registered) break;
  await new Promise((r) => setTimeout(r, 500));
}
if (!registered) throw new Error("Timeline window.__timelines.main never registered");

// The @hyperframes runtime pre-samples shader-transition frames on real
// wall-clock timers before the composition is actually visible — it shows
// a "Preparing/Sampling..." loading overlay that cycles through several
// phase labels. Poll for that progress text being gone for two consecutive
// checks (a single miss can be a race between phase-label swaps).
let clean = 0;
for (let i = 0; i < 60; i++) {
  const loading = await page.evaluate(() => document.body.innerText.includes("rendering transition frames"));
  if (!loading) { clean++; if (clean >= 2) break; } else { clean = 0; }
  await new Promise((r) => setTimeout(r, 500));
}
console.log("Transition pre-sampling done, starting capture.");

const meta = await page.evaluate(() => {
  const root = document.querySelector('[data-composition-id="main"]');
  return {
    width: Number(root.getAttribute("data-width")),
    height: Number(root.getAttribute("data-height")),
    duration: Number(root.getAttribute("data-duration")),
  };
});
console.log("Composition meta:", meta);
await page.setViewport({ width: meta.width, height: meta.height, deviceScaleFactor: 1 });

const totalFrames = Math.ceil(meta.duration * fps);
console.log(`Capturing ${totalFrames} frames (${meta.duration}s @ ${fps}fps)...`);

for (let i = 0; i < totalFrames; i++) {
  const t = i / fps;
  // Discard the return value: GSAP's seek() returns the timeline itself for
  // chaining, and Puppeteer trying to serialize that circular object back
  // over CDP is what was hanging every call.
  await page.evaluate((t) => { window.__timelines.main.seek(t, false); }, t);
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
