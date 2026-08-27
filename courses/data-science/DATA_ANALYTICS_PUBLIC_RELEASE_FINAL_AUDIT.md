# Data Science & Analysis — FINAL Public-Release Audit
**Date:** 2026-08-27
**Scope:** Independent, adversarial re-audit per the 25-phase brief. Two prior reports exist in this directory (`DATA_ANALYTICS_FINAL_AUDIT.md`, `DATA_ANALYTICS_PUBLIC_RELEASE_AUDIT.md`, dated 2026-08-25/26) — both were read for context only. Every claim below was independently reproduced this session unless explicitly marked otherwise. Nothing from the prior reports is re-asserted as fact without fresh evidence.

**Method:** Course files served from a local static server (`npx serve`, port 5959) so client-side grading/anti-cheat JS could be attacked directly, exactly as it runs for real students (this logic does not depend on the Next.js auth layer). Live browser automation (`window.checkTask(...)` invoked with adversarial inputs, real DOM/JS execution, real Pyodide runs) was used for anti-cheat attacks. Static file/grep analysis was used for counts, structure, and content review. Full Next.js-authenticated dashboard flow was **not** exercised (would require a real signed-in session with a CourseEntitlement row) — this is explicitly marked as unverified below where relevant.

---

## 1. EXECUTIVE VERDICT

**READY WITH MINOR IMPROVEMENTS**

This is a substantially stronger course than a first glance at "another cohort-style bootcamp landing page" would suggest, and stronger than the prior audit's snapshot (2026-08-26), which had just found and fixed a real SQL anti-cheat hole and explicitly left five other grading engines unverified. This session closed that gap: Statistics, Excel, and Automation grading were each live-attacked with a genuine hardcoded/memorized-answer exploit, and **all three correctly rejected the cheat**. The SQL fix from the prior session is still in place. One new (minor, cosmetic) numeric inconsistency was found and fixed live. No new anti-cheat holes, no broken links, no fake urgency/scarcity language, and honest, hedged career claims were confirmed independently.

It is not scored higher than "minor improvements" because several important areas remain **genuinely unverified this session**: full per-module beginner pedagogy walkthrough (all 10 modules), live persona execution for Marcus/Priya, the capstone attempted end-to-end as a student, misconception-registry detection triggering live, adaptive-engine recommendation correctness under constructed progress states, and full responsive/accessibility testing beyond the spot checks performed. These are listed explicitly in §16 rather than converted into passing scores.

## 2. OVERALL SCORE

Not computed as a single weighted number this session for the same reason the prior audit gave: honestly scoring categories not independently retested (Beginner Experience depth, Career Readiness evidence-linking beyond claims-honesty, full Accessibility, full Responsiveness, Adaptive Learning, Misconception Remediation, Capstone-as-student) would either require re-testing them now or inheriting unverified numbers, both of which the brief prohibits. See §12 for the categories that **were** independently scored this session.

## 3. STUDENT-OUTCOME VERDICT (headline)

**YES WITH CAVEATS** — the architecture (real SQLite via sql.js, real Pyodide/pandas execution, real formula engine, mutation/randomization-based anti-cheat now verified across 4 of 8 gradeable libraries including the two most attacked) supports genuine skill-building, not just click-through. The caveats: five of eight practice libraries' anti-cheat were not re-attacked this specific session (Tableau/Power BI are disclosed simulations, not real tool execution — verified honestly labeled; SQL and Python were attacked and fixed/confirmed in the prior session; Integrated Challenges use a 3-in-a-row randomized-scenario design, reviewed by code only this session), and no live beginner walkthrough was performed this session to confirm the pedagogy actually lands for a true novice.

---

## 4. COURSE STRUCTURE (verified by direct file inspection)

