// Quick debug helper: render a handful of specific timestamps to PNGs
// without doing a full video capture. Usage:
//   node scripts/_reel-preview-frames.mjs <html-file> <out-dir> <t1,t2,t3,...>
import puppeteer from "puppeteer";
import path from "node:path";
import { mkdirSync } from "node:fs";

const [, , htmlPath, outDir, timesArg] = process.argv;
const times = timesArg.split(",").map(Number);
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage();
page.on("console", (m) => console.log("PAGE:", m.text()));
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto("file://" + path.resolve(htmlPath));
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => window.onFontsReady && window.onFontsReady());

for (const t of times) {
  await page.evaluate((t) => window.renderFrame(t), t);
  const file = path.join(outDir, `t${t}.png`);
  await page.screenshot({ path: file });
  console.log("Saved", file);
}
await browser.close();
