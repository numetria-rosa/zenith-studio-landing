// Exercise screen on the real-content dev server: real Pyodide run of each module's own solution and starter,
// hints one tier per click, solution lock, watch solution, reset, timeout and stop. Screenshots go to tests/visual/out.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const only = process.env.MODULES ? process.env.MODULES.split(",").map(Number) : [1, 2, 3, 4, 5, 6, 7];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
let failed = 0;
const check = (cond, msg) => { if (!cond) { failed++; console.log("FAIL", msg); } else console.log("ok  ", msg); };
const url = (n) => `${base}/lab/ai-engineering/learn/modules/${n}/exercise`;
const passing = async () => (await page.getByText(/\d+ \/ \d+ passing/).first().textContent()).trim();
const setCode = async (code) => { await page.getByRole("textbox").first().fill(code); };

for (const n of only) {
  const ex = JSON.parse(readFileSync(`content/ai-engineering/modules/${n}.json`, "utf8")).exercise;
  const total = ex.tests.length;
  await page.goto(url(n), { waitUntil: "networkidle", timeout: 120000 });
  check((await page.getByRole("listitem").filter({ hasText: ex.tests[0].name }).count()) === 1, `m${n}: test list shows the harness names`);

  if (n === 1) {
    check(await page.getByText("Run your code at least once to unlock the solution.").isVisible(), "m1: solution starts locked");
    await page.getByRole("button", { name: "Hint" }).click();
    check((await page.getByRole("note").count()) === 1, "m1: one hint tier per click (1)");
    await page.getByRole("button", { name: "Hint" }).click();
    check((await page.getByRole("note").count()) === 2, "m1: one hint tier per click (2)");
    await page.screenshot({ path: "tests/visual/out/exercise-1-hint.png" });
  }

  // starter must fail every test (and never crash the harness)
  await page.getByRole("button", { name: "Run tests" }).click();
  await page.getByText(new RegExp(`0 / ${total} tests passing`)).waitFor({ timeout: 120000 });
  check((await passing()) === `0 / ${total} passing`, `m${n}: starter passes 0/${total}`);
  if (n === 1) await page.screenshot({ path: "tests/visual/out/exercise-2-failing.png" });
  check(!(await page.getByText("Run your code at least once").isVisible().catch(() => false)), `m${n}: running unlocks the solution`);

  // the module's own solution must pass everything
  await setCode(ex.solution);
  await page.getByRole("button", { name: "Run tests" }).click();
  await page.getByText(new RegExp(`${total} / ${total} tests passing`)).waitFor({ timeout: 60000 });
  check(await page.getByText("Exercise complete").isVisible(), `m${n}: solution passes ${total}/${total}, complete card shown`);
  if (n === 1) await page.screenshot({ path: "tests/visual/out/exercise-4-solved.png" });

  // watch solution types it in, reset brings the attempt back
  await setCode(ex.starter);
  await page.getByRole("button", { name: "Watch solution" }).click();
  await page.getByText("Solution", { exact: true }).waitFor({ timeout: 30000 });
  check((await page.getByRole("textbox").first().inputValue()) === ex.solution, `m${n}: watch solution types the full solution`);
  await page.getByRole("button", { name: "Reset to my attempt" }).click();
  check((await page.getByRole("textbox").first().inputValue()) === ex.starter, `m${n}: reset restores the attempt`);
}

if (only.includes(1)) {
  await page.goto(url(1), { waitUntil: "networkidle" });
  check((await page.getByRole("textbox").first().inputValue()).includes("import json"), "m1: reload keeps the saved attempt");
  await setCode("def extract_structured_output(raw_text, schema):\n    while True:\n        pass\n");
  await page.getByRole("button", { name: "Run tests" }).click();
  await page.getByText(/Execution timed out after 8s/).waitFor({ timeout: 60000 });
  check(true, "m1: infinite loop is killed by the timeout");
  await setCode("def extract_structured_output(raw_text, schema):\n    while True:\n        pass\n");
  await page.getByRole("button", { name: "Run tests" }).click();
  await page.getByRole("button", { name: "Stop" }).click();
  check(await page.getByRole("button", { name: "Run tests" }).isVisible(), "m1: stop returns to idle");
}

check(errors.length === 0, `no console errors ${errors.slice(0, 3).join(" | ")}`);
await browser.close();
process.exit(failed ? 1 : 0);
