import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { STEPS } from "@/app/audit/fields";
import {
  AUDIT_STATUSES,
  AUDIT_STATUS_LABELS,
  FINDING_SEVERITIES,
  FINDING_SEVERITY_LABELS,
  RECOMMENDATION_PRIORITIES,
  RECOMMENDATION_PRIORITY_LABELS,
  updateAuditStatusAsAdmin,
  addFindingAsAdmin,
  addRecommendationAsAdmin,
} from "@/lib/audits-admin";
import { createProposalFromAudit } from "@/lib/proposals-admin";

/* Per-audit review workspace (Slice 4 of the service-platform build,
   2026-08-28). Turns the read-only Slice 3 list into a real page an admin
   works from: the submitter's answers organized by the same STEPS structure
   the public /audit form itself renders from, a findings section (list +
   add form), a recommendations section (list + add form, optionally linked
   to a real ServiceCatalog row), and a status control. Matches
   admin/service-requests/page.tsx's convention: requireAdmin() -> 404 for
   non-admins (not a redirect — the route's existence isn't confirmable to a
   logged-in-but-not-you visitor), and every server action re-checks
   requireAdmin() itself rather than trusting the page having rendered,
   since a server action is a POST-able RPC endpoint a determined attacker
   could hit directly without ever loading this page. */
