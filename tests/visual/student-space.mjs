// Screenshots the student space at 1440 wide and the artboard heights (1320 / 1300).
// Needs the dev server on :3100 with a database holding a user whose session token is `testtoken123`
// (see the seed notes in the PR). Usage: node tests/visual/student-space.mjs [dashboard|profile]
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const SCREENS = { StudentDashboard: ["/account", 1320], StudentProfile: ["/account/profile", 1300] };
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1320 } });
await ctx.addCookies([{ name: "authjs.session-token", value: process.env.SESSION_TOKEN ?? "testtoken123", url: base }]);
const page = await ctx.newPage();
for (const [name, [route, height]] of Object.entries(SCREENS)) {
  await page.setViewportSize({ width: 1440, height });
  await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}nextjs-portal{display:none!important}" });
  await page.screenshot({ path: `tests/visual/out/${name}.png` });
  console.log("captured", name);
}
await browser.close();
