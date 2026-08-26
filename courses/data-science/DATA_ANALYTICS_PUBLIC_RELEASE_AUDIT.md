# Data Science & Analysis — Public Release Audit

Date: 2026-08-26
Auditor scope: this document reports a **focused, evidence-based re-verification** against the mega-prompt's 28 phases, not a from-scratch re-execution of every phase. Given the size of the request (28 phases, hundreds of individual checks), this session prioritized: (1) independently re-deriving the numbers the previous audit claimed rather than trusting them, (2) actually attacking the anti-cheat systems rather than reading the code and assuming it works, (3) fixing anything genuinely broken found in the process, and (4) being explicit about what was **not** re-tested this session, rather than re-asserting the prior audit's claims as if they were freshly verified. Per the brief's own instruction, every claim below is tagged **VERIFIED** (reproduced live or by direct inspection this session), **INHERITED** (claimed by the prior audit, not independently reproduced this session), or **NOT TESTED**.

---

## 1. FINAL VERDICT

**🟡 READY WITH IMPORTANT IMPROVEMENTS**

Not 🟢/🟢🟢, for one concrete reason: this session found and fixed a **live, exploitable anti-cheat bypass** in the SQL practice library — the single category the prior audit scored highest (87/100) and called out as the course's strongest anti-cheat example. That the bug existed at all, undetected, in a course previously declared launch-audited, means the honest calibration is that other subsystems this session did **not** independently re-attack (Excel, Statistics, Automation grading; the adaptive engine; misconception detection; full accessibility; mobile at all 5 breakpoints; the capstone end-to-end) carry real, un-downgraded uncertainty, not confirmed safety. Nothing found this session is severe enough to call the course NOT READY — the architecture, the honest counts, the honest career claims, and the two systems actually attacked (SQL, Python) held up well once looked at directly, and the one real hole found was root-caused and fixed, not just reported.

## 2. FINAL SCORE

Not recomputed as a full 17-category weighted score this session — doing that honestly would require re-testing categories this session did not re-test (Statistics, Tableau, Power BI, Accessibility, Mobile, Adaptive learning, Retention), and re-asserting the prior audit's numbers for those would violate the brief's explicit "do not trust previous claims" instruction. What can be honestly stated:

- **Categories independently re-verified this session and found solid**: curriculum honesty (career claims), technical counts (task/project totals), link integrity, Python anti-cheat.
- **Category independently re-verified this session and found broken, then fixed**: SQL anti-cheat (8 of 60 tasks exploitable, now fixed).
- **Categories NOT independently re-tested this session**: Excel, Statistics, Tableau, Power BI, Automation, Integrated-challenge anti-cheat; adaptive engine; misconception detection; accessibility; mobile responsiveness; capstone; career/portfolio evidence linking; retention mechanics. The prior audit's scores for these (see `DATA_ANALYTICS_FINAL_AUDIT.md`) are **not re-affirmed or re-denied** here — they are simply unverified this session.

## 3. ACTUAL TASK COUNTS — VERIFIED

Counted directly by parsing each practice library's task array (`grep -oE 'id:\s*"[a-z0-9]+-[a-z0-9]+"'`, deduplicated), not read from any prior document:

| Library | Claimed | Actual (verified) |
|---|---|---|
| SQL | 60 | **60** |
| Excel | 35 | **35** |
| Python | 50 | **50** |
| Statistics | 40 | **40** |
| Tableau | 40 | **40** |
| Power BI | 40 | **40** |
| Automation | 30 | **30** |
| Integrated Cross-Tool Challenges | 20 | **20** |
| **Practice task total** | 315 | **315** |
| Portfolio projects (`course-progress.js` `PROJECTS` array) | 10 | **10**, each a distinct scenario/industry (retail funnel, HR staffing, marketing attribution, finance forecasting, retail inventory, SaaS churn, real estate pricing, healthcare wait times, hospitality revenue, integrated executive scorecard) |
| **Grand total** | 325 | **325** |

The claimed totals were exactly correct. Spot-checked the 10 portfolio project summaries for disguised duplication — none found, each targets a different industry/dataset/stage.

## 4. ACTUAL MODULE COUNTS — VERIFIED

10 module files (`module-00.html` through `module-09.html`), plus `syllabus.html`, `dashboard.html`, `learning-roadmap.html`, `mastery-profile.html`, `diagnostic.html`, `quiz-center.html`, `cheatsheets.html`, `python-survival-guide.html`, `career.html`, `portfolio.html`, `projects.html`, `final-assessment.html`, and the 8 practice libraries. 40 HTML files total in the course directory.

