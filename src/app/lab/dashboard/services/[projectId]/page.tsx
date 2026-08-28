import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { courseFontVars } from "@/lib/fonts";
import { CourseBar } from "@/components/CourseBar";
import { getService } from "@/lib/services";
import {
  getOwnedServiceProject,
  PROJECT_STAGE_ORDER,
  PROJECT_STAGE_LABELS,
  INTEGRATION_STATUS_LABELS,
  submitClientRequirement,
  postClientMessage,
  createClientSupportRequest,
} from "@/lib/service-workspace";
import { ProjectTabs } from "./Tabs";

/* Client-facing service project workspace (Slice 7 of the service-platform
   build, 2026-08-28). Loaded from /lab/dashboard's "My projects" list.

   IDOR-critical: the page's ONLY data fetch is getOwnedServiceProject, which
   scopes { id: projectId, userId } in a single query — never "fetch by id,
   then check ownership after." A wrong id and someone else's real id both
   produce notFound() (404) here, identically — never a message that would
   confirm the id is real. Every server action below independently re-runs
   the same ownership-scoped check inside src/lib/service-workspace.ts,
   never trusting that reaching the action means this page's own check
   already passed. */

const REQUIREMENT_STATUS_LABELS: Record<string, string> = {
  MISSING: "Needed from you",
  SUBMITTED: "Submitted — awaiting review",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Needs revision",
};

