// Screenshots app screens at 1440x1320 (the design artboard size) for compare.py.
// Usage: node tests/visual/capture-app.mjs [Name ...]   (server: preview "aie-visual", port 3100)
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const B = "/lab/ai-engineering/learn/modules/1";
const SCREENS = {
  ChapterOverview: B,
};
const names = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(SCREENS);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1320 }, deviceScaleFactor: 1 });
for (const name of names) {
  await page.goto(`${base}${SCREENS[name]}`, { waitUntil: "networkidle", timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}nextjs-portal{display:none!important}" });
  await page.screenshot({ path: `tests/visual/out/${name}.png` });
  console.log("captured", name);
}
await browser.close();
