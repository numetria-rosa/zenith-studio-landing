import { db } from "@/lib/db";
import { projectServiceLabel } from "@/lib/service-projects-admin";
import type { TaskPriority, TaskStatus } from "@prisma/client";

/* Internal admin Task CRUD (Slice 6 of the business command center,
   2026-08-28: /admin/tasks). Every write here re-checks requireAdmin()
   independently in its own caller (this file does not call requireAdmin
   itself — callers are responsible, matching service-projects-admin.ts's
   existing convention) and validates every enum-typed / FK-typed input
   before writing, never trusting a raw client-submitted string or id.
   Shared by both /admin/tasks and the "Internal tasks" section on
   /admin/projects/[id], so the two never drift apart. */

export const TASK_PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export function isTaskPriority(value: string): value is TaskPriority {
  return (TASK_PRIORITIES as string[]).includes(value);
}

export const TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  DONE: "Done",
};

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as string[]).includes(value);
}

/** Admins available for the assignee picker — role:ADMIN users only,
    reusing service-projects-admin.ts's listAssignableAdmins so the picker
    stays identical everywhere it appears. */
export async function listAssignableAdmins() {
  return db.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true },
    orderBy: { email: "asc" },
  });
}

/** Lightweight project picker source for the task create/edit forms — id +
    a human label, not the full admin project row shape. */
export async function listProjectsForTaskPicker() {
  const projects = await db.serviceProject.findMany({
    select: {
      id: true,
      title: true,
      sourceServiceId: true,
      catalogService: { select: { title: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return projects.map((p) => ({
    id: p.id,
    label: `${projectServiceLabel(p)} · ${p.user.name || p.user.email}`,
  }));
}

export type TaskListRow = {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: Date | null;
  createdAt: Date;
  completedAt: Date | null;
  isOverdue: boolean;
  projectId: string | null;
  projectLabel: string | null;
  clientLabel: string | null;
  assigneeUserId: string | null;
  assigneeName: string | null;
};

export type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeUserId?: string; // "" means "unassigned"
  overdueOnly?: boolean;
  search?: string;
};

/** List query backing /admin/tasks. All filters are applied as real Prisma
    where clauses, not fetch-everything-and-filter-in-JS — sort is
    overdue-first, then soonest-due, then newest-created, matching the
    brief's own "show overdue" emphasis. Given the current near-zero data
    volume, the overdue-first ordering below is computed by pulling once and
    sorting in memory rather than a raw SQL CASE ordering — noted as a
    shortcut, not a hard requirement at this scale. */
export async function listTasksForAdmin(filters: TaskFilters = {}): Promise<TaskListRow[]> {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assigneeUserId !== undefined) {
    where.assigneeUserId = filters.assigneeUserId === "" ? null : filters.assigneeUserId;
  }
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.overdueOnly) {
    where.dueAt = { lt: new Date() };
    where.status = { not: "DONE" };
    // overdueOnly overrides an explicit status filter (overdue is
    // meaningless for a DONE task) — deliberate, not a bug.
    if (filters.status && filters.status !== "DONE") where.status = filters.status;
  }

  const tasks = await db.task.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          title: true,
          sourceServiceId: true,
          catalogService: { select: { title: true } },
          user: { select: { name: true, email: true } },
        },
      },
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const now = Date.now();
  const rows: TaskListRow[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    dueAt: t.dueAt,
    createdAt: t.createdAt,
    completedAt: t.completedAt,
    isOverdue: !!t.dueAt && t.dueAt.getTime() < now && t.status !== "DONE",
    projectId: t.project?.id ?? null,
    projectLabel: t.project ? projectServiceLabel(t.project) : null,
    clientLabel: t.project ? t.project.user.name || t.project.user.email : null,
    assigneeUserId: t.assignee ? t.assigneeUserId : null,
    assigneeName: t.assignee ? t.assignee.name || t.assignee.email : null,
  }));

  return rows.sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    // Soonest-due next (nulls last), then newest-created.
    if (a.dueAt && b.dueAt) return a.dueAt.getTime() - b.dueAt.getTime();
    if (a.dueAt && !b.dueAt) return -1;
    if (!a.dueAt && b.dueAt) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

