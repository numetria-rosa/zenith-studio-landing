# Zenith Lab — Architecture Audit

Scope: full inspection of the current codebase (`D:\zenith-studio`) — no code changed. This is a decision document, not a migration.

---

## 1. Current architecture (as it actually exists today)

Zenith Lab is not one architecture, it's two, glued together deliberately:

- A modern **Next.js 16 / React 19 / TypeScript** app shell (marketing, dashboard, auth, payments, admin).
- A **static-HTML content layer** (123 hand-authored `.html` files across 4 courses) served through a single guarded Route Handler, with the sidebar injected server-side per request.

```text
Browser
 ↓
Vercel — Next.js 16 App Router (React 19, TypeScript, Tailwind 4)
 │
 ├── / , /lab                     React — marketing catalog (CourseCatalog.tsx)
 ├── /lab/dashboard               React — owned-courses dashboard
 │                                  → plain <Link href="/courses/:id/:firstLesson">
 ├── /courses/:courseId           React — paywall/redirect gate
 │                                  auth() + hasCourseAccess() → redirect or paywall card
 │
 └── /courses/:courseId/[...path]  Route Handler (NOT React) — the real course server
        ↓ auth() + hasCourseAccess()   (20s in-memory cache, DB-backed)
        ↓ path-traversal-safe readFile() from disk: courses/<courseDir>/<path>
        ↓ wrapCoursePage(): server-side STRING SPLICE of sidebar HTML
        ↓         around the page's raw <body> content
        ↓ send full HTML/JS/CSS/image bytes — full browser page load

courses/<id>/*.html  (123 files — static documents, not templates)
 ├── zenith-lab.css + theme.css        per-course copy, ~2,150 lines
 ├── course-progress.js                per-course copy, 300–810 lines
 │     window.CourseProgress → localStorage, debounce-synced to /api/progress
 ├── course-rail.js                    hydrates .done/.locked classes, mobile drawer
 ├── course-ui.js                      general chrome interactivity
 ├── quiz-data.js                      MCQ pools, graded client-side
 ├── pyodide-sandbox-runner.js         Web Worker, WASM CPython, timeout-managed
 └── inline <script> per module        bespoke grading logic (capstones, etc.)
 └── course-specific kits (AISE: adaptive-engine, workflow-kit, detective-kit,
     evidence-kit, prompt-kit, northline...; automation-engineering: workflow-runtime;
     data-science: plotly-sandbox-runner, skill-map)

Server-side glue (TypeScript, in src/lib/)
 ├── course-rail-template.ts    buildRailInnerHtml() + wrapCoursePage() — the sidebar
 ├── course-rail-data.ts        canonical nav/module data (2nd source of truth,
 │                               intentionally duplicated from client course-progress.js)
 ├── entitlements.ts / course-access.ts / course-access-cache.ts   auth gate
 └── courses.ts                 course metadata registry
 ↓
Prisma ORM → PostgreSQL (Neon)
 ├── User / Account / Session / VerificationToken   (Auth.js shape)
 ├── CourseEntitlement, PurchaseClaim, WebhookEvent
 └── CourseProgress  (per user × course JSON blob)

Payments: Whop SDK — webhook-driven, idempotent (unique webhook-id constraint),
auto-creates account + generates/encrypts password on payment.succeeded.
/api/go/:courseId mints a tracked Whop checkout URL carrying UTM metadata.
```

**Key finding that shapes everything below**: the content layer is *not* served by Vercel's static file system and is *not* build-time generated. It's read from disk and stitched together **per HTTP request**, behind a single auth choke-point that guards every byte — HTML, JS, CSS, datasets, images alike. That's an unusual but genuinely sound design for a paywalled product.

---

## 2. Strengths

