import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import {
  getServiceProjectForAdmin,
  listAssignableAdmins,
  updateProjectStage,
  ensureSplitMonthlyCheckoutForProject,
  setMilestoneCompleted,
  updateRequirementStatusAsAdmin,
  updateProjectAdminNote,
  updateProjectOps,
  updateProjectSpecialty,
  postAdminMessage,
  updateSupportRequestStatusForAdmin,
  PROJECT_STAGES,
  PROJECT_STAGE_LABELS,
  SUPPORT_STATUSES,
  SUPPORT_STATUS_LABELS,
} from "@/lib/service-projects-admin";
import { projectServiceLabel } from "@/lib/services";
import { computeApprovedTotals, whopCheckoutUrl } from "@/lib/proposal-payments";
import { INTEGRATION_STATUS_LABELS } from "@/lib/service-workspace";
import {
  listTasksForProject,
  createTask,
  quickCompleteTask,
  reopenTask,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
} from "@/lib/tasks-admin";
import { approveTimeEntry, rejectTimeEntry } from "@/lib/billing-clerk";
import { LAW_FIRM_SPECIALTIES, LEGAL_SPECIALTY_PROFILES } from "@/lib/legal-specialties";
import { getMonthlyCostCents, resolveMonthlyBudgetCents, isBudgetAutoPaused } from "@/lib/usage-costs";

/* Admin operations view for a single ServiceProject (Slice 4 of the
   business command center, 2026-08-28: /admin/projects/[id]). Every write
   action below independently re-runs requireAdmin() - never trusts that
   reaching the action means this page's own render already checked it -
   and validates every enum-typed input server-side against the real Prisma
   enum values before writing. A malformed/nonexistent id resolves to
   notFound() cleanly via getServiceProjectForAdmin returning null. */

const REQUIREMENT_STATUS_LABELS: Record<string, string> = {
  MISSING: "Needed from client",
  SUBMITTED: "Submitted, awaiting review",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Needs revision",
};

/** Hourly specialties populate durationMinutes; contingency specialties
    (personal injury) populate expenseAmountCents instead, see
    legal-specialties.ts. */
function formatEntryAmount(entry: { durationMinutes: number | null; expenseAmountCents: number | null }): string {
  if (entry.durationMinutes !== null) return `${(entry.durationMinutes / 60).toFixed(1)}h`;
  if (entry.expenseAmountCents !== null && entry.expenseAmountCents > 0) {
    return `$${(entry.expenseAmountCents / 100).toFixed(2)} expense`;
  }
  return "Case activity";
}

function formatDate(d: Date | null): string {
  if (!d) return "-";
  return d.toISOString().slice(0, 10);
}

