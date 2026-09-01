/**
 * Live-click checks for AISE. Serves the static course folder.
 * Distinguishes console errors. Does not claim a full student completion.
 */
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COURSE = path.join(__dirname, "..", "courses", "ai-assisted-software-engineering");
const PORT = 8765;
const BASE = `http://127.0.0.1:${PORT}`;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
};

function serve() {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    let file = path.join(COURSE, urlPath === "/" ? "dashboard.html" : urlPath);
    if (!file.startsWith(COURSE)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end("not found"); return; }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "text/plain" });
      res.end(data);
    });
  }).listen(PORT, "127.0.0.1");
}

async function main() {
  const server = serve();
  const fails = [];
  const notes = [];
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

  async function pageAt(width, url) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const t = msg.text();
      if (/Failed to load resource/.test(t)) return;
      errors.push(t);
    });
    await page.setViewport({ width, height: 800 });
    await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("body", { timeout: 10000 });
    await page.waitForFunction(() => typeof window.CourseProgress !== "undefined", { timeout: 10000 }).catch(() => {});
    return { page, errors };
  }

  try {
    {
      const { page, errors } = await pageAt(1440, "/syllabus.html");
      const text = await page.evaluate(() => document.body.innerText);
      if (!/NL-014/.test(text) || !/Fourteen Northline/.test(text)) fails.push("syllabus missing 14-module copy");
      if (!/Prompt Engineering/.test(text)) fails.push("syllabus missing prompt engineering module");
      if (/b>9 Capstone/.test(text)) fails.push("syllabus still lists 9-module capstone");
      if (errors.length) fails.push("syllabus console: " + errors.join(" | "));
      await page.waitForSelector("a.skip-to-content", { timeout: 8000 }).catch(() => {});
      const skip = await page.evaluate(() => !!document.querySelector("a.skip-to-content[href='#main-content']") && !!document.getElementById("main-content"));
      if (!skip) fails.push("syllabus missing skip link / main landmark");
      notes.push("syllabus 1440: " + (fails.length ? "issues" : "ok"));
      await page.close();
    }
    {
      const { page, errors } = await pageAt(1440, "/module-13.html");
      const locked = await page.evaluate(() => !!document.querySelector(".lockedgate") && document.body.classList.contains("capstone-locked"));
      if (!locked) fails.push("module-13 not gated for a new student");
      const live = await page.evaluate(() => ({
        gh: CourseProgress.isLiveAppUrl("https://github.com/you/repo"),
        pages: CourseProgress.isLiveAppUrl("https://you.github.io/repo/"),
        local: CourseProgress.isLiveAppUrl("http://localhost:3000"),
      }));
      if (live.gh) fails.push("github.com repo accepted as live URL");
      if (!live.pages) fails.push("github.io rejected as live URL");
      if (live.local) fails.push("localhost accepted as live URL");
      if (errors.length) fails.push("module-13 console: " + errors.join(" | "));
      await page.close();
    }
    {
      const { page, errors } = await pageAt(1440, "/practice-detective.html");
      const n = await page.evaluate(() => document.querySelectorAll(".taskcard").length);
      if (n !== 12) fails.push("detective library shows " + n + " cards, expected 12");
      const unsupported = await page.evaluate(() => document.body.innerText.includes("unsupported"));
      if (unsupported) fails.push("detective page shows unsupported");
      if (errors.length) fails.push("detective console: " + errors.join(" | "));
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/projects.html");
      const text = await page.evaluate(() => document.body.innerText);
      if (!/Locked until Module 13/.test(text)) fails.push("projects capstone lock copy missing");
      if (/need Module 9/.test(text)) fails.push("projects still mentions Module 9 unlock");
      await page.close();
    }
    {
      const { page, errors } = await pageAt(1440, "/module-01.html");
      const hasPred = await page.evaluate(() => !!document.getElementById("beforeAi") && document.getElementById("beforeAi").innerText.length > 20);
      if (!hasPred) fails.push("module-01 missing beforeAi prediction");
      await page.click("#m1check");
      const bad = await page.evaluate(() => document.getElementById("m1fb").className);
      if (!/bad/.test(bad)) fails.push("module-01 wrong answer did not fail");
      await page.evaluate(() => {
        document.getElementById("m1html").value = `<dl class="hours">
  <dt>Monday – Friday</dt>
  <dd>08:00 – 18:00</dd>
  <dt>Saturday</dt>
  <dd>09:00 – 13:00</dd>
  <dt>Sunday</dt>
  <dd>Closed</dd>
</dl>`;
        document.getElementById("m1commit").value = "Correct Saturday hours to 09:00-13:00";
      });
      await page.click("#m1check");
      const ok = await page.evaluate(() => /ok/.test(document.getElementById("m1fb").className) && document.getElementById("m1fb").innerText.includes("Shipped"));
      if (!ok) fails.push("module-01 genuine fix did not pass");
      if (errors.length) fails.push("module-01 console: " + errors.join(" | "));
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/module-02.html");
      const gated = await page.evaluate(() => document.body.classList.contains("module-locked"));
      if (!gated) fails.push("module-02 not locked after only module-01 storage from a fresh page (expected: still locked — module-01 complete was another origin page; this page is a new context so should still lock)");
      await page.close();
    }
    {
      const { page } = await pageAt(375, "/dashboard.html");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      if (overflow) fails.push("dashboard horizontal overflow at 375px");
      await page.close();
    }
    {
      const { page } = await pageAt(375, "/module-00.html");
      const walk = await page.evaluate(() => document.body.innerText.includes("The loop on a real ticket"));
      if (!walk) fails.push("module-00 missing NL-001 loop walkthrough");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      if (overflow) fails.push("module-00 horizontal overflow at 375px");
      await page.close();
    }
    {
      const { page } = await pageAt(390, "/module-04.html");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 4);
      if (overflow) fails.push("module-04 horizontal overflow at 390px");
      await page.close();
    }
    {
      const { page } = await pageAt(1024, "/tickets.html");
      const n = await page.evaluate(() => document.querySelectorAll(".ticketcard, .ticket").length);
      if (n < 14) fails.push("ticket board shows " + n + " tickets, expected 14+");
      await page.close();
    }
    {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(BASE + "/module-14.html", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForFunction(() => typeof window.CourseProgress !== "undefined" && typeof window.PromptKit !== "undefined", { timeout: 10000 });
      const freshLock = await page.evaluate(() => document.body.classList.contains("module-locked"));
      if (!freshLock) fails.push("module-14 not locked for a fresh student");
      await page.evaluate(() => {
        const rec = { score: 5, total: 5, sections: { domDataExercise: { passed: true } }, lastVisited: new Date().toISOString() };
        localStorage.setItem("zenith_aise_progress_v2", JSON.stringify({ schema: 2, modules: { 6: rec }, extra: {} }));
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => typeof window.PromptKit !== "undefined", { timeout: 10000 });
      const after6 = await page.evaluate(() => ({
        locked14: document.body.classList.contains("module-locked"),
        unlock14: CourseProgress.isUnlocked(14),
        unlock7: CourseProgress.isUnlocked(7),
      }));
      if (after6.locked14 || !after6.unlock14) fails.push("module-14 still locked after module 6 complete");
      if (after6.unlock7) fails.push("module-7 unlocked before prompt module 14");
      const title = await page.evaluate(() => document.body.innerText);
      if (!/CONTEXT/.test(title) || !/Prompt Engineering for Software Engineers/.test(title)) fails.push("module-14 missing framework or title");
      if (!/Do this now/i.test(title)) fails.push("module-14 missing Do this now");
      const stuffing = await page.evaluate(() => {
        const r = PromptKit.gradeText("tests tests tests constraints constraints context context task task tests tests tests tests", PromptKit.LABS.repair);
        return { passed: r.passed, veto: (r.veto || []).join(" ") };
      });
      if (stuffing.passed) fails.push("prompt grader accepted keyword stuffing");
      const copied = await page.evaluate(() => {
        const r = PromptKit.gradeText("Investigate the login failure in the authentication flow. First inspect the request payload, authentication response, and session creation path. Identify the root cause before editing code. Preserve the existing authentication API and validation behaviour. After the fix, add or update a regression test that reproduces the original failure and verify both successful and failed login paths.", PromptKit.LABS.repair);
        return r.passed;
      });
      if (copied) fails.push("prompt grader accepted the login example as a huddle prompt");
      const vague = await page.evaluate(() => PromptKit.gradeText("Fix the dashboard. Add tests.", PromptKit.LABS.repair).passed);
      if (vague) fails.push("prompt grader accepted a vague prompt with the word tests");
      const good = await page.evaluate(() => {
        const text = "Context: huddle dashboard in dashboard.js using appointments.json. Priya needs today, still open, and no-shows in the last 7 days.\nTask: Investigate why huddle numbers look wrong before changing code.\nConstraints: Do not modify booking.js, the authentication API, or package dependencies. Only change dashboard.js if a cause is found.\nAcceptance: Given the list for 2026-08-30, when the huddle loads, then today/open/no-show match the seven-day rule including the 6-day-back boundary.\nVerify: Add a regression test for a no-show 6 days ago vs 7 days ago. Do not claim it is fixed until that test fails on the bug and passes after.";
        document.getElementById("pk_repair").value = text;
        document.getElementById("pkbtn_repair").click();
        return {
          passed: PromptKit.loadStore().labs.repair.passed,
          fb: document.getElementById("pkfb_repair").className,
        };
      });
      if (!good.passed || !/ok/.test(good.fb)) fails.push("prompt lab 1 genuine prompt did not pass");
      const persist = await page.evaluate(() => {
        const text = document.getElementById("pk_repair").value;
        const extra = CourseProgress.getExtra("promptLabs");
        return !!(extra && extra.labs && extra.labs.repair && extra.labs.repair.passed && text.length > 40);
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => typeof window.PromptKit !== "undefined", { timeout: 10000 });
      const reloaded = await page.evaluate(() => {
        const ta = document.getElementById("pk_repair");
        const extra = CourseProgress.getExtra("promptLabs");
        return { len: ta && ta.value.length, saved: !!(extra && extra.labs && extra.labs.repair && extra.labs.repair.passed) };
      });
      if (!persist || !reloaded.saved || reloaded.len < 40) fails.push("prompt lab 1 did not persist across reload");
      const challengePartial = await page.evaluate(() => {
        const ids = ["context", "objective", "constraints", "acceptance", "tests", "verify", "stop"];
        ids.forEach(function (id) { document.getElementById("pkc_" + id).value = "tests"; });
        document.getElementById("pkc_go").click();
        return PromptKit.loadStore().challenge.passed;
      });
      if (challengePartial) fails.push("prompt challenge accepted keyword-only fields");
      const challengeOk = await page.evaluate(() => {
        const f = {
          context: "orders.js, invoice.js, totals.test.js. Line total is quantity times unit price. Existing test only covers a new order, not an edit.",
          objective: "Investigate why invoice totals are wrong after editing an order. Identify the cause in lineTotal before rewriting orders.js.",
          constraints: "Do not change the payments API, the database schema, or unrelated files. Do not rewrite orders.js from scratch.",
          acceptance: "Given an order with two gauze packs at $3, when quantity is edited to 2, then the invoice total is $6. Empty line items do not change the total.",
          tests: "Add a regression test for editing quantity, an empty line item, and the original new-order case. The test must fail if quantity is ignored.",
          verify: "Run totals.test.js. Do not claim the bug is fixed until the quantity-edit regression fails before the fix and passes after.",
          stop: "Stop if the required behaviour conflicts with the payments API or the business rule is still missing from Dan.",
        };
        Object.keys(f).forEach(function (id) { document.getElementById("pkc_" + id).value = f[id]; });
        document.getElementById("pkc_go").click();
        return PromptKit.loadStore().challenge.passed;
      });
      if (!challengeOk) fails.push("prompt challenge genuine fields did not pass");
      await page.evaluate(() => {
        document.querySelectorAll("#quizRoot .qcard").forEach(function (card) {
          const wrong = Array.prototype.find.call(card.querySelectorAll(".qopt"), function (b) {
            return !/fence|Investigate the reported|named case|Reject the extra|Stop prompting/i.test(b.textContent);
          });
          if (wrong) wrong.click();
        });
      });
      const quizWrong = await page.evaluate(() => (document.getElementById("scoreDisplay") || {}).textContent || "");
      if (!/0 \/ 5|1 \/ 5|2 \/ 5/.test(quizWrong) && !/Checkpoint/.test(quizWrong)) fails.push("module-14 checkpoint did not score a wrong pass: " + quizWrong);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => typeof window.CourseProgress !== "undefined", { timeout: 10000 });
      await page.evaluate(() => {
        document.querySelectorAll("#quizRoot .qcard").forEach(function (card) {
          const right = Array.prototype.find.call(card.querySelectorAll(".qopt"), function (b) {
            return /fence|Investigate the reported|named case|Reject the extra|Stop prompting/i.test(b.textContent);
          });
          if (right) right.click();
        });
      });
      const quizOk = await page.evaluate(() => {
        const m = CourseProgress.getModule(14);
        return { score: m.score, total: m.total, text: (document.getElementById("scoreDisplay") || {}).textContent };
      });
      if (!(quizOk.total === 5 && quizOk.score >= 4)) fails.push("module-14 checkpoint correct answers did not reach 80%: " + JSON.stringify(quizOk));
      await page.goto(BASE + "/module-07.html", { waitUntil: "domcontentloaded" });
      const sevenStillLocked = await page.evaluate(() => document.body.classList.contains("module-locked") && !CourseProgress.isModuleComplete(14));
      if (!sevenStillLocked) {
        const unlock7 = await page.evaluate(() => CourseProgress.isUnlocked(7));
        if (unlock7 && !await page.evaluate(() => CourseProgress.isModuleComplete(14))) {
          fails.push("module-7 unlocked without completing module 14");
        }
      }
      await page.evaluate(() => {
        const data = JSON.parse(localStorage.getItem("zenith_aise_progress_v2"));
        data.modules[7] = { score: 5, total: 5, sections: { aiWorkflowExercise: { passed: true } }, lastVisited: new Date().toISOString() };
        localStorage.setItem("zenith_aise_progress_v2", JSON.stringify(data));
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      const grandfather = await page.evaluate(() => ({
        seven: CourseProgress.isUnlocked(7) && CourseProgress.isModuleComplete(7),
        fourteen: CourseProgress.isUnlocked(14),
      }));
      if (!grandfather.seven) fails.push("existing completed module 7 did not stay complete/unlocked");
      if (!grandfather.fourteen) fails.push("module 14 should still unlock after module 6 when 7 is already complete");
      if (errors.length) fails.push("module-14 console: " + errors.join(" | "));
      await page.setViewport({ width: 375, height: 800 });
      await page.goto(BASE + "/module-14.html", { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 4);
      if (overflow) fails.push("module-14 horizontal overflow at 375px");
      await ctx.close();
    }
    {
      const { page } = await pageAt(768, "/practice-html.html");
      const n = await page.evaluate(() => document.querySelectorAll(".taskcard").length);
      if (n !== 20) fails.push("html practice cards " + n);
      const firstHead = await page.$(".taskhead");
      if (firstHead) await firstHead.click();
      await page.evaluate(() => {
        const ta = document.querySelector(".student");
        const btn = document.querySelector(".gradebtn");
        if (ta && btn) {
          ta.value = "<p>no heading</p>";
          btn.click();
        }
      });
      const fb = await page.evaluate(() => {
        const el = document.querySelector(".feedback");
        return el ? el.className + " " + el.innerText : "";
      });
      if (!/bad/.test(fb) && !/h1/.test(fb)) fails.push("html practice wrong answer did not surface a failure: " + fb);
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/desktop-labs.html");
      const text = await page.evaluate(() => document.body.innerText);
      if (!/optional/i.test(text)) fails.push("desktop labs missing optional URL copy");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/practice-specs.html");
      const head = await page.$(".taskhead");
      if (head) await head.click();
      const val = await page.evaluate(() => {
        const b = document.querySelector(".qopt");
        return b ? b.getAttribute("data-val") : null;
      });
      if (!val) fails.push("specs MCQ options did not render");
      if (val === "correct") fails.push("MCQ data-val still 'correct'");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/practice-css.html");
      const cheat = await page.evaluate(() => {
        const task = AISE_TASKS.find((t) => t.id === "css-f11");
        const commented = PracticeKit.gradeCss(task, "/* box-sizing: border-box */ .box { }");
        const empty = PracticeKit.gradeCss(task, ".box { }");
        const real = PracticeKit.gradeCss(task, ".box { box-sizing: border-box; }");
        return { cheatPass: commented.passed, emptyPass: empty.passed, realPass: real.passed };
      });
      if (cheat.cheatPass) fails.push("css-f11 still passes on a comment");
      if (cheat.emptyPass) fails.push("css-f11 empty starter passed");
      if (!cheat.realPass) fails.push("css-f11 genuine border-box failed");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/practice-detective.html");
      const head = await page.$(".taskhead");
      if (head) await head.click();
      await page.waitForSelector(".detsubmit", { visible: true, timeout: 8000 });
      await page.click(".taskbody.open .detsubmit");
      const dump = await page.evaluate(() => {
        const open = document.querySelector(".taskbody.open");
        const fb = open && (open.querySelector(".detfb1") || open.querySelector(".feedback"));
        return {
          findings: open ? open.querySelectorAll(".detfinding").length : 0,
          fbClass: fb ? fb.className : null,
          fbText: fb ? fb.innerText.slice(0, 180) : null,
        };
      });
      if (!(dump.fbClass && /bad/.test(dump.fbClass))) {
        fails.push("detective empty charge sheet did not fail " + JSON.stringify(dump));
      }
      await page.close();
    }

    async function overflowAt(width, url, label) {
      const { page, errors } = await pageAt(width, url);
      await page.waitForSelector(".courserail, .elab, .wrap", { timeout: 8000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 250));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 4);
      if (overflow) fails.push(label + " horizontal overflow at " + width + "px (sw=" + (await page.evaluate(() => document.documentElement.scrollWidth)) + ")");
      if (errors.length) fails.push(label + " console: " + errors.join(" | "));
      await page.close();
    }

    {
      const { page, errors } = await pageAt(1440, "/practice-specs.html");
      const banner = await page.evaluate(() => /labeled simulation/i.test(document.body.innerText));
      if (!banner) fails.push("spec lab missing simulation banner");
      await page.evaluate(() => {
        const r4 = document.querySelector('#specLab [data-id="r4"]');
        if (r4) r4.click();
        const btn = document.querySelector('#specLab [data-check="reqs"]');
        if (btn) btn.click();
      });
      const wrong = await page.evaluate(() => {
        const phases = document.querySelectorAll("#specPhases .elab-phase");
        const fb = phases[0] && phases[0].querySelector(".feedback");
        return fb ? fb.className + " " + fb.innerText : "";
      });
      if (!/bad/.test(wrong)) fails.push("spec lab invention chip did not fail: " + wrong);
      await page.evaluate(() => {
        ["r1", "r2", "r3", "r7", "r9"].forEach((id) => {
          const b = document.querySelector('#specLab [data-id="' + id + '"]');
          if (b && b.getAttribute("aria-pressed") !== "true") b.click();
        });
        const r4 = document.querySelector('#specLab [data-id="r4"]');
        if (r4 && r4.getAttribute("aria-pressed") === "true") r4.click();
        const btn = document.querySelector('#specLab [data-check="reqs"]');
        if (btn) btn.click();
      });
      const ok = await page.evaluate(() => {
        const phases = document.querySelectorAll("#specPhases .elab-phase");
        const fb = phases[0] && phases[0].querySelector(".feedback");
        return fb ? fb.className : "";
      });
      if (!/ok/.test(ok)) fails.push("spec lab correct scope did not pass");
      await page.evaluate(() => {
        ["c1", "c2", "c4"].forEach((id) => document.querySelector('#specLab [data-id="' + id + '"]')?.click());
        document.querySelector('#specLab [data-check="criteria"]')?.click();
        ["q1", "q2", "q4", "q6"].forEach((id) => document.querySelector('#specLab [data-id="' + id + '"]')?.click());
        document.querySelector('#specLab [data-check="questions"]')?.click();
        ["f1", "f2", "f3", "f5"].forEach((id) => document.querySelector('#specLab [data-id="' + id + '"]')?.click());
        document.querySelector('#specLab [data-check="flags"]')?.click();
      });
      const all = await page.evaluate(() => document.getElementById("specFb")?.className || "");
      if (!/ok/.test(all)) fails.push("spec lab full correct path did not complete");
      if (errors.length) fails.push("spec lab console: " + errors.join(" | "));
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/practice-specs.html");
      const persisted = await page.evaluate(() => {
        const extra = CourseProgress.getExtra("engLabs");
        return extra && extra.spec && extra.spec.passed === true;
      });
      if (!persisted) fails.push("spec lab pass did not persist after refresh");
      await page.close();
    }
    {
      const { page, errors } = await pageAt(1440, "/practice-git.html");
      const sim = await page.evaluate(() => /labeled simulation/i.test(document.body.innerText));
      if (!sim) fails.push("git lab missing simulation banner");
      await page.click('[data-scene="g1"] [data-id="c0"]');
      const bad = await page.evaluate(() => document.querySelector('[data-scene="g1"] .feedback')?.className || "");
      if (!/bad/.test(bad)) fails.push("git g1 wrong commit did not fail");
      await page.click('[data-scene="g1"] [data-id="c1"]');
      const good = await page.evaluate(() => document.querySelector('[data-scene="g1"] .feedback')?.className || "");
      if (!/ok/.test(good)) fails.push("git g1 live-main commit did not pass");
      await page.click('[data-scene="g2"] [data-id="c3"]');
      await page.click('[data-scene="g3"] [data-v="revert"]');
      const g3btns = await page.$$('[data-scene="g3"] .elab-subq');
      if (g3btns[1]) {
        const forward = await g3btns[1].$('[data-v="forward"]');
        if (forward) await forward.click();
      }
      await page.click('[data-scene="g4"] [data-side="ours"]');
      const g4second = await page.$$('[data-scene="g4"] .conflict');
      if (g4second[1]) {
        const either = await g4second[1].$('[data-side="ours"]');
        if (either) await either.click();
      }
      const gitPassed = await page.evaluate(() => {
        const extra = CourseProgress.getExtra("engLabs");
        return extra && extra.git && extra.git.passed === true;
      });
      if (!gitPassed) fails.push("git lab 3-of-4 did not complete after correct path");
      if (errors.length) fails.push("git lab console: " + errors.join(" | "));
      await page.close();
    }
    {
      const { page, errors } = await pageAt(1440, "/practice-review.html");
      await page.evaluate(() => document.querySelector('[data-pr="pr1"] [data-v="approve"]')?.click());
      const pre = await page.evaluate(() => document.querySelector('[data-pr="pr1"] .feedback')?.innerText || "");
      if (!/charge sheet/i.test(pre) && !/Fix the charge sheet/i.test(pre)) fails.push("PR vote before charge sheet did not fail: " + pre);
      await page.evaluate(() => {
        document.querySelector('[data-pr="pr1"] [data-id="i1"]')?.click();
        document.querySelector('[data-pr="pr1"] [data-id="i3"]')?.click();
        document.querySelector('[data-pr="pr1"] [data-v="request"]')?.click();
      });
      const pr1ok = await page.evaluate(() => document.querySelector('[data-pr="pr1"] .feedback')?.className || "");
      if (!/ok/.test(pr1ok)) fails.push("PR pr1 correct request-changes did not pass");
      await page.evaluate(() => {
        (EngLab.PRS || []).forEach(function (pr) {
          const card = document.querySelector('[data-pr="' + pr.id + '"]');
          if (!card) return;
          (pr.issues || []).forEach(function (iss) {
            const chip = card.querySelector('[data-id="' + iss.id + '"]');
            if (!chip) return;
            const on = chip.getAttribute("aria-pressed") === "true";
            if (iss.real && !on) chip.click();
            if (!iss.real && on) chip.click();
          });
          const vote = card.querySelector('[data-v="' + pr.decision + '"]');
          if (vote) vote.click();
        });
      });
      const reviewPassed = await page.evaluate(() => {
        const extra = CourseProgress.getExtra("engLabs");
        return extra && extra.review && extra.review.passed === true;
      });
      if (!reviewPassed) fails.push("PR lab 5-of-7 did not complete");
      if (errors.length) fails.push("PR lab console: " + errors.join(" | "));
      await page.close();
    }
    {
      const { page, errors } = await pageAt(1440, "/module-07.html");
      const ship = await page.evaluate(() => {
        const root = document.getElementById("shipM7");
        if (!root || typeof EngLab === "undefined") return { missing: true };
        root.querySelector('[data-v="ship"]').click();
        const bad = root.querySelector(".feedback").className;
        const conseq = root.querySelector(".conseq");
        const afterShip = conseq && !conseq.hidden && /Priya/i.test(conseq.innerText);
        root.querySelector('[data-v="request"]').click();
        const ok = root.querySelector(".feedback").className;
        const afterReq = conseq && !conseq.hidden && /Sam/i.test(conseq.innerText);
        return { missing: false, bad: bad, ok: ok, afterShip: afterShip, afterReq: afterReq };
      });
      if (ship.missing) fails.push("shipM7 mount missing");
      if (!/bad/.test(ship.bad || "")) fails.push("ship-m7 Ship it did not fail");
      if (!/ok/.test(ship.ok || "")) fails.push("ship-m7 request-changes did not pass");
      if (!ship.afterShip) fails.push("ship-m7 missing consequence after Ship it");
      if (!ship.afterReq) fails.push("ship-m7 missing consequence after request-changes");
      if (errors.length) fails.push("module-07 console: " + errors.join(" | "));
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/module-09.html");
      const ship = await page.evaluate(() => {
        const root = document.getElementById("shipM9");
        if (!root) return { missing: true };
        root.querySelector('[data-v="ship"]').click();
        const bad = root.querySelector(".feedback").className;
        root.querySelector('[data-v="request"]').click();
        const ok = root.querySelector(".feedback").className;
        return { missing: false, bad: bad, ok: ok };
      });
      if (ship.missing) fails.push("shipM9 mount missing");
      if (!/bad/.test(ship.bad || "")) fails.push("ship-m9 Ship it did not fail");
      if (!/ok/.test(ship.ok || "")) fails.push("ship-m9 request-changes did not pass");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/module-11.html");
      const ship = await page.evaluate(() => {
        const root = document.getElementById("shipM11");
        if (!root) return { missing: true };
        root.querySelector('[data-v="ship"]').click();
        const bad = root.querySelector(".feedback").className;
        root.querySelector('[data-v="investigate"]').click();
        const ok = root.querySelector(".feedback").className;
        return { missing: false, bad: bad, ok: ok };
      });
      if (ship.missing) fails.push("shipM11 mount missing");
      if (!/bad/.test(ship.bad || "")) fails.push("ship-m11 Ship it did not fail");
      if (!/ok/.test(ship.ok || "")) fails.push("ship-m11 investigate did not pass");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/desktop-labs.html");
      const short = await page.evaluate(() => CourseProgress.completeDesktopLab("cursor", {
        confirmed: true,
        fields: { ticket: "too short", ask: "too short", generated: "too short", inspected: "too short", tested: "too short", surprised: "too short" },
      }));
      if (short.ok) fails.push("desktop lab A accepted short fields");
      const missingWrong = await page.evaluate(() => CourseProgress.completeDesktopLab("cursor", {
        confirmed: true,
        fields: {
          ticket: "Saturday hours 09:00-13:00 and a Book button on the landing page.",
          ask: "Change the hours list and add a visible Book button next to the intro.",
          generated: "It rewrote the whole hours definition list and added a button with the Book label.",
          inspected: "I checked the Saturday line against Priya's note and removed a stray Stripe script it invented.",
          tested: "Opened the page, confirmed Saturday hours and that Book is visible without a console error.",
          surprised: "It added a payment script that was never in the ticket.",
          shipCall: "I would not ship until Saturday hours are checked at 390px and Book is keyboard reachable.",
          monitor: "I would watch failed Book clicks and any 404 on the hours page after deploy.",
        },
      }));
      if (missingWrong.ok) fails.push("desktop lab A accepted a submission with no 'AI got wrong' field");
      const missingShip = await page.evaluate(() => CourseProgress.completeDesktopLab("cursor", {
        confirmed: true,
        fields: {
          ticket: "Saturday hours 09:00-13:00 and a Book button on the landing page.",
          ask: "Change the hours list and add a visible Book button next to the intro.",
          generated: "It rewrote the whole hours definition list and added a button with the Book label.",
          aiWrong: "It invented a Stripe checkout that was never in the ticket and skipped Sunday Closed.",
          inspected: "I checked the Saturday line against Priya's note and removed a stray Stripe script it invented.",
          tested: "Opened the page, confirmed Saturday hours and that Book is visible without a console error.",
          surprised: "It added a payment script that was never in the ticket.",
        },
      }));
      if (missingShip.ok) fails.push("desktop lab A accepted a submission with no ship/monitor fields");
      const full = await page.evaluate(() => CourseProgress.completeDesktopLab("cursor", {
        confirmed: true,
        fields: {
          ticket: "Saturday hours 09:00-13:00 and a Book button on the landing page.",
          ask: "Change the hours list and add a visible Book button next to the intro.",
          generated: "It rewrote the whole hours definition list and added a button with the Book label.",
          aiWrong: "It invented a Stripe checkout that was never in the ticket and skipped Sunday Closed.",
          inspected: "I checked the Saturday line against Priya's note and removed a stray Stripe script it invented.",
          tested: "Opened the page, confirmed Saturday hours and that Book is visible without a console error.",
          surprised: "It added a payment script that was never in the ticket.",
          shipCall: "I would not ship until Saturday hours are checked at 390px and Book is keyboard reachable.",
          monitor: "I would watch failed Book clicks and any 404 on the hours page after deploy.",
        },
      }));
      if (!full.ok) fails.push("desktop lab A genuine fields failed: " + (full.error || ""));
      const ghBad = await page.evaluate(() => CourseProgress.completeDesktopLab("github", {
        url: "https://example.com/repo",
        confirmed: true,
        fields: {
          changed: "README and three commits on a public repo I own for Northline.",
          problem: "The first push was rejected because the remote had no main yet.",
          resolved: "Created main on GitHub then pushed -u origin main from Cursor.",
        },
      }));
      if (ghBad.ok) fails.push("desktop lab B accepted a non-github URL");
      const ghOk = await page.evaluate(() => CourseProgress.completeDesktopLab("github", {
        url: "https://github.com/demo-student/northline-landing",
        prUrl: "https://github.com/demo-student/northline-landing/pull/1",
        confirmed: true,
        fields: {
          changed: "README and three commits on a public repo I own for Northline.",
          problem: "The first push was rejected because the remote had no main yet.",
          resolved: "Created main on GitHub then pushed -u origin main from Cursor.",
          userCheck: "README clone steps work and the live URL is https, not localhost.",
        },
      }));
      if (!ghOk.ok) fails.push("desktop lab B genuine github URL failed: " + (ghOk.error || ""));
      const ghProbeFail = await page.evaluate(() => CourseProgress.completeDesktopLab("github", {
        url: "https://github.com/demo-student/northline-landing",
        confirmed: true,
        probe: { hardFail: true, error: "GitHub says this repo does not exist or is private." },
        fields: {
          changed: "README and three commits on a public repo I own for Northline.",
          problem: "The first push was rejected because the remote had no main yet.",
          resolved: "Created main on GitHub then pushed -u origin main from Cursor.",
          userCheck: "README clone steps work and the live URL is https, not localhost.",
        },
      }));
      if (ghProbeFail.ok) fails.push("desktop lab B accepted a GitHub 404/hardFail probe");
      const stillLocked = await page.evaluate(() => {
        return CourseProgress.isUnlocked(13) === false;
      });
      if (!stillLocked) fails.push("capstone unlocked after desktop labs alone");
      await page.close();
    }
    {
      const { page, errors } = await pageAt(1440, "/graduation.html");
      const text = await page.evaluate(() => document.body.innerText);
      if (/You finished the loop/.test(text)) fails.push("graduation shows complete state for a new student");
      if (!/What Zenith Lab verifies/.test(text)) fails.push("graduation missing verify/not-verify copy");
      if (/87% job ready|job-ready/.test(text)) fails.push("graduation invents a job-ready score");
      const snap = await page.evaluate(() => CourseProgress.evidenceSnapshot());
      if (snap.courseModulesComplete) fails.push("evidenceSnapshot says course complete for a new student");
      if (errors.length) fails.push("graduation console: " + errors.join(" | "));
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/career.html");
      const text = await page.evaluate(() => document.body.innerText);
      if (!/How to describe the course honestly/.test(text)) fails.push("career missing honest wording");
      if (!/does not guarantee a job/.test(text)) fails.push("career dropped the no-job-guarantee");
      if (!/What to build next/.test(text)) fails.push("career missing next projects");
      await page.close();
    }
    {
      const { page, errors } = await pageAt(1440, "/practice-integrated.html");
      const sim = await page.evaluate(() => /labeled simulation/i.test(document.body.innerText));
      if (!sim) fails.push("integrated lab missing simulation banner");
      await page.evaluate(() => {
        const card = document.querySelector('[data-next="n1"]');
        card.querySelector('[data-v="ship"]').click();
      });
      const bad = await page.evaluate(() => document.querySelector('[data-next="n1"] .feedback')?.className || "");
      if (!/bad/.test(bad)) fails.push("integrated n1 ship did not fail");
      await page.evaluate(() => {
        document.querySelector('[data-next="n1"] [data-v="phone"]').click();
        document.querySelector('[data-next="n3"] [data-v="live"]').click();
      });
      const passed = await page.evaluate(() => {
        const extra = CourseProgress.getExtra("engLabs");
        return extra && extra.integrated && extra.integrated.passed === true;
      });
      if (!passed) fails.push("integrated lab 2-of-3 did not complete");
      if (errors.length) fails.push("integrated console: " + errors.join(" | "));
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/quiz-center.html");
      const has13 = await page.evaluate(() => !!document.querySelector('#modPick option[value="13"]'));
      if (!has13) fails.push("quiz center missing module 13 bank");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/portfolio.html");
      const empty = await page.evaluate(() => document.body.innerText.includes("Nothing completed yet"));
      if (!empty) fails.push("portfolio empty state missing");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/practice-detective.html");
      const n = await page.evaluate(() => document.querySelectorAll(".taskcard").length);
      if (n !== 12) fails.push("detective library shows " + n + " cards, expected 12");
      const grade = await page.evaluate(() => {
        const task = AISE_TASKS.find((t) => t.id === "det-11");
        const empty = PracticeKit.gradeJs(task.fix, "function isBookingConfirmed(result) { return true; }");
        const real = PracticeKit.gradeJs(task.fix, `function isBookingConfirmed(result) {
          if (!result || result.ok !== true) return false;
          return String(result.confirmationId || "").trim().length > 0;
        }`);
        return { emptyPass: empty.passed, realPass: real.passed };
      });
      if (grade.emptyPass) fails.push("det-11 still passes a tautology");
      if (!grade.realPass) fails.push("det-11 genuine confirmation check failed");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/projects.html");
      const liveReject = await page.evaluate(() => ({
        gh: !CourseProgress.isLiveAppUrl("https://github.com/you/repo"),
        example: !CourseProgress.isLiveAppUrl("https://example.com"),
        course: !CourseProgress.isLiveAppUrl("https://www.zenith-studio.site"),
        pages: !!CourseProgress.isLiveAppUrl("https://you.github.io/repo/"),
      }));
      if (!liveReject.gh) fails.push("projects still treats github.com as a live app URL");
      if (!liveReject.example) fails.push("example.com accepted as live app URL");
      if (!liveReject.course) fails.push("course host accepted as live app URL");
      if (!liveReject.pages) fails.push("github.io rejected as live app URL");
      const gates = await page.evaluate(() => {
        const mount = document.getElementById("capGates");
        return !!(mount && mount.querySelector("[data-check]"));
      });
      if (!gates) fails.push("capstone gates missing on projects page");
      await page.close();
    }
    {
      const { page, errors } = await pageAt(1440, "/ai-review.html");
      const passed = await page.evaluate(() => {
        const root = document.getElementById("aiReviewLab");
        if (!root) return { missing: true };
        root.querySelector('[data-scene="ar1"] [data-v="build"]').click();
        const bad = root.querySelector('[data-scene="ar1"] .feedback').className;
        root.querySelector('[data-scene="ar1"] [data-v="split"]').click();
        root.querySelector('[data-scene="ar2"] [data-v="fail"]').click();
        root.querySelector('[data-scene="ar3"] [data-v="reject"]').click();
        const extra = CourseProgress.getExtra("engLabs");
        return { missing: false, bad: bad, passed: extra && extra.aiReview && extra.aiReview.passed };
      });
      if (passed.missing) fails.push("AI Review Lab mount missing");
      if (!/bad/.test(passed.bad || "")) fails.push("AI Review ar1 wrong answer did not fail");
      if (!passed.passed) fails.push("AI Review 3-of-4 did not pass");
      if (errors.length) fails.push("ai-review console: " + errors.join(" | "));
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/interview.html");
      const passed = await page.evaluate(() => {
        const root = document.getElementById("interviewLab");
        if (!root) return false;
        root.querySelector('[data-scene="iv1"] [data-v="scope"]').click();
        root.querySelector('[data-scene="iv2"] [data-v="specific"]').click();
        root.querySelector('[data-scene="iv3"] [data-v="honest"]').click();
        return !!(CourseProgress.getExtra("engLabs").interview && CourseProgress.getExtra("engLabs").interview.passed);
      });
      if (!passed) fails.push("interview 3-of-4 did not pass");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/incident.html");
      const passed = await page.evaluate(() => {
        const root = document.getElementById("incidentLab");
        if (!root) return false;
        root.querySelector('[data-scene="inc1"] [data-v="repro"]').click();
        root.querySelector('[data-scene="inc2"] [data-v="no"]').click();
        root.querySelector('[data-scene="inc3"] [data-v="revert"]').click();
        return !!(CourseProgress.getExtra("engLabs").incident && CourseProgress.getExtra("engLabs").incident.passed);
      });
      if (!passed) fails.push("incident 3-of-4 did not pass");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/graduation.html");
      const text = await page.evaluate(() => document.body.innerText);
      if (!/Engineering Evidence Score/i.test(text)) fails.push("graduation missing Engineering Evidence Score");
      if (!/Next 30 days/i.test(text)) fails.push("graduation missing 30-day plan");
      if (/job-readiness score of/i.test(text)) fails.push("graduation claims a job-readiness score");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/career.html");
      const copy = await page.evaluate(() => document.getElementById("copyLinkedin") && document.getElementById("copyLinkedin").textContent.length > 40);
      if (!copy) fails.push("career missing generated LinkedIn copy");
      const honest = await page.evaluate(() => /not professional employment/i.test(document.body.innerText));
      if (!honest) fails.push("career missing not-employment wording");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/passport.html");
      const text = await page.evaluate(() => document.body.innerText);
      if (!/Platform verified/i.test(text)) fails.push("passport missing evidence classes");
      if (!/Semantic quality not verified/i.test(text)) fails.push("passport missing semantic-quality disclaimer");
      await page.close();
    }
    {
      const { page, errors } = await pageAt(1440, "/release-review.html");
      const r = await page.evaluate(() => {
        const root = document.getElementById("releaseLab");
        if (!root) return { missing: true };
        root.querySelector('[data-scene="rr1"] [data-v="ship"]').click();
        const bad = root.querySelector('[data-scene="rr1"] .feedback').className;
        ["rr1", "rr2", "rr3", "rr4", "rr5", "rr6", "rr7", "rr8"].forEach((id) => {
          const map = { rr1: "cut", rr2: "empty", rr3: "reject", rr4: "fix", rr5: "fix", rr6: "fix", rr7: "fix", rr8: "metric" };
          root.querySelector('[data-scene="' + id + '"] [data-v="' + map[id] + '"]').click();
        });
        const extra = CourseProgress.getExtra("engLabs");
        return { missing: false, bad: bad, passed: extra && extra.releaseReview && extra.releaseReview.passed };
      });
      if (r.missing) fails.push("release review mount missing");
      if (!/bad/.test(r.bad || "")) fails.push("release rr1 wrong answer did not fail");
      if (!r.passed) fails.push("release review 8-of-10 did not pass");
      if (errors.length) fails.push("release-review console: " + errors.join(" | "));
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/work-session.html");
      const short = await page.evaluate(() => {
        document.getElementById("wsSave").click();
        return document.getElementById("wsFb").className;
      });
      if (!/bad/.test(short)) fails.push("work session accepted empty fields");
      const banner = await page.evaluate(() => /self-reported/i.test(document.body.innerText));
      if (!banner) fails.push("work session missing self-reported label");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/projects.html");
      const preship = await page.evaluate(() => !!document.querySelector("#preshipLab [data-scene]"));
      if (!preship) fails.push("pre-ship lab missing on projects");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/module-02.html");
      const now = await page.evaluate(() => /Do this now/i.test(document.body.innerText));
      if (!now) fails.push("module-02 missing Do this now");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/module-03.html");
      const now = await page.evaluate(() => /Do this now/i.test(document.body.innerText) && /Go deeper/i.test(document.body.innerText));
      if (!now) fails.push("module-03 missing Do this now / Go deeper");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/module-06.html");
      const now = await page.evaluate(() => /Do this now/i.test(document.body.innerText) && /innerHTML/i.test(document.body.innerText));
      if (!now) fails.push("module-06 missing Do this now");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/module-12.html");
      const now = await page.evaluate(() => /Do this now/i.test(document.body.innerText) && /Go deeper/i.test(document.body.innerText));
      if (!now) fails.push("module-12 missing Do this now / Go deeper");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/syllabus.html");
      const a11y = await page.evaluate(() => /not independently certified/i.test(document.body.innerText) && /WCAG/i.test(document.body.innerText));
      if (!a11y) fails.push("syllabus missing a11y / WCAG non-certification");
      const pay = await page.evaluate(() => /cannot run a live card payment/i.test(document.body.innerText));
      if (!pay) fails.push("syllabus missing checkout honesty");
      const lim = await page.evaluate(() => /Cannot verify/i.test(document.body.innerText) && /Cursor was open/i.test(document.body.innerText));
      if (!lim) fails.push("syllabus missing cannot-verify section");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/incident.html");
      const empty = await page.evaluate(() => {
        const btn = document.getElementById("idSave");
        if (!btn) return "missing";
        btn.click();
        return document.getElementById("idFb").className;
      });
      if (empty === "missing") fails.push("incident debrief missing");
      else if (!/bad/.test(empty)) fails.push("incident debrief accepted empty fields");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/module-10.html");
      const git = await page.evaluate(() => /Pull request/i.test(document.body.innerText) && /Go deeper/i.test(document.body.innerText));
      if (!git) fails.push("module-10 missing Git glossary / go deeper");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/career.html");
      const cs = await page.evaluate(() => /No completed capstone/i.test(document.body.innerText) || /Portfolio case study/i.test(document.body.innerText));
      if (!cs) fails.push("career missing case study section");
      await page.close();
    }
    {
      const { page } = await pageAt(1440, "/quiz-center.html");
      const mix = await page.evaluate(() => {
        const extra = AISEQuizData.CENTER_EXTRA;
        const flat = Array.isArray(extra) ? extra : Object.keys(extra).reduce((acc, k) => acc.concat(extra[k] || []), []);
        return flat.length > 5 && !!AISEQuizData.CENTER_EXTRA.j;
      });
      if (!mix) fails.push("quiz extra judgment bank missing");
      await page.close();
    }

    {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      page.on("pageerror", (e) => fails.push("isolated console: " + e));
      await page.setViewport({ width: 1440, height: 800 });
      await page.goto(BASE + "/dashboard.html", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForFunction(() => typeof window.CourseProgress !== "undefined", { timeout: 10000 }).catch(() => {});
      await page.waitForSelector("details.rail-g", { timeout: 8000 }).catch(() => {});
      const next = await page.evaluate(() => (document.getElementById("nextAction") || {}).innerText || "");
      if (!/orientation/i.test(next)) fails.push("fresh dashboard does not send learner to orientation");
      const grouped = await page.evaluate(() => document.querySelectorAll("details.rail-g").length >= 4);
      if (!grouped) fails.push("rail missing grouped navigation");
      await page.goto(BASE + "/career.html", { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.getElementById("copyLinkedin") && document.getElementById("copyLinkedin").textContent.length > 20, { timeout: 8000 }).catch(() => {});
      const li = await page.evaluate(() => (document.getElementById("copyLinkedin") || {}).textContent || "");
      if (/public https URL/i.test(li) && /shipped/i.test(li)) fails.push("quiz-only career copy claims a shipped live URL");
      if (!/orientation and quizzes only|have not yet recorded/i.test(li)) fails.push("quiz-only career copy missing honest empty-evidence wording");
      const say = await page.evaluate(() => {
        const el = document.getElementById("sayShip");
        return !el || el.hidden || el.getAttribute("hidden") !== null;
      });
      if (!say) fails.push("career overclaim quote visible without capstone");
      await page.goto(BASE + "/graduation.html", { waitUntil: "domcontentloaded" });
      await page.waitForSelector("#limSave", { timeout: 8000 }).catch(() => {});
      const lim = await page.evaluate(() => {
        const btn = document.getElementById("limSave");
        if (!btn) return { missing: true };
        btn.click();
        return { missing: false, cls: document.getElementById("limFb").className };
      });
      if (lim.missing) fails.push("graduation limitations check missing");
      else if (!/bad/.test(lim.cls || "")) fails.push("limitations check accepted empty selection");
      const files = ["module-00.html", "module-01.html", "module-02.html", "module-03.html", "module-04.html", "module-05.html", "module-06.html", "module-14.html", "module-07.html", "module-08.html", "module-09.html", "module-10.html", "module-11.html", "module-12.html", "module-13.html"];
      for (const file of files) {
        await page.goto(BASE + "/" + file, { waitUntil: "domcontentloaded", timeout: 30000 });
        const ok = await page.evaluate(() => /Do this now|What you do next/i.test(document.body.innerText));
        if (!ok) fails.push(file + " missing beginner now-box");
      }
      await ctx.close();
    }
    {
      const { page } = await pageAt(1440, "/passport.html");
      const buckets = await page.evaluate(() => /What remains unverified/i.test(document.body.innerText) && /What I practiced/i.test(document.body.innerText));
      if (!buckets) fails.push("passport missing evidence buckets");
      await page.keyboard.press("Tab");
      const skip = await page.evaluate(() => (document.activeElement && document.activeElement.className) || "");
      if (!/skip-to-content/.test(skip)) notes.push("skip-link not first tab stop (may be ok if browser chrome stole focus)");
      await page.close();
    }

    await overflowAt(375, "/practice-specs.html", "spec lab");
    await overflowAt(390, "/practice-git.html", "git lab");
    await overflowAt(375, "/practice-review.html", "pr lab 375");
    await overflowAt(390, "/module-09.html", "module-09");
    await overflowAt(375, "/graduation.html", "graduation");
    await overflowAt(375, "/career.html", "career");
    await overflowAt(390, "/practice-integrated.html", "integrated lab");
    await overflowAt(768, "/portfolio.html", "portfolio");
    await overflowAt(1024, "/quiz-center.html", "quiz center");
    await overflowAt(375, "/module-07.html", "module-07");
    await overflowAt(320, "/ai-review.html", "ai-review 320");
    await overflowAt(390, "/interview.html", "interview 390");
    await overflowAt(375, "/incident.html", "incident 375");
    await overflowAt(320, "/passport.html", "passport 320");
    await overflowAt(430, "/projects.html", "projects 430");
    await overflowAt(375, "/desktop-labs.html", "desktop labs 375");
    await overflowAt(768, "/mastery-profile.html", "mastery 768");
    await overflowAt(375, "/release-review.html", "release 375");
    await overflowAt(320, "/work-session.html", "work session 320");
    await overflowAt(390, "/module-02.html", "module-02");
    await overflowAt(375, "/module-05.html", "module-05");
    await overflowAt(430, "/module-10.html", "module-10");
    await overflowAt(320, "/module-03.html", "module-03 320");
    await overflowAt(375, "/module-04.html", "module-04 375");
    await overflowAt(320, "/module-06.html", "module-06 320");
    await overflowAt(375, "/module-12.html", "module-12 375");
    await overflowAt(375, "/module-08.html", "module-08 375");
  } finally {
    await browser.close();
    server.close();
  }

  if (fails.length) {
    console.log("LIVE FAILS:");
    fails.forEach((f) => console.log(" -", f));
    process.exit(1);
  }
  console.log("Live puppeteer checks passed.");
  notes.forEach((n) => console.log(n));
}

main().catch((e) => { console.error(e); process.exit(1); });
