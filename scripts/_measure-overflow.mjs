// Diagnostic: for each insta ad slide, render it exactly as export-4k.js
// does but measure where .footer's bottom edge actually lands (not clipped
// by .canvas's overflow:hidden, since getBoundingClientRect still reports
// true layout position even under a clipping ancestor). Compares that to
// the canvas height to report how many px are cut off, and the exact zoom
// factor that would make the footer's bottom land exactly at the canvas
// edge.
import puppeteer from "puppeteer";
import { readFileSync } from "node:fs";
import path from "node:path";

const TARGETS = [
  { key: "916", dir: path.resolve("insta/course-ads"), height: 1920 },
  { key: "45", dir: path.resolve("insta/course-ads-4x5"), height: 1350 },
];
const COURSES = ["data-science", "ai-engineering", "automation-engineering", "ai-assisted-software-engineering"];

async function main() {
  const browser = await puppeteer.launch({ headless: "new" });
  for (const t of TARGETS) {
    for (const c of COURSES) {
      const htmlPath = path.join(t.dir, `slide-${c}.html`);
      const html = readFileSync(htmlPath, "utf-8");
      const currentZoom = parseFloat(html.match(/zoom:([\d.]+);/)[1]);
      const page = await browser.newPage();
      // Generous viewport so nothing is cut off during measurement itself.
      await page.setViewport({ width: 1080, height: t.height + 2000, deviceScaleFactor: 1 });
      await page.goto("file://" + htmlPath, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready);
      const bottom = await page.evaluate(() => {
        const footer = document.querySelector(".footer");
        return footer.getBoundingClientRect().bottom;
      });
      const overflow = Math.round(bottom - t.height);
      const neededZoom = +(currentZoom * (t.height / bottom) * 0.99).toFixed(3);
      console.log(`${t.key} ${c}: zoom=${currentZoom}, footer bottom=${Math.round(bottom)}px, canvas=${t.height}px, overflow=${overflow}px${overflow > 0 ? " (CLIPPED)" : ""}, needed zoom=${neededZoom}`);
      await page.close();
    }
  }
  await browser.close();
}
main();
