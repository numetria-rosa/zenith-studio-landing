// Functional + screenshot check of the shared course-app pages (needs the dev server on :3100 and the seeded test DB;
// see student-space.mjs). Completes a final assessment and a mixed quiz and checks the attempts are stored.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const L = `${base}/lab/ai-engineering/learn`;
const psql = (sql) => execFileSync("psql", ["-h", "127.0.0.1", "-p", "54329", "-U", "postgres", "-d", "aie_test", "-tAc", sql]).toString().trim();
const ok = (cond, msg) => { if (!cond) { console.error("FAIL", msg); process.exitCode = 1; } else console.log("ok  ", msg); };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await ctx.addCookies([{ name: "authjs.session-token", value: "testtoken123", url: base }]);
const page = await ctx.newPage();

for (const [name, path] of [["Dashboard", ""], ["QuizCenter", "/quizzes"], ["Projects", "/projects"], ["Portfolio", "/portfolio"], ["CheatSheets", "/cheat-sheets"], ["Roadmap", "/roadmap"], ["Career", "/career"]]) {
  await page.goto(`${L}${path}`, { waitUntil: "networkidle", timeout: 120000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.screenshot({ path: `tests/visual/out/learn-${name}.png`, fullPage: true });
  ok((await page.locator("h1").count()) === 1, `${name}: renders one h1`);
}

async function runQuiz(path, count) {
  await page.goto(`${L}${path}`, { waitUntil: "networkidle", timeout: 120000 });
  for (let i = 0; i < count; i++) {
    const number = page.locator("#quiz-number");
    if (await number.count()) await number.fill("0");
    else await page.getByRole("radio").first().click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await page.getByRole("button", { name: i === count - 1 ? "See my score" : "Next question" }).click();
  }
  await page.getByRole("button", { name: "Retake quiz" }).waitFor({ timeout: 30000 });
}

psql(`delete from "AieQuizAttempt" where "mixedId" in ('final','mix_1_3')`);
await runQuiz("/final-assessment", 10);
ok(psql(`select total from "AieQuizAttempt" where "mixedId"='final'`) === "10", "final assessment: 10 questions graded on the server and saved");
ok(Number(psql(`select score from "AieQuizAttempt" where "mixedId"='final'`)) < 10, "options are shuffled: always picking the first option no longer scores full marks");
await runQuiz("/quizzes/mixed/mix_1_3", 9);
ok(psql(`select count(*) from "AieQuizAttempt" where "mixedId"='mix_1_3'`) === "1", "mixed quiz: attempt saved");
await page.goto(`${L}/quizzes`, { waitUntil: "networkidle" });
ok(await page.getByText(/attempt/).first().isVisible(), "Quiz Center shows the attempts");

// Cross-module challenges: pick every correct option (by its text) in the first, then one wrong answer in the second.
const challenges = JSON.parse(readFileSync("content/ai-engineering/challenges.json", "utf8"));
psql(`delete from "AieQuizAttempt" where "mixedId" like 'challenge_%'`);
await page.goto(`${L}/challenges`, { waitUntil: "networkidle", timeout: 120000 });
for (const q of challenges[0].questions) await page.getByRole("radio", { name: q.options.find((o) => o.correct).text.slice(0, 40) }).first().click();
await page.getByText("Challenge passed.").waitFor({ timeout: 30000 });
ok(psql(`select score||'/'||total||'/'||passed from "AieQuizAttempt" where "mixedId"='challenge_rag'`) === "6/6/true", "challenge 1: all-correct run passes and is saved");
const wrong = challenges[1].questions[0].options.find((o) => !o.correct).text.slice(0, 40);
await page.getByRole("radio", { name: wrong }).first().click();
for (const q of challenges[1].questions.slice(1)) await page.getByRole("radio", { name: q.options.find((o) => o.correct).text.slice(0, 40) }).first().click();
await page.getByText(/Every answer needs to be right/).waitFor({ timeout: 30000 });
ok(psql(`select passed from "AieQuizAttempt" where "mixedId"='challenge_incident'`) === "f", "challenge 2: one wrong answer fails");
await browser.close();
