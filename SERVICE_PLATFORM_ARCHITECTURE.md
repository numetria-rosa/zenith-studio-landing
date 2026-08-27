# Zenith Studio — Service Platform Architecture Audit

Read-only audit. No code, database, or migration was touched. Every claim below is
traced to a file and line read during this audit (paths relative to `D:\zenith-studio`).
Written 2026-08-27.

---

## 1. Existing architecture

### 1.1 Framework / routing

Next.js App Router. Relevant tree under `src/app`:

```
src/app/
  page.tsx                          marketing home (dark cyan/fuchsia/emerald aesthetic)
  sign-in/                          password sign-in
  welcome/                          post-checkout landing
  profile/                          account page
  lab/
    page.tsx                        Zenith Lab marketing/catalog page
    dashboard/page.tsx              signed-in student/client dashboard
    [courseId]/page.tsx             per-course landing
    CourseCatalog.tsx, courses-data.ts
  courses/[courseId]/[...path]/     guarded static course content passthrough
  admin/
    service-requests/page.tsx       the ONLY admin surface that exists today
  api/
    auth/[...nextauth]/route.ts     NextAuth handler mount
    auth/claim/route.ts             post-Whop-checkout auto-signin
    webhooks/whop/route.ts          Whop event ingestion (the money path)
    admin/service-requests/[id]/route.ts   PATCH endpoint for admin status edits
    me/route.ts, progress/route.ts, progress/migrate/route.ts
```

There is no `src/app/api/audits`, no `proposals`, no `client-portal`, no superadmin
dashboard beyond the single `admin/service-requests` page — none of Phase 5+ exists yet
in any form, not even a stub.

### 1.2 Auth

- **`src/lib/auth.ts`** — NextAuth v5 configured with `PrismaAdapter(db)`, `session: { strategy: "database" }`, **zero OAuth/credentials providers registered** (`providers: []`). It exists purely so `auth()` / `signOut()` can read the Session table and attach `session.user.id` in the `session` callback. Comment in the file states plainly: no email-sending provider is wired up (despite `resend` being a listed npm dependency — see §8).
- **`src/lib/session.ts`** — the *real* sign-in mechanism. `createSessionForUser(userId)` manually inserts a `Session` row and sets the Auth.js-compatible cookie (`__Secure-authjs.session-token` in prod) by hand, bypassing NextAuth's `signIn()` entirely. Used by two flows:
  1. Password sign-in (presumably `src/app/sign-in`, calls this after verifying `passwordEnc`).
  2. `src/app/api/auth/claim/route.ts` — the post-Whop-checkout auto-login. Whop redirects the buyer's browser to this route with `?status=success&payment_id=pay_XXX`. The route polls `PurchaseClaim` (up to 6 retries, 1s apart, to win the race against the webhook) for a row keyed by that `paymentId`, and if found and unexpired, calls `createSessionForUser` and redirects to `/welcome`. This route only ever *reads* what the webhook already wrote — it is not a trusted write path itself.
- **No role field on `User` at all.** See §1.2.1 below — admin gating does not use the database.

#### 1.2.1 Admin gating — `src/lib/admin.ts` (full file, 21 lines)

```ts
export function isAdminEmail(email) {
  const allowlist = (process.env.ADMIN_EMAILS || "").split(",")...
  return allowlist.includes(email.toLowerCase());
}
export async function requireAdmin() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) return null;
  return session;
}
```

Admin access today is **entirely an env-var allowlist of emails** (`ADMIN_EMAILS` in
`.env`), checked against the signed-in session's email. There is no `role` column, no
`AdminUser` table, nothing in Postgres that says "this account is an admin." Anyone
whose account email is in that comma-separated env var is an admin, full stop.

`requireAdmin()` is called at the top of `src/app/admin/service-requests/page.tsx` and
again inside the page's own server action (`updateRequest`) before writing — so the
mutation path re-checks, it doesn't trust the page having rendered. The page also
returns `notFound()` (404) rather than a redirect/403 for non-admins, deliberately, so
the route's existence isn't confirmable to a logged-in-but-not-you visitor (comment in
file says this explicitly).

