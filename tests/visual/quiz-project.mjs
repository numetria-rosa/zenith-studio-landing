// Quiz and Project screens on the real-content dev server (needs the throwaway aie_test DB behind aie-real).
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
let failed = 0;
const check = (cond, msg) => { if (!cond) { failed++; console.log("FAIL", msg); } else console.log("ok  ", msg); };
const mod = (n) => JSON.parse(readFileSync(`content/ai-engineering/modules/${n}.json`, "utf8"));
const go = (p) => page.goto(`${base}/lab/ai-engineering/learn/modules/${p}`, { waitUntil: "networkidle", timeout: 120000 });

/** Answers the visible question: right=true picks the correct option (or the numeric answer), else a wrong one. */
async function answer(quiz, right) {
  const heading = (await page.getByRole("heading", { level: 2 }).first().innerText()).replace(/\s+/g, " ");
  const norm = (s) => s.replace(/\\(.)/g, "$1").replace(/`+/g, "").replace(/\s+/g, " ").trim();
  const q = quiz.questions.find((x) => norm(x.question).slice(0, 30) === norm(heading).slice(0, 30));
  if (!q) throw new Error(`question not found: ${heading}`);
  if (q.numeric) {
    await page.getByLabel("Type your answer as a number").fill(String(right ? q.numeric.answer : q.numeric.answer + 999));
  } else {
    const idx = q.options.findIndex((o) => o.correct === right);
    await page.getByRole("radio").nth(idx).click();
  }
  await page.getByRole("button", { name: "Check answer" }).click();
  const box = page.getByRole("status").filter({ hasText: right ? "Correct" : "Not quite" });
  check(await box.isVisible(), `  ${q.id}: ${right ? "Correct" : "Not quite"} box`);
  await page.getByRole("button", { name: /Next question|See my score/ }).click();
}

for (const n of [1, 2, 3, 6]) {
  const quiz = mod(n).quiz;
  await go(`${n}/quiz`);
  check(await page.getByText(`Module ${n} quiz`).isVisible(), `m${n}: quiz page renders`);
  check((await page.getByRole("button", { name: "Check answer" }).getAttribute("aria-disabled")) === "true", `m${n}: Check answer disabled until an answer`);
  for (let i = 0; i < 5; i++) await answer(quiz, true);
  await page.getByText("5 / 5").waitFor({ timeout: 15000 }).catch(() => {});
  check(await page.getByText("5 / 5").isVisible(), `m${n}: perfect score shown`);
  check(await page.getByText("Passed.").isVisible(), `m${n}: passed copy`);
  if (n === 1) await page.screenshot({ path: "tests/visual/out/quiz-score.png" });
  await page.getByRole("button", { name: "Retake quiz" }).click();
  for (let i = 0; i < 5; i++) await answer(quiz, i < 2);
  await page.getByText("2 / 5").waitFor({ timeout: 15000 }).catch(() => {});
  check(await page.getByText("2 / 5").isVisible(), `m${n}: failing score shown`);
  check(await page.getByText(/You need 4 of 5 to pass/).isVisible(), `m${n}: fail copy`);
}

// project 1
await go("1/project");
check(await page.getByRole("heading", { name: "Structured Output Validator" }).isVisible(), "project 1 renders");
await page.getByRole("checkbox").first().check({ force: true });
await page.getByLabel("Architecture").selectOption("100");
await page.getByText("Progress saved.").waitFor({ timeout: 10000 });
check(true, "checklist and rubric autosave");
await page.getByLabel("GitHub URL (optional)").fill("javascript:alert(1)");
await page.getByRole("button", { name: "Save project" }).click();
check(await page.getByText(/not a valid http or https URL/).first().isVisible(), "javascript: URL refused");
await page.getByLabel("GitHub URL (optional)").fill("https://github.com/me/validator");
await page.getByLabel("Short description").fill("A validator");
await page.getByRole("button", { name: "Save project" }).click();
await page.getByText("Saved. This project now appears in My Portfolio.").waitFor({ timeout: 10000 });
check(true, "project saved");
await page.screenshot({ path: "tests/visual/out/project-1.png", fullPage: true });
await go("1/project");
check(await page.getByRole("checkbox").first().isChecked(), "reload keeps the tick");
check((await page.getByLabel("Architecture").inputValue()) === "100", "reload keeps the rubric level");
check(await page.getByText(/^Submitted, \d+%$/).isVisible(), "status reads Submitted");
await page.getByRole("button", { name: "Hint" }).click();
await page.getByRole("button", { name: "Hint" }).click();
check((await page.getByRole("note").count()) === 2, "project hints one tier per click");

check(errors.length === 0, `no console errors ${errors.slice(0, 3).join(" | ")}`);
await browser.close();
process.exit(failed ? 1 : 0);
