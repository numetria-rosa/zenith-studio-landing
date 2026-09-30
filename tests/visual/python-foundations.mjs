// Python Foundations on the dev server + seeded test DB (see student-space.mjs); needs the Pyodide CDN (jsdelivr) reachable. Each topic's starter must not complete the exercise
// and its reference solution must pass every test in a real Pyodide run; the run is stored under module 100 + topic.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const psql = (sql) => execFileSync("psql", ["-h", "127.0.0.1", "-p", "54329", "-U", "postgres", "-d", "aie_test", "-tAc", sql]).toString().trim();
const only = process.env.TOPICS ? process.env.TOPICS.split(",").map(Number) : [1, 2, 3, 4, 5, 6, 7, 8];
const { topics } = JSON.parse(readFileSync("content/ai-engineering/python/topics.json", "utf8"));
let failed = 0;
const ok = (c, m) => { if (!c) { failed++; console.log("FAIL", m); } else console.log("ok  ", m); };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await ctx.addCookies([{ name: "authjs.session-token", value: "testtoken123", url: base }]);
const page = await ctx.newPage();
psql(`delete from "AieExerciseProgress" where module > 100`);

for (const n of only) {
  const t = topics[n - 1], total = t.exercise.tests.length;
  await page.goto(`${base}/lab/ai-engineering/learn/python/${n}`, { waitUntil: "networkidle", timeout: 120000 });
  await page.getByRole("button", { name: "Run tests" }).click();
  await page.getByText(new RegExp(`\\d+ / ${total} tests passing`)).waitFor({ timeout: 120000 });
  ok(!(await page.getByText("Exercise complete").isVisible()), `topic ${n}: the starter does not complete the exercise`);
  await page.getByRole("textbox").first().fill(t.exercise.solution);
  await page.getByRole("button", { name: "Run tests" }).click();
  await page.getByText(new RegExp(`${total} / ${total} tests passing`)).waitFor({ timeout: 60000 });
  ok(await page.getByText("Exercise complete").isVisible(), `topic ${n}: reference solution passes ${total}/${total}`);
  await page.waitForTimeout(500);
  ok(psql(`select passed||'/'||total from "AieExerciseProgress" where "userId"='u1' and module=${100 + n}`) === `${total}/${total}`, `topic ${n}: run stored under module ${100 + n}`);
}
await page.goto(`${base}/lab/ai-engineering/learn/python`, { waitUntil: "networkidle" });
ok(await page.getByText(`${only.length} of 8 exercises solved`).isVisible(), "index shows solved count");
await page.screenshot({ path: "tests/visual/out/python-index.png", fullPage: true });
await browser.close();
process.exit(failed ? 1 : 0);
