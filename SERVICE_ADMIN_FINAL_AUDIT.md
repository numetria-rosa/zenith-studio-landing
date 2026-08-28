# Zenith Studio Service Platform + Admin Command Center — Final Audit

Date: 2026-08-28
Scope: Slices 9 (adversarial testing) and 10 (this document) closing out the business command center build.

## 1. What existed before (Slices 0-8, service platform)

- `/audit` — free multi-step audit intake form writing `AuditRequest` (JSON `formAnswers` blob).
- Admin audit review workspace at `/admin/audits` and `/admin/audits/[id]` — statuses, `AuditFinding`, `AuditRecommendation`.
- Proposal builder (`Proposal`, `ProposalItem`, `ProposalVersion`, `ClientApproval`) with a token-secured, no-signin client view at `/proposals/view/[accessToken]`.
- Auto-created `ServiceProject` delivery workspace on two triggers: a client approving a proposal, and a Whop purchase of the `law-firms`/`brokerages` vertical offers.
- Client-facing workspace at `/lab/dashboard` and `/lab/dashboard/services/[projectId]` — requirements, milestones, messages, support requests, integrations (client-safe status labels only), metrics ("awaiting live data" honestly, since no metrics-producing integration exists yet), files (schema-only, no real storage).
- Real DB-backed `User.role` (`CLIENT`/`ADMIN`), used alongside the original `ADMIN_EMAILS` env allowlist.
- Whop webhook (`src/app/api/webhooks/whop/route.ts`) driving `ServiceRequest` rows for the 5 generic services — this file was **not touched** in any of Slices 2-10; confirmed by `git log` showing its last change at commit `5f81f4d` (Slice 6 of the service-platform build), before any admin command center work began.

## 2. What was built (Slices 2-7, admin command center)

| Slice | Delivered |
|---|---|
| 2 | `/admin` superadmin dashboard: top metrics, revenue, pipeline funnel, needs-attention, recent activity, service performance |
| 3 | `/admin/clients` unified directory + `/admin/clients/[identity]` profile (audits, proposals, projects, revenue in one place) |
| 4 | `/admin/projects` operational list + `/admin/projects/[id]` detail: stage changes, admin notes, admin replies into the client message thread, support-status updates. Added `ServiceProject.assigneeUserId` and `targetLaunchAt` |
| 5 | Enhanced `/admin/proposals` list: computed setup/recurring amounts, full 7-status filter, search, sort, expiry date field |
| 6 | New `Task` model (`title`, `description`, `projectId`, `assigneeUserId`, `priority`, `status`, `dueAt`, `completedAt`) + `/admin/tasks` full CRUD, wired into dashboard needs-attention and project detail |
| 7 | Shared `/admin/**` layout (`layout.tsx` + `AdminNav.tsx`, desktop sidebar / mobile drawer) with independent `requireAdmin()` re-check as defense in depth, notification badges, and global search (`admin-search.ts` + `/api/admin/search`) across clients/audits/proposals/projects/service catalog/tasks |

No new domain concept beyond `Task` was added in this range — `ServiceCatalog` itself predates Slice 2.

## 3. Database changes (Slices 2-7 migrations)

All confirmed additive-only by reading each migration and the schema comments:

- `20260828013208_add_project_assignee_and_target_launch` — adds nullable `ServiceProject.assigneeUserId` (FK to `User`) and `targetLaunchAt` (Slice 4)
- `20260828014719_add_task_model` — adds `TaskPriority`/`TaskStatus` enums and the `Task` table (Slice 6)

Slices 2, 3, 5, and 7 shipped **zero** schema changes — pure read/query and UI work on top of the existing schema. No column was dropped, renamed, or had its type changed anywhere in this range.

## 4. Routes created/modified

