import { db } from "@/lib/db";
import { encryptPassword } from "@/lib/password";
import { testMailConnection } from "@/lib/mail-imap";
import { approveInboxDraft, rejectInboxDraft } from "@/lib/inbox-manager";
import { getWhopClient } from "@/lib/whop";
import { toE164UsNumber } from "@/lib/vapi-provision";
import { provisionReceptionistIfNeeded } from "@/lib/receptionist-provisioning";
import { provisionTextBackIfNeeded } from "@/lib/text-back-provisioning";
import { provisionLeadCaptureIfNeeded } from "@/lib/lead-capture-provisioning";
import { auditPolicyDocument, auditPolicyPdf } from "@/lib/insurance-document-audit";
import { RECEPTIONIST_REQUIREMENTS, TEXT_BACK_REQUIREMENTS, LEAD_CAPTURE_REQUIREMENTS, BROKERAGE_REQUIREMENTS } from "@/lib/service-projects";
import type { MailProvider } from "@prisma/client";

/* Client-facing service project workspace (Slice 7 of the service-platform
   build, 2026-08-28). This is the first page in the build where one signed-in
   client could plausibly try to view or write another client's data by
   guessing/changing an id in the URL - every read AND every write below
   scopes its query to `{ id: projectId, userId }` in a single query, never
   "fetch by id, then check ownership in application code" (the common IDOR
   bug pattern). A mismatch (wrong id, or someone else's project) always
   resolves to the same "not found" outcome the caller turns into a 404 -
   never a distinguishable "this belongs to someone else" response. */

/** Single scoped query - used by the page's own render AND (independently,
    fresh) by every server action below. Never trust that reaching an action
    means the page's ownership check already passed. */
export async function getOwnedServiceProject(projectId: string, userId: string) {
  return db.serviceProject.findFirst({
    where: { id: projectId, userId },
    include: {
      catalogService: { select: { title: true, slug: true } },
      milestones: { orderBy: { order: "asc" } },
      requirements: { orderBy: { order: "asc" } },
      integrations: { orderBy: { createdAt: "asc" } },
      metrics: { orderBy: { recordedAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "asc" } },
      supportRequests: { orderBy: { createdAt: "desc" } },
      oauthConnections: { orderBy: { createdAt: "asc" } },
      timeEntries: { orderBy: { entryDate: "desc" } },
      leads: { orderBy: { createdAt: "desc" } },
      mailConnections: { orderBy: { createdAt: "asc" } },
      inboxDrafts: { orderBy: { createdAt: "desc" } },
    },
  });
}

export const PROJECT_STAGE_ORDER = [
  "NEW",
  "SCOPING",
  "ONBOARDING",
  "BUILDING",
  "QA",
  "LIVE",
  "MAINTENANCE",
] as const;

export const PROJECT_STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  SCOPING: "Scoping",
  ONBOARDING: "Onboarding",
  BUILDING: "Building",
  QA: "QA",
  LIVE: "Live",
  MAINTENANCE: "Maintenance",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Client-safe integration status labels only - literally the four/five words
// the business brief specifies. Never render `provider` beyond its own name,
// and never render `externalRef` (or anything credential-shaped) to the client.
export const INTEGRATION_STATUS_LABELS: Record<string, string> = {
  NOT_CONNECTED: "Not connected",
  REQUESTED: "Action required",
  CONNECTED: "Connected",
  ERROR: "Connection issue",
  DISCONNECTED: "Disconnected",
};

export type RequirementSubmitResult = { ok: true } | { ok: false; error: string };

/** Client submits detail text for a MISSING/REJECTED requirement, flipping it
    to SUBMITTED. Re-verifies project ownership independently - never trusts
    the caller's page render already checked it. Refuses to touch an
    APPROVED/UNDER_REVIEW/SUBMITTED requirement (those are not client-writable
    from this action). */
export async function submitClientRequirement(
  projectId: string,
  userId: string,
  requirementId: string,
  detail: string
): Promise<RequirementSubmitResult> {
  const project = await db.serviceProject.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) return { ok: false, error: "not_found" };

  const requirement = await db.clientRequirement.findFirst({
    where: { id: requirementId, projectId: project.id },
    select: { id: true, status: true },
  });
  if (!requirement) return { ok: false, error: "not_found" };
  if (requirement.status !== "MISSING" && requirement.status !== "REJECTED") {
    return { ok: false, error: "not_writable" };
  }

  const trimmed = detail.trim();
  if (!trimmed) return { ok: false, error: "empty" };

  await db.clientRequirement.update({
    where: { id: requirement.id },
    data: { detail: trimmed, status: "SUBMITTED" },
  });
  return { ok: true };
}