/** Tasks for one project's detail page — same shape as the list rows minus
    the project/client fields, which are redundant on that page. */
export async function listTasksForProject(projectId: string) {
  const tasks = await db.task.findMany({
    where: { projectId },
    include: { assignee: { select: { name: true, email: true } } },
    orderBy: [{ createdAt: "desc" }],
  });
  const now = Date.now();
  return tasks
    .map((t) => ({
      ...t,
      isOverdue: !!t.dueAt && t.dueAt.getTime() < now && t.status !== "DONE",
      assigneeName: t.assignee ? t.assignee.name || t.assignee.email : null,
    }))
    .sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      if (a.dueAt && b.dueAt) return a.dueAt.getTime() - b.dueAt.getTime();
      if (a.dueAt && !b.dueAt) return -1;
      if (!a.dueAt && b.dueAt) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
}

/** Outstanding (non-DONE) task count per project — backs the "outstanding
    tasks" column on /admin/projects, matching the existing
    "outstandingRequirements" pattern. */
export async function getOutstandingTaskCountsByProject(projectIds: string[]): Promise<Map<string, number>> {
  if (projectIds.length === 0) return new Map();
  const groups = await db.task.groupBy({
    by: ["projectId"],
    where: { projectId: { in: projectIds }, status: { not: "DONE" } },
    _count: { _all: true },
  });
  const map = new Map<string, number>();
  for (const g of groups) {
    if (g.projectId) map.set(g.projectId, g._count._all);
  }
  return map;
}

type WriteResult = { ok: true; id?: string } | { ok: false; error: string };

export type TaskInput = {
  title: string;
  description?: string;
  projectId?: string;
  assigneeUserId?: string;
  priority?: string;
  dueAt?: string;
};

/** Validates projectId (must reference a real ServiceProject) and
    assigneeUserId (must reference a real role:ADMIN user) before writing —
    never silently creates an orphaned reference, matching
    service-projects-admin.ts's updateProjectOps discipline. */
async function resolveWritableFields(input: TaskInput): Promise<
  | { ok: true; data: { projectId: string | null; assigneeUserId: string | null; priority: TaskPriority; dueAt: Date | null } }
  | { ok: false; error: string }
> {
  let projectId: string | null = null;
  if (input.projectId !== undefined && input.projectId.trim()) {
    const trimmed = input.projectId.trim();
    const project = await db.serviceProject.findUnique({ where: { id: trimmed }, select: { id: true } });
    if (!project) return { ok: false, error: "projectId does not reference a real project" };
    projectId = project.id;
  }

  let assigneeUserId: string | null = null;
  if (input.assigneeUserId !== undefined && input.assigneeUserId.trim()) {
    const trimmed = input.assigneeUserId.trim();
    const admin = await db.user.findFirst({ where: { id: trimmed, role: "ADMIN" }, select: { id: true } });
    if (!admin) return { ok: false, error: "assignee must be a real admin user" };
    assigneeUserId = admin.id;
  }

  let priority: TaskPriority = "MEDIUM";
  if (input.priority !== undefined && input.priority.trim()) {
    if (!isTaskPriority(input.priority)) return { ok: false, error: `invalid priority "${input.priority}"` };
    priority = input.priority;
  }

  let dueAt: Date | null = null;
  if (input.dueAt !== undefined && input.dueAt.trim()) {
    const parsed = new Date(input.dueAt.trim());
    if (Number.isNaN(parsed.getTime())) return { ok: false, error: "invalid dueAt" };
    dueAt = parsed;
  }

  return { ok: true, data: { projectId, assigneeUserId, priority, dueAt } };
}

