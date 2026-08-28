import { db } from "@/lib/db";
import { getService } from "@/lib/services";
import type { ProjectStage, SupportStatus } from "@prisma/client";

/* Admin-side ServiceProject operations (Slice 4 of the business command
   center, 2026-08-28: /admin/projects). Every write here re-checks
   requireAdmin() independently in its own caller (this file does not call
   requireAdmin itself — callers are responsible, matching
   service-requests-admin.ts's existing convention) and validates every
   enum-typed input against the real Prisma enum values, never trusting a
   raw client-submitted string. */

export const PROJECT_STAGES: ProjectStage[] = [
  "NEW",
  "SCOPING",
  "ONBOARDING",
  "BUILDING",
  "QA",
  "LIVE",
  "MAINTENANCE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
];

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
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

export function isProjectStage(value: string): value is ProjectStage {
  return (PROJECT_STAGES as string[]).includes(value);
}

export const SUPPORT_STATUSES: SupportStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "RESOLVED", "CLOSED"];

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_CLIENT: "Waiting on client",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export function isSupportStatus(value: string): value is SupportStatus {
  return (SUPPORT_STATUSES as string[]).includes(value);
}

/** Resolves the display label for a project's service, reusing the same
    catalogService-title-first / sourceServiceId-fallback pattern already
    used by the client-facing workspace page and client-directory.ts. */
export function projectServiceLabel(project: {
  title: string;
  sourceServiceId: string | null;
  catalogService?: { title: string } | null;
}): string {
  if (project.catalogService?.title) return project.catalogService.title;
  if (project.sourceServiceId) return getService(project.sourceServiceId)?.title ?? project.sourceServiceId;
  return project.title;
}

export type ProjectListRow = {
  id: string;
  title: string;
  stage: ProjectStage;
  createdAt: Date;
  targetLaunchAt: Date | null;
  serviceLabel: string;
  clientName: string;
  clientEmail: string;
  assigneeName: string | null;
  completionPct: number | null; // null when there are no milestones at all
  outstandingRequirements: number;
  openSupportCount: number;
  lastClientActivityAt: Date | null;
  latestMessagePreview: string | null;
};

/** List query backing /admin/projects. stageFilter, when given, must
    already be a validated ProjectStage — this function does not re-validate
    it (the page route validates the ?stage= query param before calling
    in). completionPct/outstandingRequirements/openSupportCount/last-activity
    are all derived from real included rows, never invented. */
export async function listServiceProjectsForAdmin(stageFilter?: ProjectStage): Promise<ProjectListRow[]> {
  const projects = await db.serviceProject.findMany({
    where: stageFilter ? { stage: stageFilter } : undefined,
    include: {
      user: { select: { name: true, email: true } },
      catalogService: { select: { title: true } },
      assignee: { select: { name: true, email: true } },
      milestones: { select: { completedAt: true } },
      requirements: { select: { status: true } },
      supportRequests: { select: { status: true, createdAt: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((p) => {
    const totalMilestones = p.milestones.length;
    const completedMilestones = p.milestones.filter((m) => m.completedAt).length;
    const completionPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : null;

    const outstandingRequirements = p.requirements.filter(
      (r) => r.status === "MISSING" || r.status === "REJECTED"
    ).length;

    const openSupportCount = p.supportRequests.filter((s) =>
      ["OPEN", "IN_PROGRESS", "WAITING_CLIENT"].includes(s.status)
    ).length;

    const activityTimestamps: number[] = [];
    for (const s of p.supportRequests) activityTimestamps.push(s.createdAt.getTime());
    if (p.messages[0]) activityTimestamps.push(p.messages[0].createdAt.getTime());
    const lastClientActivityAt = activityTimestamps.length ? new Date(Math.max(...activityTimestamps)) : null;

    return {
      id: p.id,
      title: p.title,
      stage: p.stage,
      createdAt: p.createdAt,
      targetLaunchAt: p.targetLaunchAt,
      serviceLabel: projectServiceLabel(p),
      clientName: p.user.name || p.user.email,
      clientEmail: p.user.email,
      assigneeName: p.assignee ? p.assignee.name || p.assignee.email : null,
      completionPct,
      outstandingRequirements,
      openSupportCount,
      lastClientActivityAt,
      latestMessagePreview: p.messages[0]?.body ?? null,
    };
  });
}

/** Full detail fetch backing /admin/projects/[id]. Returns null for a
    nonexistent id — the page turns that into a 404. */
export async function getServiceProjectForAdmin(id: string) {
  return db.serviceProject.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      catalogService: { select: { title: true, slug: true } },
      proposal: { select: { id: true } },
      assignee: { select: { id: true, name: true, email: true } },
      milestones: { orderBy: { order: "asc" } },
      requirements: { orderBy: { order: "asc" } },
      integrations: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true, email: true } } } },
      supportRequests: { orderBy: { createdAt: "desc" } },
    },
  });
}