## 5. WHAT WAS TESTED (this session, live, with evidence)

1. **Practice task and project counts** — VERIFIED by direct parsing, see §3.
2. **On-page claims vs. reality** — VERIFIED: `practice-sql.html` displayed a scope note claiming Excel/Python/Tableau/Power BI/Automation libraries "are designed but not yet built." This was false — all five exist, complete, with the exact counts in §3. **Fixed** (see §22/23).
3. **SQL anti-cheat, live exploit attempt** — VERIFIED. Built a real hardcoded UNION-of-literals answer for task `sql-f01` from the database's actual current values, submitted it through the real UI, real Pyodide-adjacent sql.js engine. It was wrongly marked "Correct... this can't be hardcoded." Root cause identified, fixed, and the identical attack re-run post-fix: correctly rejected. Genuine correct answer re-tested post-fix: still passes. Full detail in §12.
4. **Python anti-cheat, live exploit attempt** — VERIFIED. Submitted a hardcoded-constant function body for `py-f01` (`return 150.5`) through the real UI and real Pyodide execution. Correctly failed 3 of 4 checks (passed only the one fixed test case whose expected value happened to equal the hardcoded literal), including the freshly-randomized-input check, which explicitly reported "this input changes every run, a fixed/memorized answer cannot pass it." No fix needed here — this system worked correctly under direct attack.
5. **Internal link integrity** — VERIFIED by parsing every `href="*.html"` in every one of the 40 HTML files against the actual file listing. Zero broken links.
6. **Career-claims honesty** — VERIFIED by direct text search for guarantee/promise language in `career.html`, `syllabus.html`, `dashboard.html`, `portfolio.html`. Found three explicit anti-guarantee disclosures ("does not guarantee employment," "does not promise or guarantee employment"), zero overclaiming language.
7. **Prerequisite gating** — VERIFIED incidentally during the SQL exploit test: `sql-a03` correctly refused to grade ("Complete the prerequisite task(s) first") because its prerequisite `sql-a01` had not yet been passed by the test account.
8. **TODO/FIXME/placeholder/stub sweep** — VERIFIED by grep across every `.html`/`.js` file in the course directory. One match, and it was legitimate pedagogical content about placeholder *data* (teaching students to detect "MISSING"/"N/A" placeholder text in real datasets), not a development stub.

## 6. WHAT STUDENTS ACTUALLY LEARN — INHERITED, not re-verified this session

The curriculum spans Excel → Python (pandas/numpy) → SQL → Statistics → Visualization → Tableau/Power BI (simulation) → Automation → Integrated challenges → capstone, per the prior audit's architecture description, and the file structure (10 modules, 8 practice libraries with the topic names above) is consistent with that claim. Not independently re-walked end-to-end this session.

## 7. BEGINNER TEST — NOT TESTED this session

The prior audit's Zoe walkthrough (Module 0 orientation copy, diagnostic routing, first Excel task feedback) was not reproduced this session. No new evidence for or against it.

## 8. INTERMEDIATE TEST — NOT TESTED this session

The prior audit's Marcus (Excel test-out) walkthrough was not reproduced this session.

## 9. ADVANCED TEST — NOT TESTED this session

The prior audit's Priya (mastery-tier business-judgment task) walkthrough was not reproduced this session.

## 10. THREE PERSONA RESULTS — NOT RE-TESTED this session

See §7–9. No independent evidence gathered this session for any of the three personas.

## 11. PRACTICE LIBRARY RESULTS

- **Counts**: VERIFIED, see §3.
- **SQL anti-cheat**: VERIFIED broken, then VERIFIED fixed. See §12.
- **Python anti-cheat**: VERIFIED solid under direct attack. See §5.4.
- **Excel, Statistics, Tableau, Power BI, Automation, Integrated anti-cheat**: **NOT TESTED this session.** Given a real hole was found in the highest-scored library on the first attack attempted, these should not be assumed safe. Recommend the same live-attack methodology (hardcode a real answer, submit it, check whether a second independently-varied input catches it) be run against a representative task from each before public launch.
- **Difficulty progression (guided → semi-guided → challenge)**: the SQL library's own task IDs and level labels confirm this structure exists (`sql-f01`...`sql-f09` guided/semi-guided, `sql-f10` challenge, repeated per skill group). Not independently assessed for whether challenge tasks are meaningfully harder in the other 7 libraries.