/** Creates a new task. Only title is required — everything else is
    optional at creation, per the brief. */
export async function createTask(input: TaskInput): Promise<WriteResult> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "title is required" };
  if (title.length > 500) return { ok: false, error: "title too long" };

  const resolved = await resolveWritableFields(input);
  if (!resolved.ok) return resolved;

  const description = input.description?.trim() || null;
  if (description && description.length > 5000) return { ok: false, error: "description too long" };

  const task = await db.task.create({
    data: {
      title,
      description,
      projectId: resolved.data.projectId,
      assigneeUserId: resolved.data.assigneeUserId,
      priority: resolved.data.priority,
      dueAt: resolved.data.dueAt,
    },
  });
  return { ok: true, id: task.id };
}

/** Edits an existing task's title/description/project/assignee/priority/due
    date. Does not touch status/completedAt — use setTaskStatus for that. */
export async function updateTask(id: string, input: TaskInput): Promise<WriteResult> {
  const existing = await db.task.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: "not_found" };

  const title = input.title.trim();
  if (!title) return { ok: false, error: "title is required" };
  if (title.length > 500) return { ok: false, error: "title too long" };

  const resolved = await resolveWritableFields(input);
  if (!resolved.ok) return resolved;

  const description = input.description?.trim() || null;
  if (description && description.length > 5000) return { ok: false, error: "description too long" };

  await db.task.update({
    where: { id },
    data: {
      title,
      description,
      projectId: resolved.data.projectId,
      assigneeUserId: resolved.data.assigneeUserId,
      priority: resolved.data.priority,
      dueAt: resolved.data.dueAt,
    },
  });
  return { ok: true };
}

/** Validates the new status against the real TaskStatus enum, and manages
    completedAt automatically: set to now() the moment status transitions
    TO DONE, cleared the moment it transitions AWAY from DONE. Never trusts
    a client-submitted completedAt directly. */
export async function setTaskStatus(id: string, status: string): Promise<WriteResult> {
  if (!isTaskStatus(status)) return { ok: false, error: `invalid status "${status}"` };
  const existing = await db.task.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!existing) return { ok: false, error: "not_found" };

  const data: { status: TaskStatus; completedAt?: Date | null } = { status };
  if (status === "DONE" && existing.status !== "DONE") data.completedAt = new Date();
  if (status !== "DONE" && existing.status === "DONE") data.completedAt = null;

  await db.task.update({ where: { id }, data });
  return { ok: true };
}

/** One-click "quick complete" — sets status to DONE and completedAt to
    now(). Distinct helper (rather than callers hand-rolling
    setTaskStatus(id, "DONE")) so its own requireAdmin discipline is
    unmistakable at every call site, per the brief's explicit warning that
    this is exactly the kind of small action that's easy to under-authorize. */
export async function quickCompleteTask(id: string): Promise<WriteResult> {
  return setTaskStatus(id, "DONE");
}

/** One-click "reopen" — sets status back to TODO, clearing completedAt. */
export async function reopenTask(id: string): Promise<WriteResult> {
  return setTaskStatus(id, "TODO");
}

/** Overdue-task count for the admin nav's Tasks badge (Slice 7,
    2026-08-28) — same exact criteria (status not DONE, dueAt in the past)
    as listTasksForAdmin's overdueOnly filter and getNeedsAttention's
    overdueTasks query in dashboard-metrics.ts, so the badge, the "Overdue
    only" filter, and the dashboard's Needs Attention list never disagree. */
export async function getOverdueTaskCount(): Promise<number> {
  return db.task.count({ where: { status: { not: "DONE" }, dueAt: { lt: new Date() } } });
}

export async function deleteTask(id: string): Promise<WriteResult> {
  const existing = await db.task.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: "not_found" };
  await db.task.delete({ where: { id } });
  return { ok: true };
}
