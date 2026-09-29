// Captures each section of /lab/ai-engineering at 1440 wide for comparison against
// halo/ai-engineering-course-handoff/reference/screenshots (see compare.py).
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const sections = { CourseAIEHero: "#overview", CourseAIECurriculum: "#curriculum", CourseAIEInside: "#inside", CourseAIEOutcomes: "#outcomes" };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(`${base}/lab/ai-engineering`, { waitUntil: "networkidle", timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: "html{scroll-behavior:auto!important}nextjs-portal{display:none!important}" });
for (const [name, sel] of Object.entries(sections)) {
  await page.locator(sel).screenshot({ path: `tests/visual/out/${name}.png` });
  const box = await page.locator(sel).boundingBox();
  console.log(name, Math.round(box.width), Math.round(box.height));
}
await browser.close();