/** Admins available for the assignee picker — role:ADMIN users only, per
    the brief ("in practice only role: ADMIN users would sensibly be
    assigned, but don't hard-constrain the FK itself"). */
export async function listAssignableAdmins() {
  return db.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true },
    orderBy: { email: "asc" },
  });
}

type WriteResult = { ok: true } | { ok: false; error: string };

/** Validates the new stage against the real ProjectStage enum before
    writing — never trusts a raw client-submitted string. Caller must have
    already re-checked requireAdmin(). */
export async function updateProjectStage(id: string, stage: string): Promise<WriteResult> {
  if (!isProjectStage(stage)) return { ok: false, error: `invalid stage "${stage}"` };
  const existing = await db.serviceProject.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: "not_found" };
  await db.serviceProject.update({ where: { id }, data: { stage } });
  return { ok: true };
}

export async function updateProjectAdminNote(id: string, adminNote: string): Promise<WriteResult> {
  if (typeof adminNote !== "string" || adminNote.length > 5000) {
    return { ok: false, error: "adminNote must be a string under 5000 characters" };
  }
  const existing = await db.serviceProject.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: "not_found" };
  await db.serviceProject.update({ where: { id }, data: { adminNote } });
  return { ok: true };
}

/** assigneeUserId/targetLaunchAt are both optional/nullable — an empty
    string clears the field. assigneeUserId, when non-empty, is checked
    against a real existing role:ADMIN user id before writing. */
export async function updateProjectOps(
  id: string,
  patch: { assigneeUserId?: string; targetLaunchAt?: string }
): Promise<WriteResult> {
  const existing = await db.serviceProject.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: "not_found" };

  const data: { assigneeUserId?: string | null; targetLaunchAt?: Date | null } = {};

  if (patch.assigneeUserId !== undefined) {
    const trimmed = patch.assigneeUserId.trim();
    if (!trimmed) {
      data.assigneeUserId = null;
    } else {
      const admin = await db.user.findFirst({ where: { id: trimmed, role: "ADMIN" }, select: { id: true } });
      if (!admin) return { ok: false, error: "assignee must be a real admin user" };
      data.assigneeUserId = admin.id;
    }
  }

  if (patch.targetLaunchAt !== undefined) {
    const trimmed = patch.targetLaunchAt.trim();
    if (!trimmed) {
      data.targetLaunchAt = null;
    } else {
      const parsed = new Date(trimmed);
      if (Number.isNaN(parsed.getTime())) return { ok: false, error: "invalid targetLaunchAt" };
      data.targetLaunchAt = parsed;
    }
  }

  if (Object.keys(data).length === 0) return { ok: false, error: "nothing to update" };

  await db.serviceProject.update({ where: { id }, data });
  return { ok: true };
}

/** Posts an admin reply into the same ServiceMessage thread the client sees
    at /lab/dashboard/services/[projectId]. senderUserId must be the calling
    admin's own session.user.id — caller is responsible for that. */
export async function postAdminMessage(projectId: string, senderUserId: string, body: string): Promise<WriteResult> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "empty" };
  const existing = await db.serviceProject.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!existing) return { ok: false, error: "not_found" };

  await db.serviceMessage.create({
    data: { projectId, senderUserId, senderRole: "ADMIN", body: trimmed },
  });
  return { ok: true };
}

/** Validates the new status against the real SupportStatus enum before
    writing. supportRequestId is checked to actually belong to this
    project. */
export async function updateSupportRequestStatusForAdmin(
  projectId: string,
  supportRequestId: string,
  status: string
): Promise<WriteResult> {
  if (!isSupportStatus(status)) return { ok: false, error: `invalid status "${status}"` };
  const existing = await db.supportRequest.findFirst({
    where: { id: supportRequestId, projectId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not_found" };
  await db.supportRequest.update({ where: { id: existing.id }, data: { status } });
  return { ok: true };
}