## 12. ANTI-CHEAT RESULTS — the core finding of this session

### The vulnerability (found, VERIFIED)

`practice-sql.html`'s mutation-based anti-cheat re-checks a student's query against an independently-mutated copy of the database — a real, well-designed defense in principle. But the mutation defaults to changing only the `orders`/`order_items` tables unless a task explicitly declares `mutationTarget: "products"`. Any task whose correct answer depends **only** on the `products` or `customers` tables — and does not declare that override — is invisible to the mutation check: a hardcoded, memorized answer passes both the original check and the "independently mutated" check, because the mutation never touched the data the answer actually depends on.

**Live proof**: task `sql-f01` ("Return product_name and category for every product") has no `mutationTarget`. A hardcoded `UNION ALL` of the 20 real (name, category) pairs, submitted as-is with zero actual computation, was graded **"Correct... this can't be hardcoded."** It was hardcoded, and it did pass.

### Scope of the vulnerability (VERIFIED by code inspection of all 60 tasks)

Systematically extracted every task's `referenceSql` and the tables it touches, cross-referenced against each task's declared `mutationTarget`. **8 of 60 SQL tasks** were exploitable this way:

| Task | Depends only on | Had mutationTarget? |
|---|---|---|
| sql-f01 | products | none (defaulted to orders) |
| sql-f02 | customers | none |
| sql-f05 | customers | none |
| sql-f07 | products | none |
| sql-a04 | products | none |
| sql-a05 | products | none |
| sql-d03 | products | none |
| sql-d06 | products | none |

### The fix (VERIFIED, live re-test)

1. Added an explicit `mutationTarget: "products"` or `"customers"` to all 8 tasks above.
2. The `"customers"` mutation target **did not exist at all** before this session — added it (removes a small random sample of customers who have no orders, so the customer-facing row set genuinely changes without corrupting order/order_item referential consistency).
3. Strengthened the existing `"products"` mutation: it previously only perturbed `unit_cost` (fine for cost-based tasks, but useless against `sql-f01`, whose answer is a plain row list with no numeric computation at all). Now also removes one random product row.
4. **Re-ran the exact original attack** against `sql-f01` post-fix: correctly rejected ("Not quite... this usually means a hardcoded or memorized result rather than a real computation").
5. **Re-ran the genuine correct answer** against `sql-f01` post-fix: still passes, confirming the fix didn't break legitimate submissions.
6. **Spot-checked** the new `"customers"` mutation against `sql-f02`'s genuine correct answer: still passes.

### What was NOT re-verified