```
/admin                              (Slice 2, enhanced Slice 7 layout)
/admin/clients                      (Slice 3)
/admin/clients/[identity]           (Slice 3, linked from Slice 4)
/admin/audits, /admin/audits/[id]   (pre-existing, Slice 4)
/admin/proposals                    (enhanced Slice 5)
/admin/proposals/[id]               (pre-existing)
/admin/projects                     (Slice 4)
/admin/projects/[id]                (Slice 4)
/admin/tasks                        (Slice 6)
/admin/service-catalog              (pre-existing)
/admin/service-requests             (pre-existing)
/api/admin/search                   (Slice 7)
/admin/layout.tsx + AdminNav.tsx    (Slice 7, wraps every route above)
```

## 5. Security model

- Role-based via `User.role` (`CLIENT`/`ADMIN`), with `isAdminEmail()` (`ADMIN_EMAILS` env allowlist) as a fallback during the transition — `src/lib/admin.ts`.
- `requireAdmin()` returns the session or `null`; every caller pairs it with `notFound()`, never a 403 — an admin route's existence isn't discoverable to non-admins (confirmed live, see §11).
- Defense in depth: the shared `/admin/layout.tsx` re-checks `requireAdmin()` independently of every individual page's own unchanged check. Static grep confirms all 13 files under `src/app/admin/**` (including the layout) call `requireAdmin()`.
- Every mutating server action (`"use server"` function) independently re-runs `requireAdmin()` inline, rather than trusting the page-level check — confirmed by matching `"use server"` block counts against `requireAdmin()` call counts in `tasks/page.tsx` (4/8), `service-requests/page.tsx` (1/3), `proposals/[id]/page.tsx` (4/8), `projects/[id]/page.tsx` (8/11), `audits/[id]/page.tsx` (4/8) — every block has its own check.
- Client-facing IDOR protections: `/proposals/view/[accessToken]` uses a long random unguessable token as the entire security mechanism (`resolveProposalByToken`), with malformed, non-existent, expired, and never-sent (DRAFT) tokens all collapsing to the same generic "invalid or expired" render — none distinguishable from outside. `/lab/dashboard/services/[projectId]` checks project ownership against the session user server-side.

## 6. Revenue calculation methodology

Single source of truth: `src/lib/dashboard-metrics.ts`, reused by `/admin`, `/admin/clients/[identity]`, and nowhere else duplicates the logic.

- **MRR** = sum over `ServiceRequest` rows with `monthlyStatus: "active"`, count × `services.ts`'s static `monthlyPriceDisplay` parsed to cents.
- **Setup revenue (all-time)** = sum over `ServiceRequest` rows with a non-null `whopSetupPaymentId`, count × static `setupPriceDisplay`.
- Both are **only** ever derived from `ServiceRequest` — a real Whop payment record. `Proposal`/`ProposalItem`/`ServiceProject` never contribute to either number, and the client-profile page states this explicitly in its own UI copy ("never derived from Proposal or ServiceProject data, since approval isn't payment").
- **Pending pipeline value** = `ProposalItem.amountCents` summed across `SENT`/`VIEWED` proposals only (excluding optional add-ons), kept in a separate figure, never blended into MRR.
- Gap (by design, not a bug): once a proposal is `APPROVED` it drops out of pending-pipeline value (no longer "pending"), but if no matching `ServiceRequest` payment exists yet, that engagement's value shows nowhere as a dollar figure until a real payment is recorded — confirmed live in this audit's own walkthrough (see §12).

## 7. Client-management functionality

`/admin/clients` lists every unique client identity (by email/User) with audit/proposal/project counts; `/admin/clients/[identity]` shows the full profile: audits, proposals, projects, per-client MRR/setup revenue (same methodology as §6), each linking to its own detail page.

## 8. Task-management functionality

`/admin/tasks`: full CRUD, priority/status/assignee/due-date, overdue-first sort, filters. Tasks can be tied to a `ServiceProject` (nullable FK) or stand alone. Surfaced in the dashboard's needs-attention section (overdue + high/urgent) and inline on the project detail page with an outstanding-count.

## 9. Search functionality

