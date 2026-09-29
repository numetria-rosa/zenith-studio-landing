// Screenshots app screens at 1440 wide and the design artboard height for compare.py.
// Usage: node tests/visual/capture-app.mjs [Name ...]   (server: preview "aie-visual", port 3100)
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const B = "/lab/ai-engineering/learn/modules/1";
// name -> [path, artboard height]
const SCREENS = {
  ChapterOverview: [B, 1320],
  ChapterLesson: [`${B}/lessons/1.4`, 1900],
};
const names = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(SCREENS);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1320 }, deviceScaleFactor: 1 });
for (const name of names) {
  const [route, height] = SCREENS[name];
  await page.setViewportSize({ width: 1440, height });
  await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}nextjs-portal{display:none!important}" });
  await page.screenshot({ path: `tests/visual/out/${name}.png` });
  console.log("captured", name);
}
await browser.close();
