import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import {
  listTasksForAdmin,
  listAssignableAdmins,
  listProjectsForTaskPicker,
  createTask,
  updateTask,
  quickCompleteTask,
  reopenTask,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  isTaskStatus,
  isTaskPriority,
} from "@/lib/tasks-admin";
import type { TaskPriority, TaskStatus } from "@prisma/client";

/* Internal task list/board (Slice 6 of the business command center,
   2026-08-28: /admin/tasks). Matches every other admin route's pattern
   exactly: requireAdmin() -> notFound(), dark Studio card language. Every
   write action below independently re-runs requireAdmin() — never trusts
   that reaching the action means this page's own render already checked
   it — including the one-click "quick complete" action, which the brief
   explicitly calls out as easy to under-authorize. */

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toISOString().slice(0, 10);
}

function formatDateTime(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ");
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "border-white/15 bg-white/[0.03] text-white/50",
  MEDIUM: "border-cyan-400/30 bg-cyan-400/[0.06] text-cyan-300",
  HIGH: "border-amber-400/30 bg-amber-400/[0.06] text-amber-300",
  URGENT: "border-red-400/40 bg-red-400/[0.08] text-red-300",
};

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    assignee?: string;
    overdue?: string;
    q?: string;
  }>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const sp = await searchParams;
  const statusFilter: TaskStatus | undefined = sp.status && isTaskStatus(sp.status) ? sp.status : undefined;
  const priorityFilter: TaskPriority | undefined =
    sp.priority && isTaskPriority(sp.priority) ? sp.priority : undefined;
  // "ANY" (or absent) means "any assignee", "UNASSIGNED" means unassigned,
  // any other value is a real admin user id.
  const assigneeFilter =
    sp.assignee === undefined || sp.assignee === "ANY"
      ? undefined
      : sp.assignee === "UNASSIGNED"
        ? ""
        : sp.assignee;
  const overdueOnly = sp.overdue === "1";
  const search = sp.q?.trim() || undefined;

  const [allTasks, assignableAdmins, pickerProjects] = await Promise.all([
    listTasksForAdmin({
      status: statusFilter,
      priority: priorityFilter,
      assigneeUserId: assigneeFilter,
      overdueOnly,
      search,
    }),
    listAssignableAdmins(),
    listProjectsForTaskPicker(),
  ]);

  // Default view: hide DONE tasks unless a status filter was explicitly
  // requested (including explicitly asking for DONE). This is "however
  // you've designed the default filter" per the brief — open tasks first.
  const tasks = statusFilter ? allTasks : allTasks.filter((t) => t.status !== "DONE");

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = {
      status: sp.status,
      priority: sp.priority,
      assignee: sp.assignee,
      overdue: sp.overdue,
      q: sp.q,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "") params.set(k, v);
      else if (v === "" && k === "assignee") params.set(k, ""); // preserve explicit "unassigned"
    }
    const qs = params.toString();
    return `/admin/tasks${qs ? `?${qs}` : ""}`;
  }

  async function createTaskAction(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    await createTask({
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      projectId: String(formData.get("projectId") || ""),
      assigneeUserId: String(formData.get("assigneeUserId") || ""),
      priority: String(formData.get("priority") || ""),
      dueAt: String(formData.get("dueAt") || ""),
    });
    revalidatePath("/admin/tasks");
    revalidatePath("/admin");
  }

  async function quickComplete(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const id = String(formData.get("id") || "");
    await quickCompleteTask(id);
    revalidatePath("/admin/tasks");
    revalidatePath("/admin");
  }

  async function reopen(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const id = String(formData.get("id") || "");
    await reopenTask(id);
    revalidatePath("/admin/tasks");
    revalidatePath("/admin");
  }

  async function quickEdit(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const id = String(formData.get("id") || "");
    await updateTask(id, {
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      projectId: String(formData.get("projectId") || ""),
      assigneeUserId: String(formData.get("assigneeUserId") || ""),
      priority: String(formData.get("priority") || ""),
      dueAt: String(formData.get("dueAt") || ""),
    });
    revalidatePath("/admin/tasks");
    revalidatePath("/admin");
  }

  return (
    <div className="min-h-screen bg-[#05060a] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <Link href="/admin" className="text-sm text-white/50 hover:text-white/80">
              &larr; Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Tasks</h1>
            <p className="mt-1 text-sm text-white/50">
              {tasks.length}{" "}
              {statusFilter || priorityFilter || assigneeFilter !== undefined || overdueOnly || search
                ? "matching filter"
                : "open"}
              {!statusFilter && " (DONE hidden by default)"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={buildHref({ overdue: undefined })}
            className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide transition ${
              !overdueOnly
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white/80"
            }`}
          >
            All
          </Link>
          <Link
            href={buildHref({ overdue: "1" })}
            className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide transition ${
              overdueOnly
                ? "border-red-400/40 bg-red-400/10 text-red-300"
                : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white/80"
            }`}
          >
            Overdue only
          </Link>
          <span className="mx-1 w-px self-stretch bg-white/10" />
          {TASK_STATUSES.map((s) => (
            <Link
              key={s}
              href={buildHref({ status: statusFilter === s ? undefined : s })}
              className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide transition ${
                statusFilter === s
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white/80"
              }`}
            >
              {TASK_STATUS_LABELS[s]}
            </Link>
          ))}
          <span className="mx-1 w-px self-stretch bg-white/10" />
          {TASK_PRIORITIES.map((p) => (
            <Link
              key={p}
              href={buildHref({ priority: priorityFilter === p ? undefined : p })}
              className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide transition ${
                priorityFilter === p
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white/80"
              }`}
            >
              {TASK_PRIORITY_LABELS[p]}
            </Link>
          ))}
        </div>

        <form action="/admin/tasks" method="GET" className="mt-4 flex flex-wrap items-center gap-3">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          {sp.priority && <input type="hidden" name="priority" value={sp.priority} />}
          {sp.overdue && <input type="hidden" name="overdue" value={sp.overdue} />}
          <input
            type="text"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search title/description..."
            className="w-64 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
          />
          <select
            name="assignee"
            defaultValue={sp.assignee ?? "ANY"}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
          >
            <option value="ANY" className="bg-[#05060a]">
              Any assignee
            </option>
            <option value="UNASSIGNED" className="bg-[#05060a]">
              Unassigned
            </option>
            {assignableAdmins.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#05060a]">
                {a.name || a.email}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Search
          </button>
        </form>

        {/* New task form */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold">New task</h2>
          <form
            action={createTaskAction}
            className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5"
          >
            <input
              name="title"
              required
              placeholder="Task title..."
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            />
            <textarea
              name="description"
              rows={2}
              placeholder="Description (optional)..."
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-white/50" htmlFor="new-projectId">
                  Project (optional)
                </label>
                <select
                  id="new-projectId"
                  name="projectId"
                  defaultValue=""
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                >
                  <option value="" className="bg-[#05060a]">
                    No project
                  </option>
                  {pickerProjects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#05060a]">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50" htmlFor="new-assigneeUserId">
                  Assignee
                </label>
                <select
                  id="new-assigneeUserId"
                  name="assigneeUserId"
                  defaultValue=""
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                >
                  <option value="" className="bg-[#05060a]">
                    Unassigned
                  </option>
                  {assignableAdmins.map((a) => (
                    <option key={a.id} value={a.id} className="bg-[#05060a]">
                      {a.name || a.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50" htmlFor="new-priority">
                  Priority
                </label>
                <select
                  id="new-priority"
                  name="priority"
                  defaultValue="MEDIUM"
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p} className="bg-[#05060a]">
                      {TASK_PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50" htmlFor="new-dueAt">
                  Due date
                </label>
                <input
                  id="new-dueAt"
                  name="dueAt"
                  type="date"
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Create task
              </button>
            </div>
          </form>
        </section>

        {/* Task list */}
        <section className="mt-10 mb-8">
          <h2 className="text-lg font-semibold">All tasks</h2>
          <div className="mt-4 flex flex-col gap-3">
            {tasks.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
                No tasks match this filter.
              </p>
            )}
            {tasks.map((t) => (
              <div
                key={t.id}
                className={`rounded-2xl border p-5 ${
                  t.isOverdue ? "border-red-400/30 bg-red-400/[0.04]" : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm font-semibold ${t.status === "DONE" ? "text-white/50 line-through" : ""}`}>
                        {t.title}
                      </p>
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${PRIORITY_COLORS[t.priority]}`}
                      >
                        {TASK_PRIORITY_LABELS[t.priority]}
                      </span>
                      <span className="inline-block rounded-full border border-white/15 bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                        {TASK_STATUS_LABELS[t.status]}
                      </span>
                      {t.isOverdue && (
                        <span className="inline-block rounded-full border border-red-400/40 bg-red-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-300">
                          Overdue
                        </span>
                      )}
                    </div>
                    {t.description && <p className="mt-2 text-sm text-white/70">{t.description}</p>}
                    <p className="mt-2 text-xs text-white/40">
                      {t.projectId ? (
                        <Link href={`/admin/projects/${t.projectId}`} className="hover:underline">
                          {t.projectLabel}
                        </Link>
                      ) : (
                        "No project"
                      )}
                      {t.clientLabel && ` · ${t.clientLabel}`}
                      {" · "}
                      {t.assigneeName ?? "Unassigned"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-white/40">Due {formatDate(t.dueAt)}</p>
                    <p className="mt-1 text-xs text-white/30">Created {formatDate(t.createdAt)}</p>
                    {t.completedAt && (
                      <p className="mt-1 text-xs text-emerald-400/70">Completed {formatDateTime(t.completedAt)}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/5 pt-3">
                  {t.status !== "DONE" ? (
                    <form action={quickComplete}>
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-emerald-400/30 bg-emerald-400/[0.06] px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/[0.12]"
                      >
                        Complete
                      </button>
                    </form>
                  ) : (
                    <form action={reopen}>
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
                      >
                        Reopen
                      </button>
                    </form>
                  )}

                  <details className="ml-auto">
                    <summary className="cursor-pointer text-xs text-white/40 hover:text-white/70">Edit</summary>
                    <form action={quickEdit} className="mt-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <input type="hidden" name="id" value={t.id} />
                      <input
                        name="title"
                        defaultValue={t.title}
                        required
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                      />
                      <textarea
                        name="description"
                        defaultValue={t.description ?? ""}
                        rows={2}
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                      />
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <label className="mb-1 block text-xs text-white/50">Project</label>
                          <select
                            name="projectId"
                            defaultValue={t.projectId ?? ""}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                          >
                            <option value="" className="bg-[#05060a]">
                              No project
                            </option>
                            {pickerProjects.map((p) => (
                              <option key={p.id} value={p.id} className="bg-[#05060a]">
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-white/50">Assignee</label>
                          <select
                            name="assigneeUserId"
                            defaultValue={t.assigneeUserId ?? ""}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                          >
                            <option value="" className="bg-[#05060a]">
                              Unassigned
                            </option>
                            {assignableAdmins.map((a) => (
                              <option key={a.id} value={a.id} className="bg-[#05060a]">
                                {a.name || a.email}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-white/50">Priority</label>
                          <select
                            name="priority"
                            defaultValue={t.priority}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                          >
                            {TASK_PRIORITIES.map((p) => (
                              <option key={p} value={p} className="bg-[#05060a]">
                                {TASK_PRIORITY_LABELS[p]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-white/50">Due date</label>
                          <input
                            name="dueAt"
                            type="date"
                            defaultValue={t.dueAt ? t.dueAt.toISOString().slice(0, 10) : ""}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                          />
                        </div>
                        <button
                          type="submit"
                          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
