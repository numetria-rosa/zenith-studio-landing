// Walks every imported lesson (modules 1-7) on the real-content dev server and exercises each ported widget.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const B = `${base}/lab/ai-engineering/learn/modules`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
let failed = 0;
const check = (cond, msg) => { if (!cond) { failed++; console.log("FAIL", msg); } else console.log("ok  ", msg); };

let lessons = 0;
for (let n = 1; n <= 7; n++) {
  const mod = JSON.parse(readFileSync(`content/ai-engineering/modules/${n}.json`, "utf8"));
  for (const l of mod.lessons) {
    const res = await page.goto(`${B}/${n}/lessons/${l.number}`, { waitUntil: "networkidle", timeout: 120000 });
    lessons++;
    if (res.status() !== 200) check(false, `lesson ${l.number} -> ${res.status()}`);
  }
}
check(true, `${lessons} lessons rendered`);

const go = (p) => page.goto(`${B}/${p}`, { waitUntil: "networkidle", timeout: 120000 });
const text = async (t) => (await page.getByText(t, { exact: false }).first().isVisible().catch(() => false));

// module 1
await go("1/lessons/1.5");
await page.getByRole("button", { name: "Valid JSON as-is" }).first().click();
check(await text("Correct. Clean, valid JSON"), "m1 spot: answer explained");
await go("1/lessons/1.9");
await page.getByRole("button", { name: "Fenced + trailing comma" }).click();
check(await text("Step 4: validate required fields"), "m1 pipeline: four steps traced");
await go("1/lessons/1.6");
await page.getByRole("button", { name: /^C\. Validate the schema/ }).click();
check(await text("Correct. This is the only option"), "m1 decision: correct option explained");
await page.reload({ waitUntil: "networkidle" });

// module 2
await go("2/lessons/2.3");
check(await text("7000"), "m2 context: 8000 - 1000 = 7000 available");
await go("2/lessons/2.9");
check(await text("of that is pure overlap overhead"), "m2 rag sizing renders");

// module 3
await go("3/lessons/3.4");
check(await text("0.707"), "m3 angle: cos 45 = 0.707");
await go("3/lessons/3.5");
await page.getByRole("button", { name: /Chunk 2/ }).click();
check(await text("Not quite. The password-reset chunk scores highest (0.91)"), "m3 rank: wrong pick explained with the best score");
await go("3/lessons/3.9");
check(await text("chunks returned (of k=3)"), "m3 top-k renders");

// module 4
await go("4/lessons/4.3");
await page.getByRole("button", { name: "Safe to execute" }).first().click();
check(await text("Correct tool name, both required arguments"), "m4 spot: explanation shown");
await go("4/lessons/4.9");
await page.getByRole("button", { name: "Submit call (attempt 1)" }).click();
await page.getByRole("button", { name: "Retry same call ID (attempt 2)" }).click();
check(await text("Idempotency cache worked"), "m4 idempotency: cached retry");
await page.getByRole("button", { name: "Reset" }).click();
await page.getByLabel("Idempotency cache enabled").uncheck();
await page.getByRole("button", { name: "Submit call (attempt 1)" }).click();
await page.getByRole("button", { name: "Retry same call ID (attempt 2)" }).click();
check(await text("No cache, no protection"), "m4 idempotency: duplicate without the cache");

// module 5
await go("5/lessons/5.3");
await page.getByRole("button", { name: "Show next step" }).click();
check(await text("I need to check the status of order #4471"), "m5 trace: first step");
await go("5/lessons/5.9");
for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Show next step" }).click();
check(await text("Stopped: same action repeated 3 times in a row (threshold 3)"), "m5 travel: stops as stuck on the third identical booking");

// module 6
await go("6/lessons/6.3");
check(await text("200"), "m6 backoff renders");
await go("6/lessons/6.9");
check(await text("busiest 200ms window, full jitter"), "m6 thunder renders");
await page.getByRole("button", { name: "Re-roll jitter" }).click();

// module 7
await go("7/lessons/7.3");
await page.getByRole("button", { name: "Usable as-is" }).first().click();
check(await text("Has an input, a defined expected reference"), "m7 spot: explanation shown");
await go("7/lessons/7.9");
check(await text("Candidate meets the baseline."), "m7 regression: passes at baseline");

// debug case (module 3)
await go("3/lessons/3.6");
await page.getByRole("button", { name: /stale, superseded document/ }).click();
check(await text("Correct. Look at the evidence"), "m3 debug case: correct cause");

check(errors.length === 0, `no console errors ${errors.slice(0, 3).join(" | ")}`);
await browser.close();
process.exit(failed ? 1 : 0);
