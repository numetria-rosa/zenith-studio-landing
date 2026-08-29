import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { listServiceProjectsForAdmin, PROJECT_STAGES, PROJECT_STAGE_LABELS, isProjectStage } from "@/lib/service-projects-admin";
import { getOutstandingTaskCountsByProject } from "@/lib/tasks-admin";
import type { ProjectStage } from "@prisma/client";

/* Every ServiceProject, operationally (Slice 4 of the business command
   center, 2026-08-28: /admin/projects). Matches every other admin route's
   pattern exactly: requireAdmin() -> notFound(), dark Studio card language.
   Supports ?stage=<ProjectStage> so /admin's pipeline section (and any
   other future linker) can deep-link a filtered view — validated against
   the real enum before it drives any query. */

function formatDate(d: Date | null): string {
  if (!d) return "-";
  return d.toISOString().slice(0, 10);
}

function formatDateTime(d: Date | null): string {
  if (!d) return "-";
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const { stage: stageParam } = await searchParams;
  const stageFilter: ProjectStage | undefined = stageParam && isProjectStage(stageParam) ? stageParam : undefined;

  const projects = await listServiceProjectsForAdmin(stageFilter);
  const outstandingTaskCounts = await getOutstandingTaskCountsByProject(projects.map((p) => p.id));

  return (
    <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <Link href="/admin" className="text-sm text-white/50 hover:text-white/80">
              &larr; Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Projects</h1>
            <p className="mt-1 text-sm text-white/50">
              {projects.length} {stageFilter ? "matching filter" : "total"}
              {stageFilter && (
                <>
                  {" "}
                  ·{" "}
                  <Link href="/admin/projects" className="underline hover:text-white">
                    Clear filter
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Stage filter chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/admin/projects"
            className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide transition ${
              !stageFilter
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white/80"
            }`}
          >
            All
          </Link>
          {PROJECT_STAGES.map((s) => (
            <Link
              key={s}
              href={`/admin/projects?stage=${s}`}
              className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide transition ${
                stageFilter === s
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white/80"
              }`}
            >
              {PROJECT_STAGE_LABELS[s]}
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {projects.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
              No projects{stageFilter ? " in this stage" : ""}.
            </p>
          )}

          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/admin/projects/${p.id}`}
              className="block rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/25 hover:bg-white/[0.06]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{p.title}</h2>
                  <p className="text-sm text-white/50">
                    {p.clientName} · {p.clientEmail} · {p.serviceLabel}
                  </p>
                </div>
                <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-400/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
                  {PROJECT_STAGE_LABELS[p.stage]}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/30">Created</p>
                  <p className="mt-0.5 text-sm">{formatDate(p.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/30">Target launch</p>
                  <p className="mt-0.5 text-sm">{formatDate(p.targetLaunchAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/30">Assignee</p>
                  <p className="mt-0.5 text-sm">{p.assigneeName ?? "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/30">Completion</p>
                  <p className="mt-0.5 text-sm">{p.completionPct === null ? "-" : `${p.completionPct}%`}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/30">Outstanding reqs</p>
                  <p className="mt-0.5 text-sm">{p.outstandingRequirements}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/30">Open support</p>
                  <p className="mt-0.5 text-sm">{p.openSupportCount}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/30">Outstanding tasks</p>
                  <p className="mt-0.5 text-sm">{outstandingTaskCounts.get(p.id) ?? 0}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-white/5 pt-3">
                <p className="text-xs text-white/40">
                  Last client activity: {formatDateTime(p.lastClientActivityAt)}
                </p>
                {p.latestMessagePreview && (
                  <p className="max-w-md truncate text-xs text-white/40">
                    &ldquo;{p.latestMessagePreview}&rdquo;
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
  );
}