const SUPPORT_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_CLIENT: "Waiting on you",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export default async function ServiceProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { projectId } = await params;
  const project = await getOwnedServiceProject(projectId, session.user.id);
  if (!project) notFound();

  async function submitRequirement(formData: FormData) {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) return;
    const requirementId = String(formData.get("requirementId") || "");
    const detail = String(formData.get("detail") || "");
    await submitClientRequirement(projectId, session2.user.id, requirementId, detail);
    revalidatePath(`/lab/dashboard/services/${projectId}`);
  }

  async function sendMessage(formData: FormData) {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) return;
    const body = String(formData.get("body") || "");
    await postClientMessage(projectId, session2.user.id, body);
    revalidatePath(`/lab/dashboard/services/${projectId}`);
  }

  async function submitSupportRequest(formData: FormData) {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) return;
    const subject = String(formData.get("subject") || "");
    const body = String(formData.get("body") || "");
    const priority = String(formData.get("priority") || "MEDIUM");
    await createClientSupportRequest(projectId, session2.user.id, subject, body, priority);
    revalidatePath(`/lab/dashboard/services/${projectId}`);
  }

  const serviceLabel =
    project.catalogService?.title ??
    (project.sourceServiceId ? getService(project.sourceServiceId)?.title : null) ??
    project.sourceServiceId ??
    "Service engagement";

  const stageIndex = PROJECT_STAGE_ORDER.indexOf(project.stage as (typeof PROJECT_STAGE_ORDER)[number]);
  const nextMilestone = project.milestones.find((m) => !m.completedAt);
  const outstandingCount = project.requirements.filter((r) => r.status === "MISSING" || r.status === "REJECTED").length;

  return (
    <div
      className={`${courseFontVars} min-h-screen bg-[#0d0f14] font-[family-name:var(--font-course-sans)] text-[#eeeee7]`}
    >
      <CourseBar
        tag="Project"
        brand="lab"
        right={
          <Link
            href="/lab/dashboard"
            className="font-[family-name:var(--font-course-mono)] text-xs uppercase tracking-[0.08em] text-[#9aa0ae] transition hover:text-[#eeeee7]"
          >
            &larr; Dashboard
          </Link>
        }
      />

      <main className="mx-auto max-w-[980px] px-6 pb-20 pt-12">
        <div className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#f0b429]">
          Zenith Lab &middot; Project
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-course-serif)] text-[clamp(28px,4.5vw,40px)] font-semibold leading-[1.1] tracking-[-0.02em]">
          {project.title}
        </h1>
        <p className="mt-2 text-[15.5px] text-[#9aa0ae]">{serviceLabel}</p>

        <ProjectTabs
          panels={{
            overview: (
              <div className="flex flex-col gap-8">
                <div>
                  <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
                    Stage
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {PROJECT_STAGE_ORDER.map((s, i) => (
                      <div
                        key={s}
                        className={`h-1.5 flex-1 rounded-full ${
                          stageIndex >= 0 && i <= stageIndex ? "bg-[#f0b429]" : "border border-[#232838] bg-[#0a0c10]"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-[13px] text-[#9aa0ae]">
                    Current stage:{" "}
                    <span className="font-semibold text-[#eeeee7]">
                      {PROJECT_STAGE_LABELS[project.stage] ?? project.stage}
                    </span>
                  </p>
                </div>

                <div>
                  <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
                    Next milestone
                  </div>
                  {nextMilestone ? (
                    <p className="mt-3 text-[15.5px] font-semibold">{nextMilestone.title}</p>
                  ) : (
                    <p className="mt-3 text-[15.5px] text-[#9aa0ae]">All milestones complete.</p>
                  )}
                  <div className="mt-4 flex flex-col gap-2">
                    {project.milestones.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 text-[13.5px]">
                        <span
                          className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${
                            m.completedAt ? "bg-[#4ade95]" : "border border-[#333a4c] bg-transparent"
                          }`}
                        />
                        <span className={m.completedAt ? "text-[#9aa0ae] line-through" : "text-[#eeeee7]"}>
                          {m.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-[family-name:var(--font-course-mono)] text-xs font-bold uppercase tracking-[0.08em] text-[#676e7d]">
                    Outstanding requirements
                  </div>
                  <p className="mt-3 text-[15.5px]">
                    <span className="font-semibold text-[#f0b429]">{outstandingCount}</span>{" "}
                    {outstandingCount === 1 ? "item" : "items"} still needed from you
                  </p>
                </div>
              </div>
            ),

            requirements: (
              <div className="flex flex-col gap-4">
                {project.requirements.length === 0 && <p className="text-sm text-[#9aa0ae]">No requirements listed.</p>}
                {project.requirements.map((r) => {
                  const writable = r.status === "MISSING" || r.status === "REJECTED";
                  return (
                    <div key={r.id} className="rounded-xl border border-[#232838] bg-[#0d1016] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[14.5px] font-bold">{r.label}</span>
                        <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">
                          {REQUIREMENT_STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </div>
                      {r.detail && <p className="mt-2 text-[13px] text-[#9aa0ae]">{r.detail}</p>}
                      {writable ? (
                        <form action={submitRequirement} className="mt-3 flex flex-col gap-2">
                          <input type="hidden" name="requirementId" value={r.id} />
                          <textarea
                            name="detail"
                            required
                            rows={3}
                            placeholder="Provide the requested information here..."
                            className="w-full rounded-lg border border-[#333a4c] bg-[#191d26] px-3 py-2 text-[13.5px] text-[#eeeee7] placeholder:text-[#676e7d]"
                          />
                          <button
                            type="submit"
                            className="self-start rounded-lg bg-[#f0b429] px-4 py-2 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                          >
                            Submit
                          </button>
                        </form>
                      ) : (
                        <p className="mt-3 text-[12px] text-[#676e7d]">
                          This item is being reviewed and can&apos;t be edited right now.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ),

            integrations: (
              <div className="flex flex-col gap-3">
                {project.integrations.length === 0 && (
                  <p className="text-sm text-[#9aa0ae]">No integrations set up for this project yet.</p>
                )}
                {project.integrations.map((i) => (
                  <div
                    key={i.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#232838] bg-[#0d1016] p-5"
                  >
                    <span className="text-[14.5px] font-bold capitalize">{i.provider}</span>
                    <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">
                      {INTEGRATION_STATUS_LABELS[i.status] ?? "Not connected"}
                    </span>
                  </div>
                ))}
              </div>
            ),

            files: (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-[#333a4c] bg-[#191d26] p-5">
                  <p className="text-[13.5px] text-[#9aa0ae]">
                    File uploads require storage setup and are not available yet. Documents shared with you will
                    appear in this list once that&apos;s wired up.
                  </p>
                </div>
                {project.documents.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {project.documents.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between rounded-xl border border-[#232838] bg-[#0d1016] p-4"
                      >
                        <span className="text-[13.5px]">{d.filename}</span>
                        <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">
                          {d.kind}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),

            messages: (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  {project.messages.length === 0 && <p className="text-sm text-[#9aa0ae]">No messages yet.</p>}
                  {project.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-4 ${
                        m.senderRole === "CLIENT"
                          ? "border-[#333a4c] bg-[#191d26]"
                          : "border-[#2a3550] bg-[#141a28]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.06em] text-[#f0b429]">
                          {m.senderRole === "CLIENT" ? "You" : "Zenith Studio"}
                        </span>
                        <span className="text-[11px] text-[#676e7d]">
                          {m.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[13.5px] text-[#eeeee7]">{m.body}</p>
                    </div>
                  ))}
                </div>
                <form action={sendMessage} className="flex flex-col gap-2 border-t border-[#232838] pt-4">
                  <textarea
                    name="body"
                    required
                    rows={3}
                    placeholder="Write a message..."
                    className="w-full rounded-lg border border-[#333a4c] bg-[#191d26] px-3 py-2 text-[13.5px] text-[#eeeee7] placeholder:text-[#676e7d]"
                  />
                  <button
                    type="submit"
                    className="self-start rounded-lg bg-[#f0b429] px-4 py-2 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                  >
                    Send
                  </button>
                </form>
              </div>
            ),

            performance: (
              <div>
                {project.metrics.length === 0 ? (
                  <div className="rounded-xl border border-[#333a4c] bg-[#191d26] p-5">
                    <p className="text-[13.5px] text-[#9aa0ae]">
                      Awaiting live data. Performance metrics will appear here once this project&apos;s systems are
                      live and reporting.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {project.metrics.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-xl border border-[#232838] bg-[#0d1016] p-4"
                      >
                        <span className="text-[13.5px] font-semibold">{m.key.replace(/_/g, " ")}</span>
                        <span className="font-[family-name:var(--font-course-mono)] text-[13px] text-[#f0b429]">
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),

            support: (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  {project.supportRequests.length === 0 && (
                    <p className="text-sm text-[#9aa0ae]">No support requests yet.</p>
                  )}
                  {project.supportRequests.map((s) => (
                    <div key={s.id} className="rounded-xl border border-[#232838] bg-[#0d1016] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[14.5px] font-bold">{s.subject}</span>
                        <span className="font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">
                          {SUPPORT_STATUS_LABELS[s.status] ?? s.status} &middot; {s.priority}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[13px] text-[#9aa0ae]">{s.body}</p>
                    </div>
                  ))}
                </div>
                <form action={submitSupportRequest} className="flex flex-col gap-2 border-t border-[#232838] pt-4">
                  <input
                    name="subject"
                    required
                    placeholder="Subject"
                    className="w-full rounded-lg border border-[#333a4c] bg-[#191d26] px-3 py-2 text-[13.5px] text-[#eeeee7] placeholder:text-[#676e7d]"
                  />
                  <textarea
                    name="body"
                    required
                    rows={3}
                    placeholder="Describe the issue or question..."
                    className="w-full rounded-lg border border-[#333a4c] bg-[#191d26] px-3 py-2 text-[13.5px] text-[#eeeee7] placeholder:text-[#676e7d]"
                  />
                  <select
                    name="priority"
                    defaultValue="MEDIUM"
                    className="w-fit rounded-lg border border-[#333a4c] bg-[#191d26] px-3 py-2 text-[13px] text-[#eeeee7]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                  <button
                    type="submit"
                    className="self-start rounded-lg bg-[#f0b429] px-4 py-2 text-[12.5px] font-bold text-[#1a1200] transition hover:brightness-110"
                  >
                    Submit request
                  </button>
                </form>
              </div>
            ),
          }}
        />
      </main>
    </div>
  );
}
