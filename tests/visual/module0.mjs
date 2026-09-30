// Module 0 (Orientation) on the real-content dev server: every lesson renders and each widget works.
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const B = `${base}/lab/ai-engineering/learn/modules/0`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
let failed = 0;
const check = (cond, msg) => { if (!cond) { failed++; console.log("FAIL", msg); } else console.log("ok  ", msg); };
const go = (p) => page.goto(`${B}${p}`, { waitUntil: "networkidle", timeout: 120000 });
const seen = (t) => page.getByText(t, { exact: false }).first().isVisible().catch(() => false);

const res = await go("");
check(res.status() === 200, "overview renders");
const tabs = await page.getByRole("navigation", { name: "Module sections" }).getByRole("link").allInnerTexts();
check(tabs.join(",") === "Overview,Lessons", `tabs are Overview + Lessons only (${tabs.join(",")})`);
for (let i = 1; i <= 9; i++) {
  const r = await go(`/lessons/0.${i}`);
  check(r.status() === 200, `lesson 0.${i} renders`);
}

await go("/lessons/0.1");
const first = page.locator("section").filter({ hasText: "Classify the task" }).first();
await page.getByRole("button", { name: "Data Scientist" }).first().click();
check(await seen("Analyzing usage data") || await seen("core AI engineering work"), "classify: pick shows the explanation");
await page.screenshot({ path: "tests/visual/out/m0-classify.png" });

await go("/lessons/0.2");
check(await seen("Model / AI API"), "flow: stages listed");
await go("/lessons/0.3");
check(await seen("AI Application Engineer"), "roles: cards shown");
await go("/lessons/0.4");
await page.getByRole("button", { name: "Specialized", exact: true }).click();
check(!(await seen("Git / GitHub")) && (await seen("C++ / Rust / Go")), "priority: filter narrows the table");
await go("/lessons/0.5");
check(await seen("Evaluation / Observability"), "toolbox: categories shown");
await go("/lessons/0.6");
check(await seen("Learn separately"), "roadmap: tags shown");

await go("/lessons/0.7");
const see = page.getByRole("button", { name: "See my possible directions" });
check(await see.isDisabled(), "path: result button disabled until all six answered");
const groups = page.locator("fieldset");
for (let i = 0; i < 6; i++) await groups.nth(i).getByRole("button").first().click();
await see.click();
check(await seen("Affinity score"), "path: directions shown with scores");
await page.waitForTimeout(800);
await go("/lessons/0.7");
check((await seen("Your possible directions")) && !(await seen("Affinity score")), "path: saved directions show after a reload");
await go("/lessons/0.7");
for (let i = 0; i < 6; i++) await page.locator("fieldset").nth(i).getByRole("button").first().click();
await see.click();
await page.getByRole("button", { name: "Reset" }).click();
check(!(await seen("Affinity score")), "path: reset clears the result");

await go("/lessons/0.9");
await page.getByLabel("1. Define AI Engineering in your own words").fill("AI engineering is building production software that integrates an AI model reliably.");
await page.getByLabel("1. Define AI Engineering in your own words").blur();
check(await seen("Looks like a solid definition"), "self-check: definition accepted");
const opts = page.getByRole("button", { name: "ML Engineer" });
await opts.first().click();
check(await seen("Correct. Fine-tuning a model is ML engineering work"), "self-check: correct answer explained");
check(await seen("Self-check score"), "self-check: score box shows");
await page.waitForTimeout(800);
await go("/lessons/0.9");
check(await seen("Self-check score"), "self-check: score is still there after a reload");
await page.screenshot({ path: "tests/visual/out/m0-selfcheck.png", fullPage: true });

check(errors.length === 0, `no console errors ${errors.slice(0, 3).join(" | ")}`);
await browser.close();
process.exit(failed ? 1 : 0);
