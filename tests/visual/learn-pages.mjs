// Functional + screenshot check of the shared course-app pages (needs the dev server on :3100 and the seeded test DB;
// see student-space.mjs). Completes a final assessment and a mixed quiz and checks the attempts are stored.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";

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
await browser.close();