/** The Billing Clerk's "you approve every entry" promise, enforced here:
    only the project's own owner (the attorney/partner) can approve or
    reject a draft, re-verified independently in one scoped query: the
    same IDOR-safe pattern as every other action in this file. Refuses
    anything not currently DRAFT (already-reviewed entries aren't
    re-reviewable from here). */
export async function approveOwnedTimeEntry(projectId: string, userId: string, entryId: string): Promise<RequirementSubmitResult> {
  const entry = await db.timeEntry.findFirst({
    where: { id: entryId, projectId, status: "DRAFT", project: { userId } },
    select: { id: true },
  });
  if (!entry) return { ok: false, error: "not_found" };
  await db.timeEntry.update({
    where: { id: entry.id },
    data: { status: "APPROVED", reviewedByUserId: userId, reviewedAt: new Date() },
  });
  return { ok: true };
}

export async function rejectOwnedTimeEntry(projectId: string, userId: string, entryId: string): Promise<RequirementSubmitResult> {
  const entry = await db.timeEntry.findFirst({
    where: { id: entryId, projectId, status: "DRAFT", project: { userId } },
    select: { id: true },
  });
  if (!entry) return { ok: false, error: "not_found" };
  await db.timeEntry.update({
    where: { id: entry.id },
    data: { status: "REJECTED", reviewedByUserId: userId, reviewedAt: new Date() },
  });
  return { ok: true };
}

/** Posts a new client message. Re-verifies ownership independently. */
export async function postClientMessage(projectId: string, userId: string, body: string): Promise<RequirementSubmitResult> {
  const project = await db.serviceProject.findFirst({ where: { id: projectId, userId }, select: { id: true } });
  if (!project) return { ok: false, error: "not_found" };

  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "empty" };

  await db.serviceMessage.create({
    data: { projectId: project.id, senderUserId: userId, senderRole: "CLIENT", body: trimmed },
  });
  return { ok: true };
}

/** Creates a new support request tied to this project. Re-verifies
    ownership independently. */
export async function createClientSupportRequest(
  projectId: string,
  userId: string,
  subject: string,
  body: string,
  priority: string
): Promise<RequirementSubmitResult> {
  const project = await db.serviceProject.findFirst({ where: { id: projectId, userId }, select: { id: true } });
  if (!project) return { ok: false, error: "not_found" };

  const trimmedSubject = subject.trim();
  const trimmedBody = body.trim();
  if (!trimmedSubject || !trimmedBody) return { ok: false, error: "empty" };

  const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  const safePriority = validPriorities.includes(priority) ? priority : "MEDIUM";

  await db.supportRequest.create({
    data: {
      projectId: project.id,
      userId,
      subject: trimmedSubject,
      body: trimmedBody,
      priority: safePriority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    },
  });
  return { ok: true };
}

/** Connects a client's own Gmail (personal) or Yahoo mailbox for AI Inbox
    Manager via an app password (see mail-imap.ts for why this, not OAuth).
    Verifies the credential actually logs in BEFORE saving anything - never
    store a password we haven't confirmed works. Re-verifies ownership
    independently, same pattern as every other action here. */
export async function connectMailbox(
  projectId: string,
  userId: string,
  provider: string,
  emailAddress: string,
  appPassword: string
): Promise<RequirementSubmitResult> {
  const project = await db.serviceProject.findFirst({ where: { id: projectId, userId }, select: { id: true } });
  if (!project) return { ok: false, error: "not_found" };

  if (provider !== "GMAIL" && provider !== "YAHOO" && provider !== "ZOHO") return { ok: false, error: "unsupported_provider" };
  const email = emailAddress.trim().toLowerCase();
  const password = appPassword.trim();
  if (!email || !password) return { ok: false, error: "empty" };

  const testResult = await testMailConnection({ provider, emailAddress: email, appPassword: password });
  if (!testResult.ok) return { ok: false, error: testResult.error };

  await db.mailConnection.upsert({
    where: { projectId_provider_emailAddress: { projectId: project.id, provider: provider as MailProvider, emailAddress: email } },
    update: { encryptedAppPassword: encryptPassword(password), status: "CONNECTED", lastError: null },
    create: {
      projectId: project.id,
      provider: provider as MailProvider,
      emailAddress: email,
      encryptedAppPassword: encryptPassword(password),
    },
  });
  return { ok: true };
}

/** The Inbox Manager's "you approve every reply" promise: only the
    project's own owner can approve or reject a draft, re-verified
    independently before handing off to inbox-manager.ts, which does the
    actual SMTP send. */