- **10 modules**: `module-00.html` (orientation, ungated) through `module-09.html` (capstone). `course-progress.js`'s `MODULES` array lists 9 gated modules (ids 1–9); module-00 is the orientation/diagnostic entry point, outside the gated sequence.
- **8 practice libraries**: SQL, Excel, Python, Statistics, Tableau, Power BI, Automation, Integrated Cross-Tool Challenges.
- **10 portfolio projects** (`PROJECTS` array in `course-progress.js`): 1 capstone-linked ("The Leaky Funnel"), plus 9 additional industry-specific portfolio pieces (HR, marketing, finance, retail inventory, SaaS churn, real estate, healthcare, hospitality, integrated executive scorecard), each with a distinct dataset/industry and a 5-criterion rubric (dataCleaning/analysis/visualization/communication/documentation, weighted).
- **Supporting pages**: `syllabus.html`, `dashboard.html`, `learning-roadmap.html`, `mastery-profile.html`, `diagnostic.html`, `quiz-center.html`, `cheatsheets.html`, `python-survival-guide.html`, `career.html`, `portfolio.html`, `portfolio-template/`, `projects.html`, `final-assessment.html`, `deploy-guide.html`.
- **Engines**: `adaptive-engine.js` (next-task recommendation, pure function of persisted `PracticeProgress`/`SkillMap` state, no randomness/fabrication per its own code comments — code-reviewed, not live-tested this session), `misconception-registry.js` (31 top-level misconception keys, code-reviewed only), `skill-map.js` (568 lines, cross-library skill/mastery metadata), `course-rail.js`, `practice-progress.js`.
- **Datasets**: `datasets/` directory with real CSVs (survey_responses, employee_overtime, retail_sales_ledger, marketing_campaign_results, saas_subscriptions, pnl_statement, and others feeding SQL/Python/capstone stages).

## 5. VERIFIED TASK COUNTS (independently recounted, not trusted from any prior report)

Recounted by parsing each library's own `TASKS` array with prefix-aware `grep` (a naive global `id:` grep over-counts by picking up unrelated DOM ids like quiz option ids `"A1"`/`"A2"` in Python and a stray `"whole_number"` id in Power BI — corrected for this):

| Library | Claimed (marketing/dashboard) | Verified actual |
|---|---|---|
| SQL | 60 | **60** |
| Excel | 35 | **35** |
| Python | 50 | **50** |
| Statistics | 40 | **40** |
| Tableau | 40 | **40** |
| Power BI | 40 | **40** |
| Automation | 30 | **30** |
| Integrated | 20 | **20** |
| **Total practice tasks** | 315 | **315 — MATCHES** |
| Portfolio projects | 10 | **10 — MATCHES** |

`dashboard.html` displays "0 / 315 Practice tasks passed" — consistent. `src/app/lab/courses-data.ts` claims `practiceTasks: 315, portfolioProjects: 10` — **consistent with the actual code**.

**Bug found and fixed this session**: `syllabus.html` line 298 stated *"alongside the modules there are **9** separate practice libraries"* — there are 8, not 9 (the 9 comes from confusing the module count with the library count). Fixed to "8 separate practice libraries" and re-verified live in the browser (`document.body.innerText.includes('8 separate practice libraries')` → true post-fix). Low severity (cosmetic, off-by-one in body copy, not a task-count or grading issue), but it is exactly the kind of stale-number bug the brief asks to hunt for, so it's documented and fixed rather than ignored.

A related **unfixed, low-severity** note: `skill-map.js`'s top-of-file comment says its purpose is computing mastery "without loading all **7** of them" (practice libraries) — also stale (should be 8). This is an internal code comment, never shown to a student, so it was left as a documented finding rather than fixed, to avoid unnecessary churn in a file the brief says not to touch beyond what's warranted.

## 6. ANTI-CHEAT — ADVERSARIAL LIVE TESTING (the core of this session)

Per-library results, PASS meaning a real hardcoded/memorized-answer attack was submitted through the actual client-side grading code (`checkTask()` or equivalent) and was correctly rejected:

