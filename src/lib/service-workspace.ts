import { db } from "@/lib/db";

/* Client-facing service project workspace (Slice 7 of the service-platform
   build, 2026-08-28). This is the first page in the build where one signed-in
   client could plausibly try to view or write another client's data by
   guessing/changing an id in the URL — every read AND every write below
   scopes its query to `{ id: projectId, userId }` in a single query, never
   "fetch by id, then check ownership in application code" (the common IDOR
   bug pattern). A mismatch (wrong id, or someone else's project) always
   resolves to the same "not found" outcome the caller turns into a 404 —
   never a distinguishable "this belongs to someone else" response. */

/** Single scoped query — used by the page's own render AND (independently,
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

// Client-safe integration status labels only — literally the four/five words
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
    to SUBMITTED. Re-verifies project ownership independently — never trusts
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