export async function approveOwnedInboxDraft(projectId: string, userId: string, draftId: string): Promise<RequirementSubmitResult> {
  const draft = await db.inboxDraft.findFirst({
    where: { id: draftId, projectId, status: "DRAFT", project: { userId } },
    select: { id: true },
  });
  if (!draft) return { ok: false, error: "not_found" };
  return approveInboxDraft(draft.id, userId);
}

/** Cancels the project's real Whop subscription at the end of the current
    billing period (not immediately - the client keeps access through what
    they already paid for, same as most SaaS "cancel plan" buttons).
    whopMonthlyMembershipId is only set for webhook-sourced projects (see
    the schema comment on ServiceProject) - a proposal-based/manually
    invoiced project has nothing to cancel through this button, so it's
    hidden entirely rather than shown disabled. */
export async function cancelOwnedMembership(projectId: string, userId: string): Promise<RequirementSubmitResult> {
  const project = await db.serviceProject.findFirst({
    where: { id: projectId, userId },
    select: { whopMonthlyMembershipId: true },
  });
  if (!project) return { ok: false, error: "not_found" };
  if (!project.whopMonthlyMembershipId) return { ok: false, error: "No active subscription found to cancel." };

  try {
    await getWhopClient().memberships.cancel(project.whopMonthlyMembershipId, { cancellation_mode: "at_period_end" });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Cancellation failed." };
  }
  return { ok: true };
}

/** Self-serve activation: the client fills in real, validated fields
    (instead of free-text ClientRequirement answers an admin has to
    review) and provisioning fires immediately in the same request - no
    admin approval click in between. Writes straight to APPROVED because
    validation here (phone number shape, non-empty fields) replaces the
    human review that free-text answers needed; provisionReceptionistIfNeeded
    still re-checks everything itself and is idempotent (no-ops if a vapi
    Integration already exists), so calling it from here is safe even if
    the client submits twice. */
export async function activateReceptionist(
  projectId: string,
  userId: string,
  fields: { businessName: string; hours: string; faqText: string; fallbackNumber: string }
): Promise<RequirementSubmitResult> {
  const project = await db.serviceProject.findFirst({ where: { id: projectId, userId }, select: { id: true } });
  if (!project) return { ok: false, error: "not_found" };

  const businessName = fields.businessName.trim();
  const hours = fields.hours.trim();
  const faqText = fields.faqText.trim();
  if (!businessName || !hours || !faqText) return { ok: false, error: "All fields are required." };
  const fallbackNumber = toE164UsNumber(fields.fallbackNumber);
  if (!fallbackNumber) return { ok: false, error: "That fallback phone number doesn't look valid." };

  const values: [string, string][] = [
    [RECEPTIONIST_REQUIREMENTS[0].label, businessName],
    [RECEPTIONIST_REQUIREMENTS[1].label, hours],
    [RECEPTIONIST_REQUIREMENTS[2].label, faqText],
    [RECEPTIONIST_REQUIREMENTS[3].label, fallbackNumber],
  ];
  for (const [label, detail] of values) {
    await db.clientRequirement.updateMany({ where: { projectId: project.id, label }, data: { detail, status: "APPROVED" } });
  }

  return provisionReceptionistIfNeeded(project.id);
}

/** Same self-serve pattern as activateReceptionist, for the law-firms
    bundle's Missed Call Text-Back role (its only field is a business
    name - see TEXT_BACK_REQUIREMENTS). */
export async function activateTextBack(projectId: string, userId: string, fields: { businessName: string }): Promise<RequirementSubmitResult> {
  const project = await db.serviceProject.findFirst({ where: { id: projectId, userId }, select: { id: true } });
  if (!project) return { ok: false, error: "not_found" };

  const businessName = fields.businessName.trim();
  if (!businessName) return { ok: false, error: "Business name is required." };

  await db.clientRequirement.updateMany({
    where: { projectId: project.id, label: TEXT_BACK_REQUIREMENTS[0].label },
    data: { detail: businessName, status: "APPROVED" },
  });

  return provisionTextBackIfNeeded(project.id);
}

/** Same self-serve pattern as activateReceptionist/activateTextBack, for
    AI Lead Capture and brokerages' Inside Sales Agent role - one function
    for both, since provisionLeadCaptureIfNeeded itself already treats them
    identically and only the requirement labels (client-facing wording)
    differ per service, matching that file's own switch. */