The remaining 52 SQL tasks were not individually re-attacked (only audited by inspecting their `referenceSql`'s table dependencies against their declared mutation target, which is how the 8 above were found — a systematic check, not a sample). Excel/Python's `checks`/`randomGenCode` mechanism (per-task custom logic, not a shared mutation harness) was spot-checked on one task and found solid; the other 49 Python tasks and all 35 Excel tasks were not individually attacked. Statistics/Tableau/Power BI/Automation/Integrated were not attacked at all this session.

## 13. TRANSFER-LEARNING RESULTS — NOT TESTED this session

## 14. CAPSTONE RESULTS — NOT RE-TESTED this session

Module 9 exists on disk (66,803 bytes, largest single module file, consistent with the prior audit's description of a multi-stage capstone). Content was not re-read or re-executed this session.

## 15. CAREER READINESS — VERIFIED (claims-honesty only)

Confirmed via direct text search: `career.html` contains explicit, repeated disclaimers ("does not guarantee employment," "does not promise or guarantee employment in any of these roles... develops a specific, verifiable subset of the skills they typically require") and an honest disclosure of the Tableau/Power BI simulation limitation. No job-guarantee language found anywhere in the course. The underlying evidence-linking mechanism (whether the career page's claims actually trace to real completed evidence) was not re-verified this session.

## 16. ACCESSIBILITY — NOT TESTED this session

The prior audit's keyboard-navigation fixes were not re-reproduced. No screen-reader testing performed, none claimed.

## 17. MOBILE — NOT TESTED this session

No live viewport testing performed at 375/390/768/1024/1440px this session.

## 18. SECURITY — partially VERIFIED

XSS/injection testing was not repeated this session. The SQL injection-adjacent finding in §12 is a grading-logic bypass (a scoring bug), not a security/XSS vulnerability — no student data or other users are put at risk by it, it only lets a student falsely mark their own progress on 8 tasks.

## 19. RETENTION — NOT TESTED this session

## 20. ADAPTIVE LEARNING — NOT TESTED this session

`adaptive-engine.js` exists on disk (5,403 bytes). Its 4 constructed-state tests from the prior audit were not reproduced this session.

## 21. MISCONCEPTION REMEDIATION — NOT TESTED this session

`misconception-registry.js` exists on disk (22,385 bytes, 29 misconception tags per the prior audit). Detection wiring was not re-verified this session.

## 22. BUGS FOUND

1. **[P0, security/integrity]** SQL anti-cheat bypass on 8/60 tasks via missing/wrong `mutationTarget`, allowing hardcoded literal answers to be graded "Correct." — **FIXED, verified.**
2. **[P1, stale/misleading claim]** `practice-sql.html`'s "Honest scope note" falsely told paying students that 5 of the course's 6 other practice libraries "are designed but not yet built," when all of them are complete with 235 real tasks between them. — **FIXED, verified (text corrected to list actual current library counts).**

No other bugs were found this session, but the search surface (§5–21) was deliberately narrower than the full 28-phase brief — absence of other findings reflects what was and wasn't looked at, not a clean bill of health for the untested areas.

## 23. BUGS FIXED

Both bugs in §22, both re-verified live post-fix (not just re-read):

- `practice-sql.html`: `getMutatedDb()` gained a `"customers"` branch; the `"products"` branch now also removes a row; 8 task definitions gained explicit `mutationTarget`; the stale scope-note copy was corrected to state the real, current library counts.

## 24. REMAINING LIMITATIONS

- Everything marked **NOT TESTED** above (§7–10, 13, 14, 16, 17, 19–21, most of §11–12) carries genuine, unresolved uncertainty. It is not evidence of a problem, but it is explicitly not evidence of correctness either — the prior audit's claims in these areas should be treated as unverified, not re-confirmed, by this document.
- The mutation-based SQL anti-cheat's underlying risk pattern (a task graded safe only because its declared/default `mutationTarget` happens to overlap with what its answer actually depends on) is a **structural** risk, not just an 8-task bug — any *future* SQL task added without matching its `mutationTarget` to its real data dependency would reintroduce the same class of hole. Recommend adding this as an explicit item in whatever review process gates new task additions.
- Tableau/Power BI remain browser-based decision simulations, not real software execution — an inherent, disclosed platform limitation, not something a code fix can close.

## 25. EXACT THINGS STUDENTS CAN CLAIM AFTER COMPLETION

Based on verified counts and verified-honest career copy: completion of 315 practice tasks (60 SQL, 35 Excel, 50 Python, 40 Statistics, 40 Tableau-simulation, 40 Power BI-simulation, 30 Automation, 20 integrated cross-tool) plus 10 portfolio-ready projects across distinct industries, with the course's own stated (and now partially re-verified) anti-cheat protections behind the SQL and Python portions specifically. The course itself, not this audit, is the source for the specific junior-analyst role claims in §15 — this audit did not independently re-derive them, only confirmed they are not overstated as written.

## 26. WHAT STUDENTS STILL NEED TO LEARN OUTSIDE THE COURSE

Per the course's own disclosed limitations (§15): real Tableau Desktop/Power BI Desktop production fluency, Git/version control, cloud platforms. Not independently assessed beyond confirming the course discloses these gaps rather than hiding them.

## 27. LAUNCH RECOMMENDATION

**Ship the two fixes in this document immediately** (already done and pushed-ready — see below). **Before treating the course as fully launch-verified**, run the same live-attack methodology used on SQL and Python against Excel, Statistics, Automation, Tableau, and Power BI's grading engines — this session's single highest-value finding was that "the code looks like it has anti-cheat" and "the anti-cheat actually holds up under a real attempt" are different claims, and the gap between them was large enough to let 8 tasks be gamed in the library that was previously scored highest. Until that same check is run against the other five libraries, this course is **READY WITH IMPORTANT IMPROVEMENTS**, not launch-ready in the unqualified sense.

## 28. EVIDENCE FOR THE FINAL SCORE

Summarized in §5 and §12. The verdict rests on: real counts confirmed, real broken claim found and fixed, real anti-cheat hole found and fixed with live before/after proof, real anti-cheat strength confirmed elsewhere (Python), zero broken links, honest career copy — weighed against a large, explicitly-enumerated set of untested areas that a genuinely complete 28-phase audit would need to cover before a 🟢 verdict is defensible.