1. **The security/entitlement model is correctly built**, and it's the hardest part to get right. One route handler gates *every* asset under `/courses/:id/...`, server-side, with path-traversal protection — not a client-side check anyone could bypass by opening a `.html` file directly. This would need to be preserved carefully in any migration, not casually reproduced.
2. **Whop → Postgres purchase flow is solid**: signature-verified webhooks, idempotent via a DB unique constraint on webhook id, auto account + password provisioning, revocation on `membership.deactivated`. Nothing here is framework-dependent; it survives any frontend decision untouched.
3. **Pyodide grading is already correctly isolated**: WASM CPython in a dedicated Web Worker, two-phase timeout (network load vs. execution) specifically to interrupt `while True: pass` — this is not naive, and it's framework-agnostic. A React rewrite gains nothing here except a different place to call the same worker from.
4. **Progress sync is a legitimately good offline-first pattern**: localStorage-first, debounced `keepalive`-flagged POSTs, pull-down on empty-local, one-time migrate-up. This logic would be ported, not rebuilt, in any migration.
5. **The team already fixed the exact symptom the user is worried about, without a rewrite.** Recent git history (`c7f488b`, `6010459`, `d03ba8c`) shows a targeted move from a client-JS-rebuilt sidebar to a server-injected one, plus transition smoothing and entitlement-check caching. That's evidence the current architecture can absorb real UX fixes incrementally — this is not a team flailing against a dead-end stack.
6. **The app shell (marketing, dashboard, auth, admin) is already modern** — Next.js 16, React 19, TypeScript, Tailwind 4. Nothing there needs migrating; the entire question is scoped to the 123 lesson files.

## 3. Weaknesses