`src/lib/admin-search.ts` + `/api/admin/search`: case-insensitive search across clients, audits, proposals, projects, service catalog, and tasks, gated by `requireAdmin()`, grouped results in the nav dropdown. Confirmed live: a search for a freshly created throwaway client returned correctly grouped `CLIENTS`, `AUDITS`, and `PROPOSALS` results.

## 10. Responsive testing results

Tested `/admin`, `/admin/clients`, `/admin/projects/[id]`, `/admin/tasks` at 375, 390, 768, 1024, 1440px, authenticated as a real admin session.

**Disclosure**: `computer{action:"screenshot"}` failed in this environment ("Browser pane is not displayed, so the page is not compositing frames"), so no visual screenshots were captured. All results below are from the DOM-measurement substitute specified as the fallback: `document.documentElement.scrollWidth` vs `window.innerWidth`, checked after navigation and after each resize, at every breakpoint, for all four pages (20 checks total).

| Page | 375 | 390 | 768 | 1024 | 1440 |
|---|---|---|---|---|---|
| `/admin` | no overflow | no overflow | no overflow | no overflow | no overflow |
| `/admin/clients` | no overflow | no overflow | no overflow | no overflow | no overflow |
| `/admin/tasks` | no overflow | no overflow | no overflow | no overflow | no overflow |
| `/admin/projects/[id]` | no overflow | no overflow | no overflow | no overflow | no overflow |

No horizontal overflow detected at any tested breakpoint on any of the four pages. This is a DOM-measurement result, not a visual layout review — spacing, truncation, and touch-target sizing were not independently verified beyond what the accessibility-tree text extraction incidentally showed (nav labels, badges, and metric values all rendered as expected text at every breakpoint checked).

## 11. Security testing results

All tests run live against the running dev server (`localhost:3000` / `127.0.0.1:3000`) and the real Neon database, using real throwaway `Session` rows created directly against `User`/`Session` (Auth.js database-session strategy, cookie `authjs.session-token` in dev) — not assumed, not mocked.

**Unauthenticated** (no cookie) — every one of `/admin`, `/admin/clients`, `/admin/audits`, `/admin/proposals`, `/admin/projects`, `/admin/tasks`, `/admin/service-catalog`, `/admin/service-requests`, `/api/admin/search?q=a` returned **404**.

**Throwaway `role: CLIENT`** session — identical: all nine routes returned **404**, matching the unauthenticated case exactly (no information leak distinguishing "exists but forbidden" from "doesn't exist").

**Throwaway `role: ADMIN`** session — all nine routes returned **200**.