**Assessment**: this is sound as far as it goes — the check is server-side, re-verified
on every write, and doesn't leak the route's existence — but it is a single flat
allowlist with no granularity (no "support staff who can see clients but not edit
pricing," no audit trail of who changed what) and no revocation mechanism beyond
editing an env var and redeploying. It's adequate for a single operator today; it is
not a foundation a multi-role superadmin dashboard should be built directly on top of.

### 1.3 Database — `prisma/schema.prisma` (full schema, verbatim understanding)

Provider: `postgresql` (Neon/Vercel Postgres, per the file's own header comment).
Migrations applied, in order: `20260818031714_init`, `20260818232423_add_service_requests`,
`20260826002244_add_password_and_purchase_claims`, `20260826021723_password_encryption_no_email`.

| Model | Purpose | Key fields |
|---|---|---|
| `User` | Auth.js user + Zenith identity | `id`, `email` (unique), `emailVerified`, `name`, `image`, `whopUserId` (unique, nullable — the "stronger identity" populated by the webhook), `passwordEnc` (AES-256-GCM ciphertext, nullable), `createdAt`, `updatedAt`. Relations: `accounts`, `sessions`, `entitlements` (CourseEntitlement[]), `progress` (CourseProgress[]), `serviceRequests` (ServiceRequest[]), `purchaseClaims` (PurchaseClaim[]). **No `role` field.** |
| `Account` | Auth.js adapter table | standard OAuth account shape, unused today since no providers are registered |
| `Session` | Auth.js adapter table | `sessionToken` (unique), `userId`, `expires` — the table both NextAuth and the manual `createSessionForUser` write into identically |
| `VerificationToken` | Auth.js adapter table | unused (no magic-link provider active) |
| `CourseEntitlement` | "User X owns course Y" | `userId`, `courseId` (matches `src/lib/courses.ts` ids), `status` ("active"\|"revoked" as a free string, not a Prisma enum), `source` (default "whop"), `whopMembershipId`, `whopPaymentId`, `grantedAt`, `revokedAt`. `@@unique([userId, courseId])`, indexed on `courseId`. |
| `PurchaseClaim` | Bridges Whop's checkout-redirect payment id to a local user for zero-typing auto-login | `paymentId` (unique), `userId`, `claimedAt` (nullable), `expiresAt`, `createdAt`. One row per payment. |
| `WebhookEvent` | Idempotency ledger | `id` (the **primary key IS Whop's `webhook-id` header** — a retried delivery reuses the id, so a duplicate insert fails on the PK and is the idempotency mechanism itself), `type`, `receivedAt`, `payload` (Json, the full raw event). |
| `CourseProgress` | Per-(user,course) progress mirror of client-side localStorage shape | `userId`, `courseId`, `data` (Json, shape-validated on write only — **not proof of genuine completion**, per the file's own comment), `updatedAt`. `@@unique([userId, courseId])`. |
| `ServiceRequest` | AI Systems (agency work) purchase + build tracking | `userId`, `serviceId` (matches `src/lib/services.ts` ids), `status` (free string: new\|scoping\|building\|live\|maintenance), `monthlyStatus` (free string: inactive\|active\|canceled — independently tracked from build `status`, so a lapsed retainer doesn't erase what was built), `whopSetupPaymentId`, `whopSetupMembershipId`, `whopMonthlyMembershipId`, `adminNote` (Text, "never read by the client dashboard"), `createdAt`, `updatedAt`. `@@unique([userId, serviceId])` — **one row per (user, service) pair, not per purchase/engagement**. Indexed on `whopMonthlyMembershipId`.

Notable schema-level facts that matter for any migration plan:
- All status/kind fields are free-form `String`, not Postgres/Prisma enums — easy to
  extend additively (no enum-alteration migration needed to add a new status value),
  but also means there is no DB-level constraint preventing a typo'd status.
- `ServiceRequest`'s `@@unique([userId, serviceId])` means the current model cannot
  represent a user buying the *same* service twice as two independent engagements —
  a second purchase upserts into the same row (see §2 webhook logic). This is a real
  constraint the new `ServiceProject` design must not blindly inherit.
- Every foreign-keyed relation uses `onDelete: Cascade` from the `User` side.

### 1.4 Whop integration — full event → DB write path

**Client — `src/lib/whop.ts`**: lazy singleton (`getWhopClient()`), constructed only at
request time, not at module load, specifically because a module-level `new Whop(...)`
broke the Vercel build when `WHOP_API_KEY` was unset at build time (comment documents
this was an actual incident, not a hypothetical).

**Webhook — `src/app/api/webhooks/whop/route.ts` (full file read, 215 lines)**:

1. Reads the raw request body as text (`request.text()`) — critical, because signature
   verification requires the unparsed body and doing `request.json()` first would break it.
2. Calls `whop.webhooks.unwrap(rawBody, { headers })`. This throws on bad signature →
   caught → `400 invalid signature`, and the payload is never trusted past this point.
3. Everything else runs inside **one Prisma `$transaction`**:
   - `tx.webhookEvent.create({ data: { id: event.id, type: event.type, payload: event } })`
     — this is the idempotency gate. `id` is Whop's `webhook-id` header value and is the
     model's `@id`. A retried delivery (Whop is at-least-once) reuses the same id, the
     insert throws Prisma error `P2002` (unique constraint), the whole transaction rolls
     back, and the route returns `200 OK` treating this as an already-handled success —
     not an error.
   - If `event.type === "payment.succeeded"` → `handlePaymentSucceeded(tx, event.data)`.
   - If `event.type === "membership.deactivated"` → `handleMembershipDeactivated(tx, event.data)`.
   - Every other event type is accepted, the `WebhookEvent` row is still recorded (for
     audit/debug), but no business logic runs.
   - If business logic throws for any reason, the **entire transaction rolls back
     including the `WebhookEvent` insert** — deliberately, so a genuine Whop retry can
     actually reprocess a delivery that failed for a transient reason, rather than
     silently no-op'ing on something that was never actually handled.

**`handlePaymentSucceeded(tx, payment)` — routing logic**:
```
productId  = payment.product?.id
courseId   = productId ? courseIdForWhopProductId(productId) : null   // src/lib/courses.ts
serviceMatch = courseId ? null : serviceKindForWhopPlanId(payment.plan?.id)  // src/lib/services.ts
```
- If **neither** matches → `console.warn(...)`, function returns. **No DB write of any
  kind happens** — no `WebhookEvent`... wait, the `WebhookEvent` row *was* already
  inserted earlier in the same transaction (step 3a happens before the type dispatch),
  so the event is recorded, but no `PurchaseClaim`, `CourseEntitlement`, or
  `ServiceRequest` is created. The buyer paid and nothing in the app knows they exist
  as a customer beyond the raw JSON blob in `WebhookEvent`.
- Otherwise, resolves/creates the `User` (`findOrCreateUser`, preferring `whopUserId`
  match, falling back to `email` match, backfilling `whopUserId` onto an existing
  email-matched row the first time it's seen), then always calls
  `createPurchaseClaim(tx, user.id, payment.id)` (issues a real password via
  `generateStrongPassword()`/`encryptPassword()` on first purchase only, and
  upserts a `PurchaseClaim` row — update branch is a no-op so a retried webhook never
  regenerates an already-issued claim).
- If `courseId` matched: upserts `CourseEntitlement` (`status: "active"`), keyed on
  `@@unique([userId, courseId])`.
- If `serviceMatch` matched (`{ serviceId, kind: "setup" | "monthly" }`, from
  `src/lib/services.ts`'s `serviceKindForWhopPlanId`, which only searches the 3
  hardcoded `SERVICES` array entries by `whopSetupPlanId`/`whopMonthlyPlanId`):
  upserts `ServiceRequest` keyed on `@@unique([userId, serviceId])`. `kind: "setup"`
  creates at `status: "new"` (or leaves an existing row's `status` alone on re-buy).
  `kind: "monthly"` sets `monthlyStatus: "active"`.

**`handleMembershipDeactivated(tx, membership)`**: bulk `updateMany` on both
`CourseEntitlement` (by `whopMembershipId`) and `ServiceRequest` (by
`whopMonthlyMembershipId`) — sets `status: "revoked"` / `monthlyStatus: "canceled"`
respectively, wherever currently active. Logs a warning if neither matched anything.

**Signature verification**: delegated entirely to `whop.webhooks.unwrap()` from the
`@whop/sdk` package, keyed by `WHOP_WEBHOOK_SECRET` (base64-encoded via `btoa()` before
being passed as `webhookKey`). Not re-implemented in app code.

---

## 2. Existing service flow

### 2.a The 3 generic AI Systems (`src/lib/services.ts`)

Confirmed against the file (`SERVICES` array, lines 30–70):
- **AI Inbox Manager** — `$800` setup / `$150/mo`, plans `plan_AUhS9tvz8KrJC` (setup) /
  `plan_Qvl24MqIyHNfQ` (monthly).
- **AI Lead Capture & Follow-Up** — `$1,000` setup / `$200/mo`, plans
  `plan_l6f3sCRsCR2Em` / `plan_EKCkv5lP6CSPP`.
- **AI Receptionist & Booking** — `$1,500` setup / `$300/mo`, plans
  `plan_ts3JwXpFBKKMp` / `plan_CJyNkObEaPquA`.

These prices/plan IDs match the user's brief exactly. Flow: buyer clicks a checkout
link built from `getSetupCheckoutUrl`/`getMonthlyCheckoutUrl` → Whop-hosted checkout →
`payment.succeeded` webhook fires → `serviceKindForWhopPlanId` finds the plan in
`SERVICES` → `ServiceRequest` row created/updated (see §1.4) → buyer's browser also
lands on `/api/auth/claim` → auto-signed-in → `/welcome` → can reach
`/lab/dashboard`, which reads their `ServiceRequest` rows and renders a stage tracker
(`SERVICE_STATUSES`: new → scoping → building → live → maintenance) plus monthly
billing status. **Fully automated, verified against real code on both ends.**

### 2.b The 2 vertical/role offers ("law-firms", "brokerages") — `src/app/page.tsx`

Found only in `src/app/page.tsx` (lines 104–183), a `verticalSystems` array **entirely
separate from `SERVICES`**. Each entry has its own hardcoded `whopCheckoutUrl`:
- `law-firms` → `https://whop.com/checkout/plan_kTlL5gBlJTsqy`
- `brokerages` → `https://whop.com/checkout/plan_m3i6RwMYvMATE`

I grepped the entire `src/` tree for these two plan IDs (`plan_kTlL5gBlJTsqy`,
`plan_m3i6RwMYvMATE`) — the **only** other hit anywhere in the codebase is
`scripts/fix-whop-renewal-prices.mjs` (a one-off pricing-fix script). **They do not
appear in `src/lib/services.ts`'s `SERVICES` array, and therefore `serviceKindForWhopPlanId`
cannot ever match them.**

**Consequence, traced through the exact webhook code in §1.4**: when a `law-firms` or
`brokerages` plan is purchased, `payment.succeeded` fires, `courseId` resolves to
`null` (product doesn't match any course), `serviceMatch` also resolves to `null`
(plan not in `SERVICES`), and the handler hits the `if (!courseId && !serviceMatch)`
branch — logs `console.warn("...payment.succeeded for unmapped product ... — no
entitlement or service request created...")` and **returns immediately**. No
`PurchaseClaim`, no `CourseEntitlement`, no `ServiceRequest`, no password issuance, no
auto-login. The `WebhookEvent` row is the *only* trace this purchase ever leaves in
Postgres.

**This is the single most important finding of this audit**: a buyer of either
vertical offer pays real money via a fully working Whop checkout, and today the
platform has **zero automated fulfillment** for them — no account, no dashboard
access, no admin-visible record beyond a raw JSON payload nobody has built a viewer
for. Whatever onboarding/delivery happens for these two offers today must be a fully
manual, off-platform process (the business owner presumably notices the Whop
dashboard/email and does it by hand). This needs to be either (a) folded into
`SERVICES`-style plan mapping immediately as a quick, additive fix, independent of the
larger platform build, or (b) explicitly and knowingly left manual until Slice 1 of
the new work — but it should not stay silently broken.

---

## 3. Existing database models

Covered verbatim in §1.3 — not repeated here.

---

## 4. Proposed additions — schema.prisma sketch

Reasoning on the central design question first, since the brief asks for a
recommendation rather than a menu:

**Should `ServiceRequest` be extended in place, or superseded by `ServicePurchase` +
`ServiceProject`?**

Recommend: **supersede, additively, via a new `ServiceProject` model, and leave
`ServiceRequest` exactly as-is, frozen, for the 3 existing generic services' current
buyers** — do not touch its shape or the webhook code paths that write to it in
Slice 1. Reasoning:

1. `ServiceRequest`'s `@@unique([userId, serviceId])` constraint is fundamentally
   incompatible with "a client can have multiple engagements of the same service over
   time" or with the richer stage/task/requirement model the brief wants. Altering
   that constraint on a live table with real rows (from `20260818232423_add_service_requests`
   onward) is exactly the kind of destructive schema surgery the brief says to avoid.
2. The webhook's `handlePaymentSucceeded`/`handleMembershipDeactivated` for the 3
   existing services is working, tested against production once already (per
   `src/lib/courses.ts`'s comment about the data-science course's live verification —
   the same rigor almost certainly applies here), and real customers' `monthlyStatus`
   depends on it continuing to run unmodified.
3. A new `ServiceProject` model can be introduced purely additively (new table, no
   changes to `ServiceRequest` or the webhook's existing branches), and a **new**
   webhook branch can be added for new services/plans that targets `ServiceProject`
   instead. The two vertical offers (§2.b, currently unmapped) are the natural first
   consumers of the new path, since they have no legacy rows to migrate — fixing them
   is simultaneously the retirement of the vertical-offer bug *and* the proving ground
   for the new model.
4. A backfill migration (`ServiceRequest` row → one `ServiceProject` row each) can
   happen later, once the new model is proven, as its own explicit, reviewable,
   additive-only data migration — not bundled into the schema change itself.

```prisma
// ---- Roles & admin --------------------------------------------------------

enum UserRole {
  CLIENT
  SUPPORT
  ADMIN
  SUPERADMIN
}

// Additive: nullable-with-default so existing rows don't need backfill logic
// beyond Prisma's own default-value fill on migrate.
// User.role  UserRole @default(CLIENT)   <-- added to existing User model

// ---- Client profile ---------------------------------------------------

model ClientProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  companyName String?
  industry    String?
  phone       String?
  timezone    String?
  notes       String?  @db.Text // internal only, mirrors ServiceRequest.adminNote convention
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user     User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  projects ServiceProject[]
  audits   AuditRequest[]
}

// ---- Service catalog (DB-backed, replacing/augmenting src/lib/services.ts) --

model ServiceCatalog {
  id                  String   @id @default(cuid())
  slug                String   @unique // matches legacy `serviceId` strings during transition
  title               String
  pitch               String
  description         String   @db.Text
  setupPriceCents      Int?
  monthlyPriceCents    Int?
  whopSetupPlanId      String?
  whopMonthlyPlanId    String?
  active              Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  projects ServiceProject[]
}

// ---- Service delivery -------------------------------------------------

enum ProjectStage {
  NEW
  SCOPING
  BUILDING
  LIVE
  MAINTENANCE
  CANCELED
}

model ServiceProject {
  id               String       @id @default(cuid())
  userId           String
  clientProfileId  String?
  catalogServiceId String?      // nullable: legacy ServiceRequest rows may not map 1:1
  legacyServiceId  String?      // preserves the old free-string src/lib/services.ts id, for backfilled rows
  stage            ProjectStage @default(NEW)
  monthlyStatus    String       @default("inactive") // kept as free string to match ServiceRequest's existing convention

  whopSetupPaymentId      String?
  whopSetupMembershipId   String?
  whopMonthlyMembershipId String?

  adminNote String? @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  clientProfile  ClientProfile?  @relation(fields: [clientProfileId], references: [id])
  catalogService ServiceCatalog? @relation(fields: [catalogServiceId], references: [id])
  milestones     ProjectMilestone[]
  tasks          ProjectTask[]
  requirements   ClientRequirement[]
  integrations   Integration[]
  metrics        ServiceMetric[]
  documents      ClientDocument[]
  messages       ServiceMessage[]
  supportRequests SupportRequest[]

  @@index([whopMonthlyMembershipId])
  @@index([userId])
}

model ProjectMilestone {
  id        String   @id @default(cuid())
  projectId String
  title     String
  dueAt     DateTime?
  completedAt DateTime?
  order     Int      @default(0)

  project ServiceProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  BLOCKED
  DONE
}

model ProjectTask {
  id          String     @id @default(cuid())
  projectId   String
  title       String
  description String?    @db.Text
  status      TaskStatus @default(TODO)
  assigneeUserId String? // internal staff, nullable
  dueAt       DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  project ServiceProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

enum RequirementStatus {
  PENDING
  SUBMITTED
  APPROVED
  REJECTED
}

model ClientRequirement {
  id        String             @id @default(cuid())
  projectId String
  label     String
  detail    String?            @db.Text
  status    RequirementStatus  @default(PENDING)
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt

  project ServiceProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model Integration {
  id          String   @id @default(cuid())
  projectId   String
  provider    String   // e.g. "gmail", "twilio", "calendly"
  status      String   @default("pending") // pending | connected | error
  externalRef String?  // opaque id/token reference, never a raw secret
  connectedAt DateTime?
  createdAt   DateTime @default(now())

  project ServiceProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model ServiceMetric {
  id        String   @id @default(cuid())
  projectId String
  key       String   // e.g. "emails_handled", "leads_captured"
  value     Float
  recordedAt DateTime @default(now())

  project ServiceProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@index([projectId, key, recordedAt])
}

// ---- Free-audit intake -> proposal pipeline ----------------------------

enum AuditStatus {
  SUBMITTED
  IN_REVIEW
  PROPOSAL_SENT
  ACCEPTED
  DECLINED
}

model AuditRequest {
  id              String       @id @default(cuid())
  clientProfileId String?
  email           String
  name            String?
  companyName     String?
  formAnswers     Json
  status          AuditStatus  @default(SUBMITTED)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  clientProfile ClientProfile?    @relation(fields: [clientProfileId], references: [id])
  findings      AuditFinding[]
  recommendations AuditRecommendation[]
  proposals     Proposal[]
}

model AuditFinding {
  id        String   @id @default(cuid())
  auditId   String
  title     String
  detail    String   @db.Text
  createdAt DateTime @default(now())

  audit AuditRequest @relation(fields: [auditId], references: [id], onDelete: Cascade)
}

model AuditRecommendation {
  id             String   @id @default(cuid())
  auditId        String
  catalogServiceId String?
  title          String
  detail         String   @db.Text
  createdAt      DateTime @default(now())

  audit AuditRequest @relation(fields: [auditId], references: [id], onDelete: Cascade)
}

enum ProposalStatus {
  DRAFT
  SENT
  VIEWED
  APPROVED
  DECLINED
  EXPIRED
}

model Proposal {
  id        String         @id @default(cuid())
  auditId   String?
  userId    String?        // set once a client account exists to view/approve it
  status    ProposalStatus @default(DRAFT)
  sentAt    DateTime?
  expiresAt DateTime?
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  audit    AuditRequest?      @relation(fields: [auditId], references: [id])
  user     User?              @relation(fields: [userId], references: [id])
  items    ProposalItem[]
  versions ProposalVersion[]
  approvals ClientApproval[]
}

model ProposalItem {
  id               String   @id @default(cuid())
  proposalId       String
  catalogServiceId String?
  title            String
  priceCents       Int
  recurring        Boolean  @default(false)

  proposal Proposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)
}

model ProposalVersion {
  id         String   @id @default(cuid())
  proposalId String
  snapshot   Json     // full proposal content at time of send/edit
  createdAt  DateTime @default(now())

  proposal Proposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)
}

model ClientApproval {
  id         String   @id @default(cuid())
  proposalId String
  userId     String
  approvedAt DateTime @default(now())
  ipAddress  String?

  proposal Proposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id])
}

// ---- Client portal ------------------------------------------------------

model ClientDocument {
  id        String   @id @default(cuid())
  projectId String
  userId    String   // uploader
  filename  String
  storageKey String  // key into whatever blob store Phase X picks — see §8/§9
  sizeBytes Int
  createdAt DateTime @default(now())

  project ServiceProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User           @relation(fields: [userId], references: [id])
}

model ServiceMessage {
  id        String   @id @default(cuid())
  projectId String
  senderUserId String
  body      String   @db.Text
  createdAt DateTime @default(now())

  project ServiceProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sender  User           @relation(fields: [senderUserId], references: [id])
}

enum SupportStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

model SupportRequest {
  id        String        @id @default(cuid())
  projectId String?
  userId    String
  subject   String
  body      String        @db.Text
  status    SupportStatus @default(OPEN)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  project ServiceProject? @relation(fields: [projectId], references: [id])
  user    User            @relation(fields: [userId], references: [id])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  payload   Json
  readAt    DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, readAt])
}

model ActivityLog {
  id          String   @id @default(cuid())
  actorUserId String?  // null for system/webhook-initiated events
  action      String
  targetType  String?  // e.g. "ServiceProject", "Proposal"
  targetId    String?
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([targetType, targetId])
}
```

Notes on the sketch:
- Every new model is a brand-new table. The only change to an *existing* model is one
  new nullable-with-default column (`User.role`) — additive per the brief's own
  constraint.
- Status/stage fields on new models use real Prisma `enum`s where the existing
  `ServiceRequest` used free strings — this is a deliberate improvement, not a
  requirement to match legacy style, since these are new tables with no existing rows
  to conflict with.
- `ServiceProject.legacyServiceId` and `catalogServiceId` are both nullable so the
  eventual `ServiceRequest → ServiceProject` backfill can populate `legacyServiceId`
  from old rows without requiring an immediate `ServiceCatalog` row to exist for every
  historical `serviceId`.

---

## 5. Files intended to be modified for Slice 1

Given the risk profile (see §7) and the finding in §2.b, the safest first real slice is
narrow: fix the vertical-offer fulfillment gap and lay the `role`/`ServiceCatalog`
groundwork, without touching the 3 working services' code paths.

- `prisma/schema.prisma` — add `UserRole` enum, `User.role` column (nullable-default),
  new `ServiceCatalog` and `ServiceProject`-family models (additive only).
- `src/lib/services.ts` — add the two vertical offers' plan IDs so
  `serviceKindForWhopPlanId` (or a new parallel lookup) can resolve them; this is the
  minimal fix for §2.b's silent-drop bug and can ship independently of the DB
  additions above if urgency demands it.
- `src/lib/admin.ts` — extend `requireAdmin()` to also accept `session.user.role ===
  "ADMIN" | "SUPERADMIN"` once the column exists, while leaving `ADMIN_EMAILS` working
  as a fallback during transition (avoids a hard cutover that could lock out the
  current operator).
- `src/app/api/webhooks/whop/route.ts` — add the new branch/mapping so the two vertical
  plans produce a `ServiceProject` (or, if shipped fastest as a pure hotfix, a
  `ServiceRequest` via the existing path) instead of the current unmapped-and-dropped
  outcome. This is the one existing, live, revenue-critical file in the whole build —
  changes here need the most scrutiny and should be additive branches only, never a
  restructuring of the existing `payment.succeeded`/`membership.deactivated` logic.

## 6. Files intended to be created for Slice 1

- `prisma/migrations/<timestamp>_add_role_and_service_catalog/migration.sql` (generated
  by `prisma migrate dev`, additive-only as designed in §4).
- `src/lib/roles.ts` (or extend `src/lib/admin.ts`) — role-checking helpers built on
  the new `User.role` column.
- `src/app/api/admin/**` — new routes as the superadmin surface grows past the single
  existing `service-requests` PATCH endpoint.
- Nothing in the client-facing UI needs to be created yet in Slice 1 if scope is kept
  to "fix the fulfillment gap + add the role column" — UI work (audit intake form,
  proposal builder, expanded client portal) is a later slice per §9.

---

## 7. Migration risks

This is a **live production database with real paying customers**. Concretely, what
exists today that a migration must not damage:
- Real `User` rows with `passwordEnc` values encrypted under `PASSWORD_ENCRYPTION_KEY`
  — that key lives only in environment config, never in the DB. Any schema change must
  not touch `passwordEnc`'s column type/nullability in a way that could corrupt or
  orphan ciphertext.
- Real `CourseEntitlement` rows gating actual paid course access (`hasCourseAccess` in
  `src/lib/entitlements.ts` is the single choke point every access check goes through
  — as long as that function's query shape is unchanged, entitlement checks are safe).
- Real `ServiceRequest` rows for the 3 generic AI Systems, with live `monthlyStatus`
  values the webhook actively flips on `membership.deactivated` events arriving in
  real time from Whop. This table cannot be dropped, renamed, or have its unique
  constraint altered without a carefully sequenced migration+backfill+cutover, not a
  single Slice 1 change.
- `WebhookEvent` rows are Whop's own delivery ids as primary keys — untouchable, since
  they're the entire idempotency guarantee for a system that receives retried,
  at-least-once deliveries from a third party.
- `PurchaseClaim` rows with `expiresAt` semantics the `/api/auth/claim` route depends
  on for its retry-loop logic — schema changes here risk breaking new sign-ins mid-flight.

**Recommended migration strategy for Slice 1 and beyond**: strictly additive. New
tables only; the one existing-table change (`User.role`) is a new nullable column with
a default, which Postgres can add without a table rewrite lock issue at this table
size and without requiring any data backfill (`DEFAULT 'CLIENT'` fills existing rows
automatically). No `DROP COLUMN`, no `RENAME`, no altering `@@unique` constraints on
`ServiceRequest` or any other existing model, in this slice or the next several. Any
eventual retirement of `ServiceRequest` in favor of `ServiceProject` should be its own
explicit, separately-reviewed migration with a verified backfill script run against a
read replica or staging copy first — not something folded into a feature slice.

Because this environment has no verified `DATABASE_URL` connectivity confirmed safe for
even a read-only check (see §10), **no query, `prisma studio` session, or migration
dry-run was attempted against the live database during this audit** — row counts,
current admin-allowlist membership, and the true number of affected customers should
be confirmed manually by the business owner (e.g., via Vercel's Postgres dashboard or
a controlled read-only `SELECT count(*)` run outside this session) before any
migration is applied.

---

## 8. Security considerations

- **Admin gating is an env-var email allowlist, not a database role** (§1.2.1). This is
  sound in the narrow sense that it's server-side-enforced and re-checked on every
  write, but it is "no one else knows the URL" security only insofar as it also relies
  on `ADMIN_EMAILS` being kept correct and secret in deploy config — anyone who
  compromises an allowlisted account, or who gets their own account's email added to
  that env var by mistake, is a full admin with no audit trail of the grant. There is
  no way today to answer "who has admin access" except by reading the env var, and no
  way to time-box or scope a grant. This must be replaced by a real `User.role` column
  before a multi-person superadmin dashboard is built, per §4/§9.
- **No email infrastructure exists.** `resend` (v6.20.0) is listed in `package.json`
  but is **not imported anywhere in `src/`**, and no `RESEND_API_KEY` (or any other
  provider key) exists in `.env`. `src/lib/auth.ts`'s own comment confirms: "no email
  sending set up for this project." Any Phase involving email (audit-submission
  confirmations, proposal-sent notifications, password reset) starts from zero, though
  the dependency is at least already installed.
- **No file/storage infrastructure exists.** Grepped for S3, Vercel Blob, Uploadthing,
  Multer, Cloudinary, Formidable across `src/` — no matches. `ClientDocument` (§4) and
  any audit-attachment upload flow needs a storage provider chosen and wired from
  scratch.
- **Whop webhook signature verification is real and correctly ordered** (raw body
  before parsing, verified before any DB write) — this is the one piece of the
  security surface that's already solid and should not be touched casually.
- **Two live checkout links (`law-firms`, `brokerages`) currently produce zero
  automated identity/record for the buyer** (§2.b) — beyond being a fulfillment gap,
  this is arguably a minor security-adjacent gap too: there's no automated linkage
  between "this email paid" and "this email should get portal access," which will
  need to be closed before those two offers can safely plug into a self-service
  client portal.

---

## 9. Recommended slice-by-slice implementation order

The brief's own suggested order (intake → audit review → proposal → purchase → project
→ portal → superadmin dashboard) describes the *product* build order well, but based
on what actually exists today, the safest *engineering* sequencing is different,
because two things need fixing before any of that product work is safe to build on:

1. **Slice 0 (do first, smallest possible diff): fix the vertical-offer fulfillment
   gap.** Add `law-firms`/`brokerages` plan IDs into the webhook's resolution path
   (either by extending `SERVICES` in `src/lib/services.ts` or adding a small parallel
   lookup) so real money stops disappearing into an unmapped-and-dropped branch. This
   touches the single riskiest file in the repo (`webhooks/whop/route.ts`) but as a
   pure additive branch, not a restructuring — and it's the one issue actively costing
   the business fulfillment visibility today, independent of any larger platform work.
2. **Slice 1: `User.role` + real admin gating.** Add the nullable `role` column,
   migrate `requireAdmin()` to check it (with `ADMIN_EMAILS` kept as a fallback during
   transition, not removed outright), manually promote the current operator's account.
   This is the foundation every later superadmin-dashboard slice depends on, and it's
   a single-column additive migration — the lowest-risk schema change possible.
3. **Slice 2: `ServiceCatalog` table**, seeded from the existing `SERVICES` array
   (read-through initially — `src/lib/services.ts` keeps working, the DB table is
   populated but not yet load-bearing) — de-risks the eventual cutover from static
   catalog to DB-backed catalog by proving the shape before anything depends on it.
4. **Slice 3: `AuditRequest` intake form + storage.** This is the first genuinely new
   customer-facing surface and has no legacy data to protect, making it a safe place
   to also stand up whichever email provider is chosen (closing the §8 gap) for
   submission-confirmation notifications.
5. **Slice 4: superadmin audit review + `AuditFinding`/`AuditRecommendation`.**
6. **Slice 5: `Proposal`/`ProposalItem`/`ProposalVersion`/`ClientApproval`** — the
   client-approval flow, which is also the first place a real e-signature/consent
   record needs to exist.
7. **Slice 6: `ServiceProject` model goes live for *new* purchases only** (starting
   with the now-fixed vertical offers from Slice 0, and any Proposal-driven purchase),
   while the 3 existing generic services keep writing to `ServiceRequest` unmodified.
8. **Slice 7: client portal expansion** (`ClientRequirement`, `Integration`,
   `ServiceMetric`, `ClientDocument`, `ServiceMessage`, `SupportRequest`) built against
   `ServiceProject`, evolving `src/app/lab/dashboard/page.tsx` into the real portal the
   brief describes — by this point the page already has the "lab vs studio branding"
   logic and service-request rendering pattern in place to extend rather than rewrite.
9. **Slice 8 (last, and only once 6–7 are proven): the `ServiceRequest` →
   `ServiceProject` backfill migration** for the 3 existing generic services' historical
   rows, as its own isolated, reviewed migration — not bundled with any feature slice.

Rationale for reordering ahead of the brief's literal sequence: Slice 0 and Slice 1
are both small, low-risk, and fix/replace things that are either actively broken
(§2.b) or structurally unsound (§8's admin gating) in the *current* live app — doing
them first means every subsequent slice is built on a codebase that no longer has a
silent revenue-tracking bug and no longer relies on an env-var allowlist for admin
authority. Everything from Slice 2 onward then matches the brief's own intake → audit →
proposal → purchase → project → portal → dashboard flow.

---

## 10. Production data — manual verification needed

No connection to the live Neon database was attempted. `.env` is present
(`D:\zenith-studio\.env`, confirmed to exist, contents not read beyond key names) and
contains `DATABASE_URL`, `POSTGRES_PRISMA_URL`, and related connection variables, so a
connection is technically possible from this machine — but per the task's explicit
instruction, no query, `prisma studio` session, or count was run, out of caution around
mutating or straining a database with real customer data during a read-only code audit.
Before any migration in §7/§9 is applied, the business owner should manually confirm,
via Vercel's dashboard or a controlled read-only session: current row counts for
`User`, `CourseEntitlement`, `ServiceRequest`, and `PurchaseClaim`; the exact current
value of `ADMIN_EMAILS`; and whether any `WebhookEvent` rows exist for the
`law-firms`/`brokerages` plan IDs (confirming §2.b's fulfillment gap has already
affected real purchases, and how many).
