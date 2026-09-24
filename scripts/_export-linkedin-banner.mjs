import puppeteer from "puppeteer";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(scriptDir, "..", "linkedin", "banner.html");
const pngPath = htmlPath.replace(/\.html$/, ".png");

const browser = await puppeteer.launch({
  executablePath: "C:/Users/HP/.cache/puppeteer/chrome/win64-148.0.7778.97/chrome-win64/chrome.exe",
});
const page = await browser.newPage();
await page.setViewport({ width: 1584, height: 396, deviceScaleFactor: 2 });
await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: pngPath, clip: { x: 0, y: 0, width: 1584, height: 396 } });
console.log("exported", pngPath);
await browser.close();
