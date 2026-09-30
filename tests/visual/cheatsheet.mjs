// Cheat sheet tab: every module's sheet renders, the PDF route returns a real PDF, and print hides the app chrome.
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const L = `${base}/lab/ai-engineering/learn`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
let failed = 0;
const check = (cond, msg) => { if (!cond) { failed++; console.log("FAIL", msg); } else console.log("ok  ", msg); };

for (let n = 1; n <= 7; n++) {
  const r = await page.goto(`${L}/modules/${n}/cheat-sheet`, { waitUntil: "networkidle", timeout: 120000 });
  check(r.status() === 200, `m${n}: cheat sheet renders`);
  check((await page.getByRole("heading", { level: 2 }).count()) >= 5, `m${n}: section cards shown`);
  const res = await page.request.get(`${L}/cheat-sheets/${n}/pdf`);
  const body = await res.body();
  check(res.status() === 200 && res.headers()["content-type"] === "application/pdf" && body.subarray(0, 4).toString() === "%PDF", `m${n}: PDF route returns a PDF (${body.length} bytes)`);
}
await page.goto(`${L}/modules/3/cheat-sheet`, { waitUntil: "networkidle" });
await page.screenshot({ path: "tests/visual/out/cheatsheet-3.png", fullPage: true });
check((await page.request.get(`${L}/cheat-sheets/nope/pdf`)).status() === 404, "unknown sheet is a 404");
check(await page.getByRole("tab", { name: "Cheat sheet" }).count() + (await page.getByRole("link", { name: "Cheat sheet" }).count()) > 0, "module has a Cheat sheet tab");
await page.getByRole("button", { name: "Copy" }).first().click();
check(await page.getByText("Copied").isVisible(), "copy button confirms");
await page.emulateMedia({ media: "print" });
check(!(await page.locator("aside").first().isVisible()), "print hides the sidebar");
check(!(await page.getByRole("navigation", { name: "Module sections" }).isVisible()), "print hides the module tabs");
await page.emulateMedia({ media: "screen" });
check(errors.length === 0, `no console errors ${errors.slice(0, 3).join(" | ")}`);
await browser.close();
process.exit(failed ? 1 : 0);