function formatDateTime(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ");
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export default async function AdminProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stageError?: string; monthlyCreated?: string; monthlyError?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const { id } = await params;
  const sp = await searchParams;
  const [project, assignableAdmins, projectTasks] = await Promise.all([
    getServiceProjectForAdmin(id),
    listAssignableAdmins(),
    listTasksForProject(id),
  ]);
  if (!project) notFound();

  const [monthlySpentCents, monthlyBudgetCents, budgetAutoPaused] = await Promise.all([
    getMonthlyCostCents(id),
    resolveMonthlyBudgetCents(id),
    project.stage === "PAUSED" ? isBudgetAutoPaused(id) : Promise.resolve(false),
  ]);
  const usagePct = monthlyBudgetCents > 0 ? Math.round((monthlySpentCents / monthlyBudgetCents) * 100) : 0;

  const path = `/admin/projects/${id}`;

  const proposal = project.proposal;
  const selectedAddOnIds = Array.isArray(proposal?.selectedAddOnItemIds)
    ? (proposal.selectedAddOnItemIds as string[])
    : [];
  const monthlyCents = proposal ? computeApprovedTotals(proposal.items, selectedAddOnIds).monthlyCents : 0;
  const needsDeferredMonthly =
    !!proposal &&
    proposal.paymentMode === "SPLIT" &&
    !proposal.whopMonthlyPlanId &&
    monthlyCents > 0;

  async function changeStage(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const stage = String(formData.get("stage") || "");
    const result = await updateProjectStage(id, stage);
    revalidatePath(path);
    revalidatePath("/admin/projects");
    if (!result.ok) {
      redirect(`${path}?stageError=${encodeURIComponent(result.error)}`);
    }
  }

  async function createMonthlyCheckout() {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const result = await ensureSplitMonthlyCheckoutForProject(id);
    revalidatePath(path);
    if (result.ok) {
      redirect(`${path}?monthlyCreated=1`);
    } else {
      redirect(`${path}?monthlyError=${encodeURIComponent(result.error)}`);
    }
  }

  async function toggleMilestone(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const milestoneId = String(formData.get("milestoneId") || "");
    const completed = String(formData.get("completed") || "") === "1";
    await setMilestoneCompleted(id, milestoneId, completed);
    revalidatePath(path);
    revalidatePath(`/lab/dashboard/services/${id}`);
  }

  async function setRequirementStatus(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const requirementId = String(formData.get("requirementId") || "");
    const status = String(formData.get("status") || "");
    await updateRequirementStatusAsAdmin(id, requirementId, status);
    revalidatePath(path);
    revalidatePath(`/lab/dashboard/services/${id}`);
  }

  async function saveNote(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const adminNote = String(formData.get("adminNote") || "");
    await updateProjectAdminNote(id, adminNote);
    revalidatePath(path);
  }

  async function saveOps(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const assigneeUserId = String(formData.get("assigneeUserId") || "");
    const targetLaunchAt = String(formData.get("targetLaunchAt") || "");
    await updateProjectOps(id, { assigneeUserId, targetLaunchAt });
    revalidatePath(path);
    revalidatePath("/admin/projects");
  }

  async function saveSpecialty(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const specialty = String(formData.get("specialty") || "");
    await updateProjectSpecialty(id, specialty);
    revalidatePath(path);
    revalidatePath("/admin/projects");
  }

  async function sendAdminMessage(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session?.user?.id) return;
    const body = String(formData.get("body") || "");
    await postAdminMessage(id, session.user.id, body);
    revalidatePath(path);
    revalidatePath(`/lab/dashboard/services/${id}`);
  }

  async function approveEntry(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session?.user?.id) return;
    const entryId = String(formData.get("entryId") || "");
    await approveTimeEntry(entryId, session.user.id);
    revalidatePath(path);
  }

  async function rejectEntry(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session?.user?.id) return;
    const entryId = String(formData.get("entryId") || "");
    await rejectTimeEntry(entryId, session.user.id);
    revalidatePath(path);
  }

  async function changeSupportStatus(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const supportRequestId = String(formData.get("supportRequestId") || "");
    const status = String(formData.get("status") || "");
    await updateSupportRequestStatusForAdmin(id, supportRequestId, status);
    revalidatePath(path);
  }

  async function createProjectTask(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    await createTask({
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      projectId: id,
      assigneeUserId: String(formData.get("assigneeUserId") || ""),
      priority: String(formData.get("priority") || ""),
      dueAt: String(formData.get("dueAt") || ""),
    });
    revalidatePath(path);
    revalidatePath("/admin/tasks");
    revalidatePath("/admin/projects");
    revalidatePath("/admin");
  }

  async function completeProjectTask(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const taskId = String(formData.get("taskId") || "");
    await quickCompleteTask(taskId);
    revalidatePath(path);
    revalidatePath("/admin/tasks");
    revalidatePath("/admin/projects");
    revalidatePath("/admin");
  }

  async function reopenProjectTask(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const taskId = String(formData.get("taskId") || "");
    await reopenTask(taskId);
    revalidatePath(path);
    revalidatePath("/admin/tasks");
    revalidatePath("/admin/projects");
    revalidatePath("/admin");
  }

  const serviceLabel = projectServiceLabel(project);
  const totalMilestones = project.milestones.length;
  const completedMilestones = project.milestones.filter((m) => m.completedAt).length;
  const completionPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : null;
  const outstandingRequirements = project.requirements.filter(
    (r) => r.status === "MISSING" || r.status === "REJECTED"
  ).length;

  return (
    <div className="mx-auto max-w-4xl">
        <Link href="/admin/projects" className="text-sm text-white/50 hover:text-white/80">
          &larr; All projects
        </Link>

        {/* Overview */}
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{project.title}</h1>
            <p className="mt-1 text-sm text-white/50">{serviceLabel}</p>
            <p className="mt-1 text-sm text-white/50">
              <Link href={`/admin/clients/${encodeURIComponent(project.user.email)}`} className="hover:underline">
                {project.user.name || project.user.email}
              </Link>{" "}
              · {project.user.email}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-400/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
              {PROJECT_STAGE_LABELS[project.stage]}
            </span>
            <p className="mt-2 text-xs text-white/40">Created {formatDate(project.createdAt)}</p>
            {/* Quick toggle, stops every runtime webhook/cron for this
                project the moment it's clicked, see isProjectPaused in
                project-pause.ts. Resume always targets LIVE, pausing a
                project outside LIVE is not a real scenario in practice. */}
            <form action={changeStage} className="mt-2">
              <input type="hidden" name="stage" value={project.stage === "PAUSED" ? "LIVE" : "PAUSED"} />
              <button
                type="submit"
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                  project.stage === "PAUSED"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                    : "border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                }`}
              >
                {project.stage === "PAUSED" ? "Resume to Live" : "Pause"}
              </button>
            </form>
          </div>
        </div>

        {budgetAutoPaused && (
          <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/[0.06] p-4">
            <p className="text-sm text-red-200">
              Auto-paused: this project hit 100% of its monthly API budget, so every AI-driven call, text, and
              follow-up is currently blocked. Resume to Live above if this is a false positive, or it stays paused
              until next month&apos;s budget resets.
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] uppercase tracking-wide text-white/30">Completion</p>
            <p className="mt-1 text-lg font-semibold">{completionPct === null ? "-" : `${completionPct}%`}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] uppercase tracking-wide text-white/30">Outstanding reqs</p>
            <p className="mt-1 text-lg font-semibold">{outstandingRequirements}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] uppercase tracking-wide text-white/30">Target launch</p>
            <p className="mt-1 text-lg font-semibold">{formatDate(project.targetLaunchAt)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] uppercase tracking-wide text-white/30">Assignee</p>
            <p className="mt-1 text-lg font-semibold">
              {project.assignee ? project.assignee.name || project.assignee.email : "Unassigned"}
            </p>
          </div>
        </div>

        {/* Stage change control */}
        <SectionCard title="Stage">
          {sp.stageError && (
            <div className="mb-3 rounded-2xl border border-red-400/30 bg-red-400/[0.06] p-4">
              <p className="text-sm text-red-200">Stage update failed: {sp.stageError}</p>
            </div>
          )}
          {sp.monthlyCreated && (
            <div className="mb-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
              <p className="text-sm text-emerald-200">Monthly Whop checkout created. The client can pay from their proposal / dashboard.</p>
            </div>
          )}
          {sp.monthlyError && (
            <div className="mb-3 rounded-2xl border border-red-400/30 bg-red-400/[0.06] p-4">
              <p className="text-sm text-red-200">Couldn&apos;t create monthly checkout: {sp.monthlyError}</p>
            </div>
          )}
          {needsDeferredMonthly && (
            <div className="mb-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-4">
              <p className="text-sm text-amber-100">
                SPLIT monthly checkout (${(monthlyCents / 100).toFixed(2)}/mo) is missing
                {project.stage === "LIVE" ? " while this project is already LIVE" : ""}.
                Marking LIVE creates it automatically; you can also create it here.
              </p>
              <form action={createMonthlyCheckout} className="mt-3">
                <button
                  type="submit"
                  className="rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/20"
                >
                  Create monthly Whop checkout
                </button>
              </form>
            </div>
          )}
          {proposal?.whopMonthlyPlanId && !proposal.monthlyPaidAt && (
            <p className="mb-3 text-sm text-white/60">
              Monthly checkout ready:{" "}
              <a
                href={whopCheckoutUrl(proposal.whopMonthlyPlanId)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-white/30 hover:text-white"
              >
                open link
              </a>
            </p>
          )}
          <form action={changeStage} className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div>
              <label className="mb-1 block text-xs text-white/50" htmlFor="stage">
                Change stage
              </label>
              <select
                id="stage"
                name="stage"
                defaultValue={project.stage}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
              >
                {PROJECT_STAGES.map((s) => (
                  <option key={s} value={s} className="bg-[#05060a]">
                    {PROJECT_STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Update stage
            </button>
          </form>
        </SectionCard>

        {/* Usage/margin health, see usage-costs.ts. Budget is 30% of this
            project's monthly price, targeting 70% net margin. */}
        <SectionCard title="Monthly API usage">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/70">
              ${(monthlySpentCents / 100).toFixed(2)} spent of ${(monthlyBudgetCents / 100).toFixed(2)} budget this
              month ({usagePct}%)
            </p>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                usagePct >= 100
                  ? "border-red-400/40 bg-red-400/10 text-red-300"
                  : usagePct >= 90
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                    : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              }`}
            >
              {usagePct >= 100 ? "Over budget" : usagePct >= 90 ? "Near limit" : "Healthy"}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full ${usagePct >= 100 ? "bg-red-400" : usagePct >= 90 ? "bg-amber-400" : "bg-emerald-400"}`}
              style={{ width: `${Math.min(usagePct, 100)}%` }}
            />
          </div>
        </SectionCard>

        {/* Assignee / target launch */}
        <SectionCard title="Assignment &amp; target launch">
          <form action={saveOps} className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div>
              <label className="mb-1 block text-xs text-white/50" htmlFor="assigneeUserId">
                Assignee
              </label>
              <select
                id="assigneeUserId"
                name="assigneeUserId"
                defaultValue={project.assignee?.id ?? ""}
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
              <label className="mb-1 block text-xs text-white/50" htmlFor="targetLaunchAt">
                Target launch date
              </label>
              <input
                id="targetLaunchAt"
                name="targetLaunchAt"
                type="date"
                defaultValue={project.targetLaunchAt ? project.targetLaunchAt.toISOString().slice(0, 10) : ""}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Save
            </button>
          </form>
        </SectionCard>

        {/* Legal specialty (law-firms only), drives billing-clerk.ts's
            choice of hourly vs contingency narrative per legal-specialties.ts */}
        {project.sourceServiceId === "law-firms" && (
          <SectionCard title="Legal specialty">
            <p className="text-sm text-white/50">
              Sets which billing model the Billing Clerk uses for this firm. Personal Injury drafts case-activity
              and expense entries instead of hourly time, since PI firms bill on contingency.
            </p>
            <form action={saveSpecialty} className="mt-3 flex flex-wrap items-end gap-3">
              <select
                name="specialty"
                defaultValue={project.specialty ?? ""}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
              >
                <option value="" className="bg-[#05060a]">
                  Not set (defaults to hourly)
                </option>
                {LAW_FIRM_SPECIALTIES.map((s) => (
                  <option key={s} value={s} className="bg-[#05060a]">
                    {LEGAL_SPECIALTY_PROFILES[s].label} ({LEGAL_SPECIALTY_PROFILES[s].billingModel.toLowerCase()})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Save
              </button>
            </form>
          </SectionCard>
        )}

        {/* Internal note */}
        <SectionCard title="Internal note (never shown to the client)">
          <form action={saveNote} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <textarea
              name="adminNote"
              defaultValue={project.adminNote ?? ""}
              rows={4}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
              placeholder="Internal notes about this project..."
            />
            <button
              type="submit"
              className="self-start rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Save note
            </button>
          </form>
        </SectionCard>

        {/* Milestones */}
        <SectionCard title={`Milestones (${completedMilestones}/${totalMilestones})`}>
          {project.milestones.length === 0 && <p className="text-sm text-white/50">No milestones.</p>}
          {project.milestones.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${
                    m.completedAt ? "bg-emerald-400" : "border border-white/30 bg-transparent"
                  }`}
                />
                <span className={m.completedAt ? "text-white/50 line-through" : "text-white"}>{m.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/40">
                  {m.completedAt ? `Completed ${formatDate(m.completedAt)}` : m.dueAt ? `Due ${formatDate(m.dueAt)}` : "-"}
                </span>
                <form action={toggleMilestone}>
                  <input type="hidden" name="milestoneId" value={m.id} />
                  <input type="hidden" name="completed" value={m.completedAt ? "0" : "1"} />
                  <button
                    type="submit"
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/10"
                  >
                    {m.completedAt ? "Reopen" : "Complete"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Requirements */}
        <SectionCard title={`Requirements (${outstandingRequirements} outstanding)`}>
          {project.requirements.length === 0 && <p className="text-sm text-white/50">No requirements listed.</p>}
          {project.requirements.map((r) => (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{r.label}</p>
                <span className="text-xs text-white/40">{REQUIREMENT_STATUS_LABELS[r.status] ?? r.status}</span>
              </div>
              {r.detail && <p className="mt-2 text-sm text-white/70">{r.detail}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === "SUBMITTED" || r.status === "MISSING" || r.status === "REJECTED" ? (
                  <form action={setRequirementStatus}>
                    <input type="hidden" name="requirementId" value={r.id} />
                    <input type="hidden" name="status" value="UNDER_REVIEW" />
                    <button type="submit" className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/10">
                      Mark under review
                    </button>
                  </form>
                ) : null}
                {r.status !== "APPROVED" && (
                  <form action={setRequirementStatus}>
                    <input type="hidden" name="requirementId" value={r.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button type="submit" className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20">
                      Approve
                    </button>
                  </form>
                )}
                {r.status !== "REJECTED" && r.status !== "MISSING" && (
                  <form action={setRequirementStatus}>
                    <input type="hidden" name="requirementId" value={r.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button type="submit" className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-400/20">
                      Request revision
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Integrations */}
        <SectionCard title="Integrations">
          {project.integrations.length === 0 && <p className="text-sm text-white/50">No integrations set up.</p>}
          {project.integrations.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <span className="text-sm font-semibold capitalize">{i.provider}</span>
              <div className="flex items-center gap-3">
                {i.externalRef && (
                  <span className="text-xs text-white/40">ref: {i.externalRef}</span>
                )}
                <span className="text-xs text-white/50">{INTEGRATION_STATUS_LABELS[i.status] ?? i.status}</span>
              </div>
            </div>
          ))}
        </SectionCard>

        {/* AI Inbox Manager: client-connected (Gmail/Yahoo app password, not
            OAuth, see mail-imap.ts), so nothing for the admin to initiate
            here - read-only visibility only, harmless to show empty for any
            other project. */}
        {(project.mailConnections.length > 0 || project.inboxDrafts.length > 0) && (
          <SectionCard title={`Inbox Manager: drafts awaiting client review (${project.inboxDrafts.length})`}>
            {project.mailConnections.length > 0 && (
              <div className="space-y-2">
                {project.mailConnections.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <span className="text-sm font-semibold">
                      {c.provider === "GMAIL" ? "Gmail" : "Yahoo"} · {c.emailAddress}
                    </span>
                    <span className={`text-xs ${c.status === "CONNECTED" ? "text-emerald-300" : "text-amber-300"}`}>
                      {c.status === "CONNECTED" ? "Connected" : `Connection issue${c.lastError ? `: ${c.lastError}` : ""}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 space-y-3">
              {project.inboxDrafts.map((draft) => (
                <div key={draft.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold">{draft.subject}</p>
                    <span className="text-xs text-white/40">{draft.fromEmail}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/75">{draft.draftReply}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* AI Billing Clerk: law-firms vertical only, but harmless to show
            (empty) for any other project since it's just connections + drafts. */}
        <SectionCard title={`Billing Clerk: drafts awaiting review (${project.timeEntries.length})`}>
          <div className="flex flex-wrap gap-3">
            <a
              href={`/api/oauth/google/authorize?projectId=${id}`}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              Connect Google (Calendar + Gmail)
            </a>
            <a
              href={`/api/oauth/microsoft/authorize?projectId=${id}`}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              Connect Microsoft 365
            </a>
            <a
              href={`/api/admin/projects/${id}/billing-export`}
              className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/20"
            >
              Export approved entries (CSV)
            </a>
          </div>

          {project.oauthConnections.length > 0 && (
            <div className="mt-4 space-y-2">
              {project.oauthConnections.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <span className="text-sm font-semibold">
                    {c.provider === "GOOGLE" ? "Google" : "Microsoft"} · {c.accountEmail}
                  </span>
                  <span
                    className={`text-xs ${c.status === "CONNECTED" ? "text-emerald-300" : "text-amber-300"}`}
                  >
                    {c.status === "CONNECTED" ? "Connected" : c.status === "EXPIRED" ? "Needs reconnect" : "Revoked"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {project.timeEntries.length === 0 && (
              <p className="text-sm text-white/50">No drafts waiting. Nothing new since the last sync, or no calendar/email connected yet.</p>
            )}
            {project.timeEntries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {entry.matterName} · {formatEntryAmount(entry)}
                  </p>
                  <span className="text-xs text-white/40">
                    {formatDate(entry.entryDate)} · {entry.attorneyEmail} · {entry.sourceType}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/75">{entry.narrative}</p>
                <div className="mt-3 flex gap-2">
                  <form action={approveEntry}>
                    <input type="hidden" name="entryId" value={entry.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black hover:scale-[1.02]"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectEntry}>
                    <input type="hidden" name="entryId" value={entry.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Messages */}
        <SectionCard title={`Messages (${project.messages.length})`}>
          {project.messages.length === 0 && <p className="text-sm text-white/50">No messages yet.</p>}
          {project.messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-2xl border p-4 ${
                m.senderRole === "CLIENT" ? "border-white/10 bg-white/[0.04]" : "border-cyan-400/20 bg-cyan-400/[0.04]"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs font-semibold text-white/70">
                  {m.senderRole === "CLIENT" ? "Client" : "Admin"} · {m.sender.name || m.sender.email}
                </p>
                <span className="text-xs text-white/40">{formatDateTime(m.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{m.body}</p>
            </div>
          ))}
          <form action={sendAdminMessage} className="flex flex-col gap-2 border-t border-white/10 pt-4">
            <textarea
              name="body"
              required
              rows={3}
              placeholder="Reply to the client..."
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="self-start rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Send reply
            </button>
          </form>
        </SectionCard>

        {/* Internal tasks */}
        <SectionCard title={`Internal tasks (${projectTasks.filter((t) => t.status !== "DONE").length} open)`}>
          {projectTasks.length === 0 && <p className="text-sm text-white/50">No internal tasks yet.</p>}
          {projectTasks.map((t) => (
            <div
              key={t.id}
              className={`rounded-2xl border p-4 ${
                t.isOverdue ? "border-red-400/30 bg-red-400/[0.04]" : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className={`text-sm font-semibold ${t.status === "DONE" ? "text-white/50 line-through" : ""}`}>
                  {t.title}
                </p>
                <span className="text-xs text-white/40">
                  {TASK_PRIORITY_LABELS[t.priority]} · {t.status}
                  {t.isOverdue && " · Overdue"}
                </span>
              </div>
              {t.description && <p className="mt-2 text-sm text-white/70">{t.description}</p>}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white/40">
                <span>
                  {t.dueAt ? `Due ${formatDate(t.dueAt)}` : "No due date"} · {t.assigneeName ?? "Unassigned"}
                </span>
                {t.status !== "DONE" ? (
                  <form action={completeProjectTask}>
                    <input type="hidden" name="taskId" value={t.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-emerald-400/30 bg-emerald-400/[0.06] px-3 py-1 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-400/[0.12]"
                    >
                      Complete
                    </button>
                  </form>
                ) : (
                  <form action={reopenProjectTask}>
                    <input type="hidden" name="taskId" value={t.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/10"
                    >
                      Reopen
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
          <form action={createProjectTask} className="flex flex-col gap-2 border-t border-white/10 pt-4">
            <input
              name="title"
              required
              placeholder="New internal task..."
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
                <label className="mb-1 block text-xs text-white/50" htmlFor="task-assigneeUserId">
                  Assignee
                </label>
                <select
                  id="task-assigneeUserId"
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
                <label className="mb-1 block text-xs text-white/50" htmlFor="task-priority">
                  Priority
                </label>
                <select
                  id="task-priority"
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
                <label className="mb-1 block text-xs text-white/50" htmlFor="task-dueAt">
                  Due date
                </label>
                <input
                  id="task-dueAt"
                  name="dueAt"
                  type="date"
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Add task
              </button>
            </div>
          </form>
        </SectionCard>

        {/* Support requests */}
        <SectionCard title={`Support requests (${project.supportRequests.length})`}>
          {project.supportRequests.length === 0 && <p className="text-sm text-white/50">No support requests.</p>}
          {project.supportRequests.map((s) => (
            <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{s.subject}</p>
                <span className="text-xs text-white/40">
                  {s.priority} · {formatDate(s.createdAt)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{s.body}</p>
              <form action={changeSupportStatus} className="mt-3 flex items-end gap-3">
                <input type="hidden" name="supportRequestId" value={s.id} />
                <div>
                  <label className="mb-1 block text-xs text-white/50" htmlFor={`support-status-${s.id}`}>
                    Status
                  </label>
                  <select
                    id={`support-status-${s.id}`}
                    name="status"
                    defaultValue={s.status}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                  >
                    {SUPPORT_STATUSES.map((st) => (
                      <option key={st} value={st} className="bg-[#05060a]">
                        {SUPPORT_STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  Update
                </button>
              </form>
            </div>
          ))}
        </SectionCard>
      </div>
  );
}