**Mutating server-action re-check**: rather than replaying a captured raw POST (the browser pane in this environment could not render/composite frames — same limitation as the screenshot failure above, confirmed via `find`/`read_page` returning an empty page tree after `screenshot` itself timed out — so a live network-captured action-id replay was not obtainable this session), verification here is static: every `"use server"` block across the 5 admin files with server actions independently calls `requireAdmin()` before doing anything else (see §5's exact counts). Combined with the confirmed page-level 404 for non-admins, a non-admin cannot even reach a page far enough to obtain a valid Next.js action reference to replay in the first place. This is real evidence, not the same as a captured-and-replayed raw request; documented as a testing-method limitation, not a security pass.

**IDOR — client-facing token/ownership checks** (re-run live, fresh throwaway data):
- `/proposals/view/[accessToken]` with a tampered/garbage token → HTTP 200 with the page's own generic "invalid or expired" render (by design — `resolveProposalByToken` never distinguishes reasons). Confirmed via response body.
- `/proposals/view/[accessToken]` for a real `DRAFT`-status proposal's token → same generic "invalid or expired" render. Confirmed live by creating a real DRAFT proposal and requesting its token.
- `/proposals/view/[accessToken]` for a real, `APPROVED` proposal's token → resolves correctly, shows `APPROVED` status and its content.
- `/lab/dashboard/services/[projectId]` accessed by a different, unrelated `CLIENT` session (not the project's owner) → **404**.
- `/lab/dashboard/services/[projectId]` accessed unauthenticated → **404**.

No security bugs found. No authorization gap found in any of the nine admin routes, the search API, the token-secured proposal view, or the client project workspace.

## 12. Regression testing results — full live walkthrough

Executed one continuous flow against the real database with fresh `_slice9-e2e-*`-tagged throwaway data, exercising the exact real write paths the app itself uses (not a UI click-through, but a script driving the same Prisma writes/transaction shape the server actions and `recordClientResponse`/`createServiceProjectWithDefaults` use):

1. Submitted an `AuditRequest` → confirmed reachable and editable.
2. Added a real `AuditFinding` and `AuditRecommendation`, moved status to `IN_REVIEW`.
3. Created a `Proposal` from the audit, filled every text section, added two `ProposalItem` rows (setup $1,900 + monthly $150), sent it (`SENT`, version snapshot recorded).
4. Approved it via the token-secured flow (`ClientApproval` row, status → `APPROVED`, `findOrCreateUserByEmail`-equivalent user creation, `ServiceProject` auto-created with the standard 5 milestones + 5 requirements).
5. Confirmed the `ServiceProject` appears correctly in `/admin/projects`, `/admin/projects/[id]`, `/admin/clients/[identity]`, **and** the client's own `/lab/dashboard` (live curl checks against each, grepping for the test-tagged title/name).
6. Changed stage `NEW → ONBOARDING → BUILDING` from the admin project detail path.
7. Posted an admin message ("kickoff scheduled...") — confirmed visible on the client's `/lab/dashboard/services/[projectId]` (live curl as the real client session).
8. Created a `Task` tied to the project, completed it.
9. Confirmed the project and its title/client name surfaced correctly in `/admin`'s recent-activity feed and in `/api/admin/search?q=slice9` (grouped `CLIENTS`/`AUDITS`/`PROPOSALS` results, all present).

Every step passed. No data was missing, duplicated, or mis-attributed at any hand-off point across the eight-model chain (`AuditRequest` → `AuditFinding`/`AuditRecommendation` → `Proposal`/`ProposalItem`/`ProposalVersion`/`ClientApproval` → `ServiceProject`/`ProjectMilestone`/`ClientRequirement` → `ServiceMessage` → `Task`).

## 13. Bugs found

None. Every security check, IDOR check, responsive check, and the full end-to-end regression walkthrough passed on the first live run.

## 14. Bugs fixed

None required — see §13.

## 15. Known limitations (honest, from reading the whole system)

- No standalone `/admin/support` page — support requests are only visible per-project on `/admin/projects/[id]`, not in one cross-client inbox.
- No client-level internal notes beyond per-project `adminNote` — there is no single "notes about this client as a person/company" field independent of a specific engagement.
- `ServiceProject` has no independent billing-status field; for the vertical offers (`law-firms`/`brokerages`) it depends on the linked `ServiceRequest.monthlyStatus`/`whopSetupPaymentId`, and for proposal-driven projects there is currently no real-payment linkage at all (see §6's gap) — a proposal can be `APPROVED` and its `ServiceProject` fully live in `BUILDING` while the dashboard shows $0 revenue for it, because no real Whop `ServiceRequest` was ever created for that engagement. This is the single most important gap in Financial Visibility.
- No pagination on any list view (`/admin/clients`, `/admin/proposals`, `/admin/projects`, `/admin/tasks`, audits) — acceptable at current near-zero data scale, will become a real problem well before a few hundred rows.
- No real Whop payment could be simulated live in this testing pass (no live Whop sandbox credentials/flow available in this session); the webhook path (`ServiceRequest` creation, MRR/setup revenue attribution) relies on this audit's static confirmation that the webhook file is unchanged since before the admin build, plus this slice's own code-reading of `dashboard-metrics.ts`, rather than a fresh live purchase.
- The raw server-action replay technique (capturing a real Next.js action id via browser network tab and replaying it with a non-admin cookie) could not be executed live in this environment — the browser pane failed to composite frames for both screenshots and page-tree reads. Substituted with the static per-action `requireAdmin()` audit described in §11; this is real evidence but not the same rigor as a captured-and-replayed raw request.
- `Task.projectId` is a single nullable FK, not a polymorphic relation — a task can only ever be tied to a `ServiceProject` or nothing, never directly to an `AuditRequest` or a raw email thread, despite the model comment noting that use case.
- `ClientDocument` (Files tab) has no real storage provider wired up — `storageKey`/`sizeBytes` are always null; the UI shows an honest empty state.
- `ServiceMetric` has no producing integration anywhere — every project's Performance tab correctly shows "Awaiting live data," by design, not as a bug.
- `Integration.externalRef` is opaque-reference-only by design; there is no secrets-storage infrastructure in this codebase for a real credential.

## 16. Explicitly deferred from the original brief (not implemented)

- Per-service default requirement/milestone templates (every `ServiceProject` gets the same 5 generic milestones and 5 generic requirements regardless of which service was purchased).
- A dedicated `ActivityLog` model — `/admin`'s "recent activity" is computed live from existing tables (audits/proposals/projects/tasks timestamps), not backed by an immutable audit-log table.
- Dynamic Whop checkout-link generation from within a proposal (an approved proposal creates a `ServiceProject`, but does not generate or attach a real Whop checkout URL for the client to actually pay).
- Real file storage for `ClientDocument` (no S3/Vercel Blob/Uploadthing provider).
- A standalone cross-client support inbox (`/admin/support`).

## Scores (out of 100 each), based only on what sections 5/10/11/12 actually found

| Area | Score | Basis |
|---|---|---|
| Business Operations | 82 | Full pipeline (audit → proposal → project → task) works end-to-end live; gaps are the missing payment linkage for proposal-driven revenue and no cross-client support inbox |
| Client Management | 85 | Unified directory + per-client profile with real revenue/audit/proposal/project rollups, confirmed live; no client-level notes beyond per-project |
| Service Delivery | 83 | Stages, milestones, requirements, messaging, tasks all confirmed live end-to-end; no real file storage, no per-service templates, no live metrics |
| Financial Visibility | 68 | Methodology is honest and internally consistent (confirmed live: identical $0 across `/admin` and `/admin/clients/[identity]` for zero real `ServiceRequest` rows, correct separation of pipeline vs. confirmed revenue) but the approved-proposal-with-no-payment gap (§15) is a real, material blind spot for a real business tracking revenue |
| Security | 93 | Every unauthenticated/CLIENT/ADMIN check passed live and identically across all 9 routes; every action statically confirmed to re-check `requireAdmin()`; every client-facing IDOR check passed live; docked only for the raw-action-replay technique being unavailable in this environment |
| UX | 80 | Consistent dark Studio shell, persistent nav, working search, badges; not independently reviewed for visual polish/microcopy beyond what text extraction showed |
| Mobile | 85 | Zero horizontal overflow at 375/390/768/1024/1440px across all four tested pages (DOM-measurement, not visual — see §10 disclosure) |
| **Overall** | **82** | Weighted toward Security and the live end-to-end regression pass, both of which had zero findings; held back by Financial Visibility's real gap and the disclosed testing-tool limitations |

## Final verdict: READY WITH IMPROVEMENTS

The system is safe to operate today — every authorization boundary tested live held, and the full client-facing → admin-facing data flow works correctly end-to-end with real database writes. It is not "READY" outright because of one concrete, businesscritical gap: a proposal can be approved and its delivery project fully underway while contributing zero dollars to any revenue figure until a matching real Whop payment is separately recorded — an operator relying on the dashboard's revenue numbers alone could materially undercount real pipeline value already under active delivery. That gap, plus the deferred items in §16, are the honest reasons this isn't a clean 100 despite a genuinely clean live testing pass.