export async function activateLeadCapture(
  projectId: string,
  userId: string,
  fields: { businessName: string; qualificationRules: string; notifyEmail: string }
): Promise<RequirementSubmitResult> {
  const project = await db.serviceProject.findFirst({
    where: { id: projectId, userId },
    select: { id: true, sourceServiceId: true },
  });
  if (!project) return { ok: false, error: "not_found" };

  const requirementSet =
    project.sourceServiceId === "ai-lead-capture"
      ? LEAD_CAPTURE_REQUIREMENTS
      : project.sourceServiceId === "brokerages"
        ? BROKERAGE_REQUIREMENTS
        : null;
  if (!requirementSet) return { ok: false, error: "not_applicable" };

  const businessName = fields.businessName.trim();
  const qualificationRules = fields.qualificationRules.trim();
  const notifyEmail = fields.notifyEmail.trim().toLowerCase();
  if (!businessName || !qualificationRules) return { ok: false, error: "All fields are required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) return { ok: false, error: "That notify email doesn't look valid." };

  const values: [string, string][] = [
    [requirementSet[0].label, businessName],
    [requirementSet[1].label, qualificationRules],
    [requirementSet[2].label, notifyEmail],
  ];
  for (const [label, detail] of values) {
    await db.clientRequirement.updateMany({ where: { projectId: project.id, label }, data: { detail, status: "APPROVED" } });
  }

  return provisionLeadCaptureIfNeeded(project.id);
}

/** Self-serve CRM connection for Insurance's CRM & Logging agent: the
    client pastes their own CRM's inbound webhook URL (most CRMs expose
    one under their own integrations/Zapier settings) instead of granting
    us any credential. No provisioning call needed here (unlike the
    others) - this just saves the URL as a CONNECTED "crm" Integration;
    insurance-crm-log.ts reads it back at forward-time. http:// is
    rejected, not just non-URLs, since a lead's name/phone/email would
    otherwise cross the wire in plaintext. */
export async function activateCrmWebhook(projectId: string, userId: string, fields: { webhookUrl: string }): Promise<RequirementSubmitResult> {
  const project = await db.serviceProject.findFirst({ where: { id: projectId, userId }, select: { id: true } });
  if (!project) return { ok: false, error: "not_found" };

  const webhookUrl = fields.webhookUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(webhookUrl);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }
  if (parsed.protocol !== "https:") return { ok: false, error: "The webhook URL must start with https://." };

  const existing = await db.integration.findFirst({ where: { projectId: project.id, provider: "crm" }, select: { id: true } });
  if (existing) {
    await db.integration.update({ where: { id: existing.id }, data: { status: "CONNECTED", connectedAt: new Date(), config: { webhookUrl } } });
  } else {
    await db.integration.create({
      data: { projectId: project.id, provider: "crm", status: "CONNECTED", connectedAt: new Date(), config: { webhookUrl } },
    });
  }

  return { ok: true };
}

/** Runs Insurance Document Audit for the client directly - no activation
    step, this is a tool the client uses on demand each time they have a
    document, not a one-time setup like the other agents. Accepts either a
    pasted-text policy/ACORD form/loss run or an uploaded PDF (read
    natively by Claude, see anthropic.ts - no manual copy-paste required,
    the intentionally lowest-manual-work path for a real client). Only the
    extracted summary is persisted, never the PDF bytes: file storage is a
    real infra decision this project has explicitly deferred (see
    ClientDocument's own schema comment). */
export async function runDocumentAudit(
  projectId: string,
  userId: string,
  input: { filename: string; pdfBase64?: string; rawText?: string; sizeBytes?: number }
): Promise<RequirementSubmitResult> {
  const project = await db.serviceProject.findFirst({ where: { id: projectId, userId }, select: { id: true } });
  if (!project) return { ok: false, error: "not_found" };

  const filename = input.filename.trim() || "Untitled document";
  const result = input.pdfBase64
    ? await auditPolicyPdf(input.pdfBase64)
    : await auditPolicyDocument(input.rawText ?? "");
  if (!result.ok) return { ok: false, error: result.error };

  await db.clientDocument.create({
    data: { projectId: project.id, userId, filename, kind: "REPORT", sizeBytes: input.sizeBytes ?? null, summary: result.summary },
  });

  return { ok: true };
}

export async function rejectOwnedInboxDraft(projectId: string, userId: string, draftId: string): Promise<RequirementSubmitResult> {
  const draft = await db.inboxDraft.findFirst({
    where: { id: draftId, projectId, status: "DRAFT", project: { userId } },
    select: { id: true },
  });
  if (!draft) return { ok: false, error: "not_found" };
  return rejectInboxDraft(draft.id, userId);
}