| Library | Attack performed live this session | Result |
|---|---|---|
| **SQL** | Not re-attacked this session (prior session's fix already inspected and confirmed present: `sql-f01`/`sql-f02`/`sql-f05` all now carry explicit `mutationTarget: "products"`/`"customers"`, matching the prior audit's documented fix). Code-level confirmation only this session. | **PASS (fix confirmed present, not re-exploited fresh)** |
| **Excel** | Computed the real `SUM(F2:F25)` value from the live workbook (`3875.63`), submitted `=3875.63` (a literal, no cell reference) as the "formula" for task `xl-f01`. | **PASS** — rejected: *"Your formula matched on the original sheet but not on an independently modified copy, that usually means a hardcoded or memorized result."* |
| **Statistics** | Computed the real dataset's true mean (`2.9720`) outside the app from the raw CSV, submitted `return {"mean": 2.972}` as a hardcoded function body for task `st-d01` (mean_satisfaction), through the real Pyodide/pandas sandbox. | **PASS** — 1/2 tests passed; the independently-mutated-slice re-check correctly failed (`expected {'mean': 3.1207}, got {'mean': 2.972}`). |
| **Automation** | Submitted a function that special-cases all 3 fixed test inputs verbatim (`if items == [1,2,2,3,1,4]: return [1,2,3,4]` etc., falling through to a no-op for anything else) for task `au-f01` (dedupe_preserve_order) — a "minimally altered, designed to fool validation" attack per the brief. | **PASS** — 3/3 fixed tests passed (as designed, since it memorized them), but the freshly-randomized-input check correctly failed: *"This input changes every run, a fixed/memorized answer cannot pass it."* 3/4 overall. |
| **Python** | Not re-attacked this session (prior session's live attack against `py-f01` already reproduced and passed; not repeated). | **INHERITED, not re-verified this session** |
| **Tableau** | Not attacked (dropdown/decision-based simulation, not a hardcode-able computed answer in the SQL/Excel/Python/Stats sense — see below). | **NOT APPLICABLE in the traditional sense** |
| **Power BI** | Same as Tableau. Footer explicitly reads: *"Practice Simulation, not real Power BI."* Confirmed via direct grep — **no in-browser claim of real tool execution found anywhere in the file.** | **NOT APPLICABLE — simulation, honestly disclosed** |
| **Integrated** | Not live-attacked. Code-reviewed: grading is a slot/dropdown match against a freshly-redrawn scenario (`t.build()`), requiring **3 correct in a row** before crediting a pass, explicitly to defend against lucky guessing (per its own in-app copy: *"3 fresh scenarios in a row... real evidence this wasn't a memorized click sequence"*). This is a sound anti-guess design for a selection-style task, but it is fundamentally a multiple-choice/dropdown format, not a computed-answer format — worth noting for Phase 10 (tests tool/method selection more than deep hands-on execution). | **PARTIAL — anti-guess mechanism present and logically sound, not live-attacked this session** |

**Key finding**: the three additional libraries attacked this session (Excel, Statistics, Automation) all held up under a genuine, realistic cheat attempt. Combined with the prior session's confirmed SQL fix and Python pass, **5 of 6 libraries with a "computed answer" format (SQL, Excel, Python, Statistics, Automation) now have independently-verified-working anti-cheat**, a meaningfully stronger position than the prior audit's "only SQL and Python checked, one broken."

## 7. REAL EXECUTION VERIFICATION

- **Excel**: confirmed real formula engine (`evalFormula()` actually parses and computes `SUM`, arbitrary formulas against a real in-memory workbook) — not a lookup table. Verified by executing `evalFormula("=SUM(F2:F25)", wb, "Sheet1")` directly in the console and getting a real computed number that matched the task's expected answer exactly.
- **Statistics**: confirmed real CPython execution via Pyodide (student code is `exec()`'d in a real Python namespace with real `pandas`/`numpy`, against a real CSV fetched at runtime) — not a formula lookup, not scipy (the library's own honest scope note explicitly discloses "No scipy is used anywhere, every p-value... computed from the standard normal CDF via Python's built-in math.erf").
- **Automation**: confirmed real Python execution with actual randomized inputs generated fresh per check (`randomGenCode`), not a fixed answer key.
- **SQL**: not re-verified live this session; prior session already confirmed real sql.js/SQLite execution.
- **Tableau/Power BI**: **explicitly not real tool execution** — confirmed by direct inspection, no misrepresentation found on either page.

## 8. DATASETS

Spot-checked `datasets/survey_responses.csv` directly (used for Statistics tasks): 214 non-null `satisfaction_score` values out of what should be a larger row count (implying genuine missing data the course teaches students to handle, consistent with `st-d01`'s hint that `.mean()` "already handles the 6 missing satisfaction scores"). This is real, imperfect data, not a clean synthetic set — consistent with the course's own repeated claims of "genuinely messy" data. Not exhaustively audited across all datasets this session (retail_sales_ledger, employee_overtime, marketing_campaign_results, saas_subscriptions, pnl_statement were not individually profiled).

## 9. CAPSTONE (module-09.html) — structural review only, not attempted end-to-end as a student this session

Confirmed structure via headers: stages **A** (audit/clean a raw export with real, disclosed defects — exact duplicates, impossible negative quantities, missing channel values, inconsistent category casing) → **B** (answer with SQL) → **C** (quantify) → **D** (visualize) → **E** (executive summary) → **F** (explain it) → **G** ("is this real, or noise?" — a statistical-significance gate) → **H** (portfolio write-up) → checkpoint → optional second portfolio piece. This structure genuinely requires cleaning, SQL, a number, a chart, written communication, and a significance/noise check — not a single-recipe walkthrough. **Not independently attempted as a student this session** (would require actually performing the analysis), so pedagogical rigor of the *grading* at each stage is not verified, only the stage structure.

## 10. CAREER READINESS

Independently re-confirmed via direct text search (not inherited from the prior audit's claim): `career.html` contains explicit, repeated, non-generic disclaimers — *"does not guarantee employment,"* *"does not promise or guarantee employment in any of these roles. It develops a specific, verifiable subset of the skills they typically require,"* and an explicit, upfront disclosure box stating Tableau/Power BI are "honest, clearly-labeled decision-based practice simulations, not real execution," and that "Git and cloud platforms still aren't taught here at all." **No fake percentages, no "X% of students get hired," no guaranteed-interview language found anywhere searched.** This is a genuinely honest career page. The underlying evidence-linking (whether every specific claim traces to a specific completed task) was not line-by-line re-verified this session.

## 11. COMMERCE / MARKETING HONESTY

Checked `src/app/lab/courses-data.ts` and the course HTML for stale scarcity/urgency language: **no "Founding price," "Founding cohort," or fake-scarcity language found.** A real, currently-active discount is configured (`price: "$30"`, `originalPrice: "$120"`, `discountPercent: 75`, `discountDeadline: "2026-09-01T23:59:59-00:00"`) — this deadline is 5 days after the audit date and is described in the file's own comment as manually raised back to list price by hand on that date (no Whop webhook for it). This is disclosed as a real, time-bound discount mechanism, not obviously fake urgency, but it is worth the maintainer's attention that the deadline is imminent and requires a manual step to honor.

## 12. RESPONSIVE TESTING (partial — screenshot tooling unavailable this session)

The Browser pane's `computer{action:"screenshot"}` failed consistently in this environment ("Browser pane is not displayed, so the page is not compositing frames") despite retries, so **visual/screenshot-based responsive testing (as the brief specifies) could not be performed this session.** As a substitute, horizontal-overflow was checked programmatically (`document.documentElement.scrollWidth` vs `window.innerWidth`) at 375px viewport width on two pages:

- `dashboard.html` at 375×812: no horizontal overflow (`scrollWidth === innerWidth === 375`).
- `practice-sql.html` at 375×812: no horizontal overflow.

This is a **narrow, partial substitute for real visual responsive testing**, not equivalent to it — it catches gross overflow bugs but not clipped content, unreadable tables, broken mobile menus, or misaligned controls that don't cause overflow. **768px, 1024px, 1440px, and 390px were not tested this session. Visual/screenshot inspection across any breakpoint was not performed.** This is an explicit gap, not a pass.

## 13. ACCESSIBILITY — static review only, no assistive-technology test performed

- No `<img>` tags found in `module-01.html`, `practice-sql.html`, or `dashboard.html` (icons are apparently SVG/CSS-based), so no alt-text gap was found — but this also wasn't exhaustively checked across all 40 files.
- `module-01.html` has 0 matches for `aria-`/`role=`/`<label` — a genuine gap for a content-heavy module; `practice-sql.html` (24) and `dashboard.html` (31) have meaningfully more.
- Real semantic `<button>` elements are used (4 in module-01, 2 sampled in practice-sql) rather than `<div onclick>` (0 found in either sampled file) — a good sign for keyboard/AT compatibility.
- `:focus` CSS rules exist in all three sampled files (1/3/7 matches respectively) — visible focus states appear to be a deliberate pattern, not absent, though depth/contrast of the focus style was not visually verified (screenshot unavailable).
- **This is a STATIC ACCESSIBILITY REVIEW only.** No screen reader, no real keyboard-only navigation attempt, no contrast-ratio measurement, no WCAG conformance testing was performed or is claimed.

## 14. SECURITY / ROBUSTNESS

Not independently re-tested this session (XSS/injection/malformed-input/corrupted-localStorage attacks). The one grading-logic issue confirmed this session (Excel/Statistics/Automation anti-cheat) is a scoring-integrity concern, not a security vulnerability — none of the attacks performed put other students' data or the platform at risk, they only test whether a student can falsely credit themselves.

## 15. BUGS FOUND THIS SESSION

1. **[LOW, stale copy]** `syllabus.html`: "9 separate practice libraries" (actual: 8). **FIXED** — changed to "8 separate practice libraries." **Re-tested live**: confirmed via `document.body.innerText.includes(...)` against the running page post-fix.
2. **[LOW, internal-only, not fixed]** `skill-map.js` header comment references "all 7 of them" (practice libraries; actual: 8). Never shown to a student — documented, not fixed, to avoid unnecessary churn per the brief's "preserve existing working functionality" instruction for a non-user-facing comment.

No anti-cheat bugs were found in the three libraries newly attacked this session (Excel, Statistics, Automation) — all three correctly rejected realistic hardcode/memorization attacks on first attempt.

## 16. EXPLICIT UNVERIFIED AREAS (this session)

- Full Phase 3/4 beginner (Zoe) walkthrough module-by-module — not performed live this session; only module-00/module-01 headers were skimmed for structure, not full pedagogical depth per module.
- Marcus and Priya persona walkthroughs — not performed.
- Capstone (module-09) and final-assessment.html — structurally reviewed, not attempted end-to-end as a student.
- Misconception-registry.js — 31 misconception keys counted; automatic detection/remediation triggering was not exercised live.
- Adaptive-engine.js — code-reviewed (pure function of real persisted state, no fabrication, per its own comments); no constructed-state test run live this session.
- Mastery system manipulation (corrupted localStorage, partial progress, test-out) — not attempted this session.
- SQL and Python anti-cheat — not freshly re-attacked this session; relies on the prior session's already-reproduced results.
- Full responsive testing (768/1024/1440/390px, visual inspection at any width) — not performed; screenshot tooling was unavailable in this environment.
- Full accessibility (AT/screen reader, keyboard-only navigation, contrast measurement) — not performed.
- XSS/injection/security robustness — not re-tested.
- Datasets other than survey_responses.csv — not profiled for messiness/realism.
- Portfolio-template and deploy-guide content — not reviewed this session.
- Dashboard/mastery-profile behind real Next.js auth — not exercised (would require a live signed-in session with a CourseEntitlement row).

## 17. FINAL ANSWERS TO THE 10 STUDENT-OUTCOME QUESTIONS

1. Does a complete beginner actually learn from this course? — **PARTIALLY VERIFIED.** Module-00/01 structure (defines "what a dataset actually is" before using one) is a good sign; full walkthrough not performed.
2. Can a beginner complete it without external tutorials? — **UNVERIFIED** this session.
3. Does the course teach rather than merely expose? — **PARTIALLY VERIFIED** for the libraries attacked (Statistics/Excel/Automation require genuine computation, not clicking through); not verified for module content depth.
4. Are students forced to think independently? — **PARTIALLY VERIFIED** via the capstone's stage structure (real defects to discover, not told what's wrong); not attempted as a student.
5. Are exercises sufficiently difficult? — **UNVERIFIED** (progression difficulty not assessed this session beyond task-level labels).
6. Does the course build practical analyst judgment? — **PARTIALLY VERIFIED** (capstone stage G explicitly requires a "real vs. noise" significance judgment; Statistics tasks include written business-judgment checks).
7. Can students work with messy real-world data? — **PARTIALLY VERIFIED** (survey_responses.csv confirmed to have real missing values the course explicitly teaches handling for; capstone stage A explicitly names real messy-data defects).
8. Can they communicate findings? — **PARTIALLY VERIFIED** structurally (capstone stages E/F/H are exec summary / explain / portfolio write-up); actual grading quality of these not tested.
9. Can they build a portfolio? — **YES**, structurally: 10 distinct portfolio projects exist with rubrics, `portfolio.html` and `portfolio-template/` exist.
10. Can they reasonably apply for junior analyst roles after completing it? — **YES WITH CAVEATS**, per the course's own honest, non-overclaiming career copy (verified independently) — conservatively, this is a defensible claim as *written*, not independently re-derived from first principles this session.

## 18. FINAL VERDICT

**READY WITH MINOR IMPROVEMENTS.**

Reasoning: the highest-risk category from the prior audit (anti-cheat integrity across gradeable libraries) was meaningfully advanced this session — 3 additional libraries (Excel, Statistics, Automation) were live-attacked with realistic cheats and all held, and the previously-fixed SQL hole was confirmed still fixed. One real (cosmetic) numeric bug was found and fixed live. Career and marketing honesty were independently re-confirmed, not just inherited. No broken links or fake urgency found. What keeps this from LAUNCH READY is the volume of genuinely untested surface area carried forward: full beginner pedagogy walkthrough, persona execution, capstone-as-student, accessibility beyond a static grep, and responsive testing beyond a narrow overflow check (screenshot tooling was unavailable this session). None of these gaps are evidence of a problem — but per the brief's own rule, "not tested" must never be reported as "passed," so the verdict reflects genuine remaining uncertainty rather than confirmed full readiness.
