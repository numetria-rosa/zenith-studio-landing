// Renders the course cover HTML templates (scripts/_cover-templates/) to
// high-res PNGs via a headless browser — the project's established "plain
// HTML + Puppeteer screenshot" social-image method (see memory), not the
// Design canvas skill. Self-contained: loads templates via file://, no dev
// server needed. Output PNGs still need converting to .webp and placing in
// public/lab/ (see how ai-automation.webp / ai-assisted-software-
// engineering.webp were produced — sharp, quality 92).
//
// Requires puppeteer installed with PUPPETEER_SKIP_DOWNLOAD=true (this repo
// already has a cached Chrome from a prior install — point executablePath
// below at whatever `find ~/.cache/puppeteer -iname chrome.exe` finds if it
// moves) since the bundled chrome-headless-shell fetch fails in this
// environment.
//
// Usage: node scripts/_gen-course-covers.mjs
import puppeteer from "puppeteer";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(scriptDir, "_cover-templates");

const pages = [
  { file: "cover-ai-automation.html", out: "cover-ai-automation.png" },
  { file: "cover-ai-assisted-software-engineering.html", out: "cover-ai-assisted-software-engineering.png" },
  { file: "cover-math-for-ml.html", out: "cover-math-for-ml.png" },
];

const browser = await puppeteer.launch({
  executablePath: "C:/Users/HP/.cache/puppeteer/chrome/win64-148.0.7778.97/chrome-win64/chrome.exe",
});
for (const p of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 2000, height: 1125, deviceScaleFactor: 2 });
  await page.goto(`file://${path.join(templatesDir, p.file)}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  const outPath = path.join(scriptDir, p.out);
  await page.screenshot({ path: outPath });
  console.log("wrote", outPath);
  await page.close();
}
await browser.close();