1. **Zero component reuse inside lesson content.** Every lesson is hand-authored HTML with inline `<style>` and inline `<script>` grading logic. Changing a card style everywhere, or restructuring how a checkpoint renders, means editing raw HTML across dozens of files by hand.
2. **4x duplication of shared logic.** `course-progress.js`, `zenith-lab.css`, `course-rail.js`, `quiz-data.js` each exist as one full copy *per course* (not per page — that part's fine), rather than one shared module. A bug fix has to be manually ported four times. Git history shows this tax being paid directly: `e919c86 Fix Data Science course grading gaps and match sidebar to AISE's layout`.
3. **Two sources of truth for course structure**: `course-rail-data.ts` (server, canonical nav) duplicates what each course's own `course-progress.js` independently defines client-side — flagged as an intentional tradeoff in the code's own comments, but it's still a real drift risk as courses grow.
4. **No structured content model.** A lesson isn't data — it's a document. This is the actual ceiling on the user's stated long-term goals (adaptive learning, dynamic course maps, AI tutors with lesson-aware context, per-student content variation). None of those are reachable while content lives only as opaque HTML strings.
5. **Interactive-widget authoring doesn't scale.** Building something like an n8n-style visual workflow builder today means hand-rolling vanilla-JS DOM/canvas logic per course (`workflow-runtime.js`, `adaptive-engine.js` already show this pattern). It works, but each new interactive exercise type is a fresh from-scratch implementation with no shared component layer, no shared state primitives.
6. **Structural navigation ceiling.** Even with the sidebar now server-injected consistently (so it no longer visibly flickers), every lesson click is still a **full document reload** — full reparse, `course-rail.js`/`course-ui.js` re-executing from scratch, no persistent client runtime state across pages beyond `localStorage`. This has been polished about as far as it can go without leaving the raw-static-page-per-lesson model. It is a real, permanent limitation — just not an active bug anymore.

## 4. Bottlenecks

- **Navigation**: full MPA reload per lesson is now *smooth* (no flicker, cached assets, warm entitlement check) but is not, and cannot become, SPA-instant without changing how lesson HTML reaches the browser. This is the one item in the user's brief that the current architecture has a hard ceiling on — everything else is a maintainability problem, not a technical impossibility.
- **Cross-course maintenance**: any shared-logic fix costs 4x the effort today; at 10–30 courses on the same pattern, that becomes 10–30x.
- **New interactive exercise types**: linear increase in bespoke vanilla-JS per course, no compounding reuse.

## 5. Technical debt

- 4x duplicated shared JS/CSS per course (acknowledged in code comments as a deliberate tradeoff at the time, not an accident).
- Two sources of truth for course nav/module data (server `course-rail-data.ts` vs. client `course-progress.js`).
- Inline grading scripts embedded per-lesson rather than factored into testable modules.

None of this is urgent-fire debt — it's linear-cost debt that gets more expensive as course count grows, which is exactly the scaling question the user asked about.

## 6. Performance concerns

Genuinely minor today. The team has already addressed the real ones: 20s entitlement-check cache, `keepalive` on progress writes, cache headers split between long-lived chrome assets and no-cache HTML/JSON. Nothing here demands a stack change; it demands what's already happening — targeted tuning.

## 7. Student experience implications

- Within a course, navigation now *reads* as smooth (fixed sidebar look, no flash) even though it's a full reload underneath — the recent fixes bought real perceived-quality improvement without a rewrite.
- What a full rewrite would buy that targeted fixes cannot: persistent audio/video/widget state across lesson boundaries, instant transitions, shared animated UI (e.g., a progress ring that animates rather than resets). These are real "premium feel" gaps, but they are incremental polish, not correctness problems — students are not currently experiencing broken navigation.
- The bigger student-experience risk is on the **content-authoring side**: because every lesson is hand-written HTML, feature-parity and visual consistency across 4 courses already required an explicit pass (`59f6cdb Match sidebar organization across all courses`, `806b27c Give every published course the same lab chrome`). That tax will only grow with course count.

## 8. Comparison of stack options

### Option A — Improve the existing architecture only
Deduplicate the 4x shared JS/CSS into one shared bundle; move lesson data toward a light structured format (front-matter or JSON) that still renders to static HTML at build time instead of by hand; keep the server-injected sidebar.
**Pros**: lowest risk, zero regression exposure to grading/payments/auth, addresses the real duplication debt.
**Cons**: does not remove the MPA full-reload ceiling; does not enable component-based authoring for new interactive exercise types (visual workflow builders, drag-and-drop, adaptive diagrams) — those still mean hand-rolled vanilla JS per feature.

### Option B — Full Next.js + React + TypeScript course system
Rewrite the 123 lesson files as React components/MDX under a persistent `<CourseLayout>`.
**Pros**: true persistent sidebar/shell, client-side transitions, one progress/quiz engine instead of four, component reuse for lesson blocks and exercise types.
**Cons**: rewriting hand-authored grading logic (capstone scoring, `adaptive-engine.js`, `workflow-runtime.js`) is the highest-risk part of this codebase to touch — it directly determines whether paying students' completions are recorded correctly. SEO is not a real factor either way (content is paywalled, not indexed). **Migration difficulty: High. Risk: High**, concentrated specifically in re-implementing grading, not in the UI shell.

### Option C — B + Tailwind / shadcn / Framer Motion / Zustand / React Query
Evaluated component-by-component, not as a bundle, because the brief asked not to recommend libraries by popularity:
- **Tailwind**: already in use in the app shell — extending it to course content is consistent, not a new dependency.
- **shadcn/ui**: solves the actual stated maintainability goal ("update buttons/cards without editing hundreds of files") — but only has anything to attach to once content is componentized. Not useful standalone.
- **Framer Motion**: solves exactly what `d03ba8c` hand-rolled in vanilla JS (transition smoothing) — but again only pays off once there's a persistent component tree to animate between.
- **Zustand**: replaces the current `window.CourseProgress` global-object pattern with real shared client state — legitimate, but current pattern isn't broken, just less idiomatic.
- **React Query**: would replace the hand-rolled debounce+migrate logic in `course-progress.js` for `/api/progress` — legitimate simplification, but that hand-rolled logic is well-commented and currently correct; not an urgent swap.
**Verdict**: every item here maps to a real, named problem — none are cargo-culted — but every one of them is a payoff *conditional on* B being done first. C is not a separate decision from B; it's B's implementation detail.

### Option D — Hybrid: existing content + modern shell
Keep the 123 lesson HTML files and their grading logic exactly as they are (zero regression risk to graded student work), but wrap `/courses/:courseId/...` in a persistent Next.js layout with client-side navigation, so the sidebar/chrome never remounts and only the lesson body swaps.
**Real technical risk that must be named honestly**: injecting raw lesson HTML strings into a React tree (`dangerouslySetInnerHTML`) does **not** execute embedded `<script>` tags the way a full page load does. Every lesson's inline grading script and the `course-progress.js` / `pyodide-sandbox-runner.js` bootstrapping would need an explicit re-execution or mount-function convention on client-side navigation. This is a solvable, well-understood problem (it's the same one every "static content in a SPA shell" system solves), but it is the crux engineering risk of Option D and should not be glossed over.
**Pros**: doesn't touch Pyodide, grading, Whop, Prisma, or auth — the highest-value, highest-regression-risk code stays untouched. Delivers the actual missing piece (persistent shell, no full reload) without rewriting 123 files.
**Migration difficulty: Medium (shell) / Low (content, since it's untouched). Risk: Low–Medium**, concentrated in the script re-execution mechanism, which is testable in isolation before any course is switched over.

---

## 9. Recommended stack

**Next.js (current, 16) + React 19 + TypeScript + Tailwind 4** for the app shell and for a **new persistent `/courses/:courseId` layout** — built as Option D's hybrid adapter first. Add **shadcn/ui primitives and Framer Motion transitions** only once that persistent shell exists to attach them to. Treat **Zustand and React Query as opportunistic replacements**, not day-one requirements, applied when a specific hand-rolled piece (global progress object, debounce/migrate fetch logic) is actually being touched for other reasons.

Do **not** rewrite the 123 existing lesson files or their grading logic as a project. Componentize **new** course content going forward (MDX or JSX lesson authoring) once the persistent-shell adapter is proven, and migrate old lessons opportunistically — only when a lesson is being substantially reworked anyway — not as a scheduled bulk conversion.

## 10. Migration difficulty

**Medium.** The risky part (grading logic, Pyodide, Whop, auth, Prisma) is explicitly *not* being touched. The genuinely new engineering work — a persistent course shell with correct script re-execution on navigation — is a well-scoped, testable, isolated problem.

## 11. Estimated migration risk

**Low–Medium**, contingent entirely on solving script re-execution correctly and testing it against the highest-complexity course (AISE, with its ~12 bespoke kit scripts) before rollout — not on the pilot course, where risk is intentionally minimized.

## 12. Recommended migration strategy

Phased, as outlined in the brief:

- **Phase 0 — Inventory** (this document + the underlying agent research): pages, shared scripts, APIs, DB dependencies, progress systems, course-specific logic. Already done — no code changed.
- **Phase 1 — Build the new shell**: a persistent `<CourseLayout>` in `src/app/courses/[courseId]/` using nested App Router layouts, replacing full-page navigation with client-side transitions between lesson bodies. Sidebar becomes a real persistent React component (porting `course-rail-template.ts`'s logic, not `wrapCoursePage`'s string-splice). No course content is migrated yet.
- **Phase 2 — Pilot one course** (see §15).
- **Phase 3 — Compatibility layer**: solve script re-execution for injected lesson HTML — a small, dedicated adapter that scans injected content for `<script>` tags and re-runs them on each client-side navigation, and confirms `window.CourseProgress`, `course-rail.js`, and `pyodide-sandbox-runner.js` re-bootstrap correctly without full reload. This is the one piece of genuinely new engineering; build and test it in isolation before touching the pilot course.
- **Phase 4 — Gradual content migration**: only after Phase 3 is proven in production on the pilot course, decide course-by-course (not file-by-file on a schedule) whether to componentize further. New courses should be authored in the new structured format from day one.
- **Phase 5 — Interaction polish**: Framer Motion transitions, shadcn primitives, once there's a stable component tree to apply them to.

## 13. What can be preserved

Everything that is currently correct and load-bearing: the auth/entitlement guard, Prisma schema and Postgres data, Whop webhook handling, Pyodide sandbox runner, all grading logic (inline scripts and kit files), progress sync logic, and every existing lesson's content and URLs. None of this needs to change for the recommended migration to succeed.

## 14. What should be rebuilt

Only the **delivery mechanism** for lesson content: replace `wrapCoursePage`'s per-request string-splice + full-page-load model with a persistent React shell that swaps lesson bodies via client-side navigation. Secondarily, deduplicate the 4x-copied shared JS/CSS into one shared module set (Option A's contribution, worth doing regardless of the shell decision).

## 15. Best pilot course

**AI Engineering.** Of the four courses, it carries the fewest bespoke subsystems — just the standard set (`course-progress.js`, `course-rail.js`, `course-ui.js`, `quiz-data.js`, `pyodide-sandbox-runner.js`), with no extra kit files. Automation Engineering and Data Science each add one or two extra runtimes (workflow-runtime, plotly-sandbox-runner); AI-Assisted Software Engineering has by far the most bespoke scripts (~12 kit files: adaptive-engine, workflow-kit, detective-kit, evidence-kit, prompt-kit, northline, and more) and should be migrated last, once the script-re-execution adapter has been proven safe elsewhere. AI Engineering still meaningfully exercises the two riskiest subsystems (Pyodide execution, quiz grading), so the pilot is a real test, not a trivial one — just not the highest-complexity one.

## 16. Final decision

**Is the current stack good enough for Zenith Lab's long-term vision? — No, not as-is, but the failure point is narrow and already identified: the content layer is opaque static HTML with no persistent client shell.** The backend (Prisma/Postgres, Whop, auth, Pyodide, progress sync) is already correctly built and framework-agnostic — none of it is the bottleneck, and none of it should be touched. The frontend delivery mechanism for lesson content is the one piece that structurally cannot reach "premium, instant, stateful" navigation without changing how content reaches the browser — but it can be replaced incrementally, behind the existing untouched backend, without a rewrite of 123 lesson files or their grading logic.

This rules out both extremes the brief warned against: keeping everything as-is (Option A alone) will not get past the MPA ceiling or the growing duplication tax as courses scale to 10–30; a full rewrite of all course content (Option C in full) risks the platform's highest-value, correctly-working code (grading, payments) for a payoff — smoother transitions — that Option D captures at a fraction of the risk.

---

```text
CURRENT STACK VERDICT:
GRADUAL FRONTEND MIGRATION

RECOMMENDED ARCHITECTURE:
Next.js 16 + React 19 + TypeScript + Tailwind 4 (current) — persistent <CourseLayout>
shell replacing per-request full-page HTML delivery, built via a hybrid adapter that
keeps existing lesson HTML/grading scripts intact and re-executes them on client-side
navigation. shadcn/ui + Framer Motion added once the shell exists. Zustand / React
Query adopted opportunistically, not as day-one requirements. Backend (Prisma/Postgres,
Whop, Pyodide, auth, progress sync) unchanged.

MIGRATION RISK:
Low-Medium — concentrated entirely in one isolated, testable problem (script
re-execution on client-side navigation), with zero required changes to grading,
payments, auth, or data.

STUDENT EXPERIENCE IMPACT:
Removes the last structural navigation ceiling (full document reload per lesson)
without touching anything that currently works correctly for paying students —
builds on, rather than discards, the sidebar/perf fixes already shipped.

LONG-TERM SCALABILITY:
6/10 as-is at 4 courses; heading toward 3/10 by 20-30 courses on the current
duplicated-static-HTML pattern. The recommended path targets 8/10 by removing the
duplication tax and enabling structured content for future adaptive-learning and
AI-tutor features, without the regression risk of a full rewrite.
```
