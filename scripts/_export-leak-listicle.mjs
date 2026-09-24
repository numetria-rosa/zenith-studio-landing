import puppeteer from "puppeteer";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(scriptDir, "..", "insta", "leak-listicle");
const slides = fs.readdirSync(dir).filter((f) => /^slide-.*\.html$/.test(f)).sort();

const browser = await puppeteer.launch({
  executablePath: "C:/Users/HP/.cache/puppeteer/chrome/win64-148.0.7778.97/chrome-win64/chrome.exe",
});
for (const slide of slides) {
  const htmlPath = path.join(dir, slide);
  const pngPath = htmlPath.replace(/\.html$/, ".png");
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 4 });
  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: pngPath, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  console.log("exported", pngPath);
  await page.close();
}
await browser.close();