export default async function AdminAuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const { id } = await params;

  const audit = await db.auditRequest.findUnique({
    where: { id },
    include: {
      findings: { orderBy: { createdAt: "desc" } },
      recommendations: { orderBy: { createdAt: "desc" }, include: { catalogService: { select: { title: true } } } },
      proposals: { orderBy: { createdAt: "desc" }, select: { id: true, status: true, createdAt: true } },
    },
  });
  if (!audit) notFound();

  const catalogServices = await db.serviceCatalog.findMany({
    where: { active: true },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  const answers = (audit.formAnswers ?? {}) as Record<string, unknown>;

  async function updateStatus(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;

    const auditId = String(formData.get("auditId") || "");
    const status = String(formData.get("status") || "");
    await updateAuditStatusAsAdmin(auditId, status);
    revalidatePath(`/admin/audits/${auditId}`);
  }

  async function addFinding(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;

    const auditId = String(formData.get("auditId") || "");
    await addFindingAsAdmin({
      auditId,
      title: String(formData.get("title") || ""),
      severity: String(formData.get("severity") || ""),
      description: String(formData.get("description") || ""),
      currentImpact: String(formData.get("currentImpact") || ""),
      recommendedSolution: String(formData.get("recommendedSolution") || ""),
    });
    revalidatePath(`/admin/audits/${auditId}`);
  }

  const auditId = audit.id;
  async function createProposal() {
    "use server";
    const session = await requireAdmin();
    if (!session) return;

    const result = await createProposalFromAudit(auditId);
    if (result.ok) redirect(`/admin/proposals/${result.id}`);
  }

  async function addRecommendation(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;

    const auditId = String(formData.get("auditId") || "");
    await addRecommendationAsAdmin({
      auditId,
      title: String(formData.get("title") || ""),
      priority: String(formData.get("priority") || ""),
      rationale: String(formData.get("rationale") || ""),
      expectedOutcome: String(formData.get("expectedOutcome") || ""),
      estimatedEffort: String(formData.get("estimatedEffort") || ""),
      catalogServiceId: String(formData.get("catalogServiceId") || ""),
    });
    revalidatePath(`/admin/audits/${auditId}`);
  }

  return (
    <div className="min-h-screen bg-[#05060a] px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/audits" className="text-sm text-white/50 hover:text-white/80">
          &larr; All audit requests
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{audit.companyName || "(no company given)"}</h1>
            <p className="mt-1 text-sm text-white/50">
              {audit.name || "(no name)"} · {audit.email}
            </p>
            <p className="mt-1 text-xs text-white/40">
              Submitted {audit.createdAt.toISOString().slice(0, 10)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <form action={updateStatus} className="flex items-end gap-2">
              <input type="hidden" name="auditId" value={audit.id} />
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={audit.status}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                >
                  {AUDIT_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-[#05060a]">
                      {AUDIT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Save
              </button>
            </form>

            {audit.proposals.length > 0 && (
              <div className="flex flex-col items-end gap-1">
                {audit.proposals.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/proposals/${p.id}`}
                    className="text-xs text-white/50 hover:text-white/80"
                  >
                    Proposal ({p.status}) &middot; {p.createdAt.toISOString().slice(0, 10)}
                  </Link>
                ))}
              </div>
            )}

            <form action={createProposal}>
              <button
                type="submit"
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/35"
              >
                Create Proposal
              </button>
            </form>
          </div>
        </div>

        {/* Submission answers, organized by the same STEPS structure the
            public /audit form renders from. */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Submission</h2>
          <div className="mt-4 flex flex-col gap-6">
            {STEPS.map((step) => (
              <div key={step.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-1 text-xs text-white/40">{step.description}</p>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {step.fields.map((f) => {
                    const value = answers[f.key];
                    const display =
                      value === undefined || value === null || value === ""
                        ? "—"
                        : String(value);
                    return (
                      <div key={f.key}>
                        <dt className="text-xs text-white/50">{f.label}</dt>
                        <dd className="mt-1 text-sm text-white/85 whitespace-pre-wrap">{display}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            ))}
          </div>
        </section>

        {/* Findings */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Findings</h2>

          <div className="mt-4 flex flex-col gap-4">
            {audit.findings.length === 0 && <p className="text-sm text-white/50">No findings yet.</p>}
            {audit.findings.map((f) => (
              <div key={f.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <span className="text-xs uppercase tracking-wide text-white/40">
                    {FINDING_SEVERITY_LABELS[f.severity]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/70 whitespace-pre-wrap">{f.description}</p>
                <p className="mt-2 text-xs text-white/50">
                  <span className="text-white/40">Current impact: </span>
                  {f.currentImpact}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  <span className="text-white/40">Recommended solution: </span>
                  {f.recommendedSolution}
                </p>
              </div>
            ))}
          </div>

          <form action={addFinding} className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <input type="hidden" name="auditId" value={audit.id} />
            <h3 className="text-sm font-semibold text-white/80">Add finding</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="finding-title">
                  Title
                </label>
                <input
                  id="finding-title"
                  name="title"
                  required
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="finding-severity">
                  Severity
                </label>
                <select
                  id="finding-severity"
                  name="severity"
                  defaultValue="MEDIUM"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                >
                  {FINDING_SEVERITIES.map((s) => (
                    <option key={s} value={s} className="bg-[#05060a]">
                      {FINDING_SEVERITY_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-white/50 mb-1" htmlFor="finding-description">
                  Description
                </label>
                <textarea
                  id="finding-description"
                  name="description"
                  required
                  rows={3}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="finding-currentImpact">
                  Current impact
                </label>
                <textarea
                  id="finding-currentImpact"
                  name="currentImpact"
                  required
                  rows={2}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="finding-recommendedSolution">
                  Recommended solution
                </label>
                <textarea
                  id="finding-recommendedSolution"
                  name="recommendedSolution"
                  required
                  rows={2}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Add finding
            </button>
          </form>
        </section>

        {/* Recommendations */}
        <section className="mt-10 mb-16">
          <h2 className="text-lg font-semibold">Recommendations</h2>

          <div className="mt-4 flex flex-col gap-4">
            {audit.recommendations.length === 0 && (
              <p className="text-sm text-white/50">No recommendations yet.</p>
            )}
            {audit.recommendations.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold">{r.title}</h3>
                  <span className="text-xs uppercase tracking-wide text-white/40">
                    {RECOMMENDATION_PRIORITY_LABELS[r.priority]}
                  </span>
                </div>
                {r.catalogService && (
                  <p className="mt-1 text-xs text-white/40">Linked service: {r.catalogService.title}</p>
                )}
                <p className="mt-2 text-sm text-white/70 whitespace-pre-wrap">{r.rationale}</p>
                <p className="mt-2 text-xs text-white/50">
                  <span className="text-white/40">Expected outcome: </span>
                  {r.expectedOutcome}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  <span className="text-white/40">Estimated effort: </span>
                  {r.estimatedEffort}
                </p>
              </div>
            ))}
          </div>

          <form action={addRecommendation} className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <input type="hidden" name="auditId" value={audit.id} />
            <h3 className="text-sm font-semibold text-white/80">Add recommendation</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="rec-title">
                  Title
                </label>
                <input
                  id="rec-title"
                  name="title"
                  required
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="rec-priority">
                  Priority
                </label>
                <select
                  id="rec-priority"
                  name="priority"
                  defaultValue="MEDIUM"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                >
                  {RECOMMENDATION_PRIORITIES.map((p) => (
                    <option key={p} value={p} className="bg-[#05060a]">
                      {RECOMMENDATION_PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-white/50 mb-1" htmlFor="rec-catalogServiceId">
                  Link to a catalog service (optional)
                </label>
                <select
                  id="rec-catalogServiceId"
                  name="catalogServiceId"
                  defaultValue=""
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                >
                  <option value="" className="bg-[#05060a]">
                    (none)
                  </option>
                  {catalogServices.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#05060a]">
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-white/50 mb-1" htmlFor="rec-rationale">
                  Rationale
                </label>
                <textarea
                  id="rec-rationale"
                  name="rationale"
                  required
                  rows={3}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="rec-expectedOutcome">
                  Expected outcome
                </label>
                <textarea
                  id="rec-expectedOutcome"
                  name="expectedOutcome"
                  required
                  rows={2}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="rec-estimatedEffort">
                  Estimated effort
                </label>
                <input
                  id="rec-estimatedEffort"
                  name="estimatedEffort"
                  required
                  placeholder="e.g. 2-4 days"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Add recommendation
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
