import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  PROPOSAL_ITEM_KINDS,
  PROPOSAL_ITEM_KIND_LABELS,
  PROPOSAL_SECTION_LABELS,
  addProposalItemAsAdmin,
  computeProposalTotals,
  deleteProposalItemAsAdmin,
  sendProposalAsAdmin,
  updateProposalSectionsAsAdmin,
} from "@/lib/proposals-admin";

/* Proposal builder (Slice 5 of the service-platform build, 2026-08-28).
   Every section is an editable textarea/input saved via a server action;
   line items are a small repeatable editor with a live-computed total.
   Matches admin/audits/[id]'s convention: requireAdmin() -> 404 for
   non-admins, every server action re-checks requireAdmin() itself. */

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

export default async function AdminProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const { id } = await params;

  const proposal = await db.proposal.findUnique({
    where: { id },
    include: {
      items: { orderBy: { order: "asc" } },
      approvals: { orderBy: { respondedAt: "asc" } },
      audit: { select: { id: true } },
    },
  });
  if (!proposal) notFound();

  const catalogServices = await db.serviceCatalog.findMany({
    where: { active: true },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  const totals = computeProposalTotals(proposal.items);

  const h = await headers();
  const origin = h.get("x-forwarded-proto")
    ? `${h.get("x-forwarded-proto")}://${h.get("host")}`
    : `http://${h.get("host")}`;
  const publicUrl = `${origin}/proposals/view/${proposal.accessToken}`;

  async function updateSections(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;

    const proposalId = String(formData.get("proposalId") || "");
    await updateProposalSectionsAsAdmin(proposalId, {
      clientEmail: String(formData.get("clientEmail") || ""),
      clientName: String(formData.get("clientName") || ""),
      companyName: String(formData.get("companyName") || ""),
      executiveSummary: String(formData.get("executiveSummary") || ""),
      currentChallenges: String(formData.get("currentChallenges") || ""),
      recommendedSolution: String(formData.get("recommendedSolution") || ""),
      scopeOfWork: String(formData.get("scopeOfWork") || ""),
      deliverables: String(formData.get("deliverables") || ""),
      implementationPlan: String(formData.get("implementationPlan") || ""),
      timeline: String(formData.get("timeline") || ""),
      assumptions: String(formData.get("assumptions") || ""),
      notIncluded: String(formData.get("notIncluded") || ""),
      nextSteps: String(formData.get("nextSteps") || ""),
      terms: String(formData.get("terms") || ""),
    });
    revalidatePath(`/admin/proposals/${proposalId}`);
  }

  async function addItem(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;

    const proposalId = String(formData.get("proposalId") || "");
    await addProposalItemAsAdmin({
      proposalId,
      label: String(formData.get("label") || ""),
      kind: String(formData.get("kind") || ""),
      amountDollars: String(formData.get("amountDollars") || ""),
      unitLabel: String(formData.get("unitLabel") || ""),
      isOptionalAddOn: formData.get("isOptionalAddOn") === "on",
      catalogServiceId: String(formData.get("catalogServiceId") || ""),
    });
    revalidatePath(`/admin/proposals/${proposalId}`);
  }

  async function deleteItem(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;

    const proposalId = String(formData.get("proposalId") || "");
    const itemId = String(formData.get("itemId") || "");
    await deleteProposalItemAsAdmin(itemId);
    revalidatePath(`/admin/proposals/${proposalId}`);
  }

  async function sendProposal(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;

    const proposalId = String(formData.get("proposalId") || "");
    await sendProposalAsAdmin(proposalId);
    revalidatePath(`/admin/proposals/${proposalId}`);
  }

  return (
    <div className="min-h-screen bg-[#05060a] px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/proposals" className="text-sm text-white/50 hover:text-white/80">
          &larr; All proposals
        </Link>
        {proposal.audit && (
          <>
            {" · "}
            <Link href={`/admin/audits/${proposal.audit.id}`} className="text-sm text-white/50 hover:text-white/80">
              Source audit
            </Link>
          </>
        )}

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{proposal.companyName || proposal.clientName || proposal.clientEmail}</h1>
            <p className="mt-1 text-sm text-white/50">{proposal.clientEmail}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-white/40">
              {STATUS_LABELS[proposal.status] ?? proposal.status}
            </p>
          </div>

          <form action={sendProposal}>
            <input type="hidden" name="proposalId" value={proposal.id} />
            <button
              type="submit"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              {proposal.status === "DRAFT" ? "Send to client" : "Re-send (new version)"}
            </button>
          </form>
        </div>

        {proposal.sentAt && (
          <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
            <p className="text-sm text-white/80">
              Client link (no email is sent automatically — copy this and share it with the client yourself):
            </p>
            <p className="mt-1 break-all text-sm text-cyan-300">{publicUrl}</p>
          </div>
        )}

        {proposal.approvals.length > 0 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white/80">Client response history</p>
            <ul className="mt-2 flex flex-col gap-2">
              {proposal.approvals.map((a) => (
                <li key={a.id} className="text-sm text-white/70">
                  <span className="font-semibold">{a.action.replace("_", " ")}</span>
                  {" — "}
                  {a.respondedAt.toISOString().slice(0, 16).replace("T", " ")}
                  {a.note && <span className="block text-xs text-white/50">{a.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Client information */}
        <form action={updateSections} className="mt-10">
          <input type="hidden" name="proposalId" value={proposal.id} />

          <section>
            <h2 className="text-lg font-semibold">Client information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="clientEmail">
                  Email
                </label>
                <input
                  id="clientEmail"
                  name="clientEmail"
                  defaultValue={proposal.clientEmail}
                  required
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="clientName">
                  Name
                </label>
                <input
                  id="clientName"
                  name="clientName"
                  defaultValue={proposal.clientName ?? ""}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="companyName">
                  Company
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  defaultValue={proposal.companyName ?? ""}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Proposal document</h2>
            <div className="mt-4 flex flex-col gap-6">
              {(Object.keys(PROPOSAL_SECTION_LABELS) as (keyof typeof PROPOSAL_SECTION_LABELS)[]).map((key) => (
                <div key={key}>
                  <label className="block text-xs text-white/50 mb-1" htmlFor={key}>
                    {PROPOSAL_SECTION_LABELS[key]}
                  </label>
                  <textarea
                    id={key}
                    name={key}
                    defaultValue={proposal[key] ?? ""}
                    rows={key === "executiveSummary" || key === "scopeOfWork" ? 5 : 3}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </section>

          <button
            type="submit"
            className="mt-6 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            Save document
          </button>
        </form>

        {/* Line items */}
        <section className="mt-10 mb-16">
          <h2 className="text-lg font-semibold">Pricing &amp; line items</h2>

          <div className="mt-4 flex flex-col gap-3">
            {proposal.items.length === 0 && <p className="text-sm text-white/50">No line items yet.</p>}
            {proposal.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {item.label}
                    {item.isOptionalAddOn && (
                      <span className="ml-2 rounded-full border border-fuchsia-400/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-fuchsia-300">
                        Optional add-on
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-white/50">
                    {PROPOSAL_ITEM_KIND_LABELS[item.kind]}
                    {item.unitLabel ? ` · ${item.unitLabel}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm font-semibold ${item.amountCents < 0 ? "text-emerald-400" : "text-white/90"}`}
                  >
                    {item.amountCents < 0 ? "-" : ""}$
                    {(Math.abs(item.amountCents) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <form action={deleteItem}>
                    <input type="hidden" name="proposalId" value={proposal.id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <button type="submit" className="text-xs text-white/40 hover:text-red-400">
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div>
              <p className="text-xs text-white/40">Core total</p>
              <p className="text-lg font-semibold">
                ${(totals.coreCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40">Optional add-ons</p>
              <p className="text-lg font-semibold">
                ${(totals.addOnCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40">Total if all accepted</p>
              <p className="text-lg font-semibold text-cyan-300">
                ${(totals.totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <form action={addItem} className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <input type="hidden" name="proposalId" value={proposal.id} />
            <h3 className="text-sm font-semibold text-white/80">Add line item</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="item-label">
                  Label
                </label>
                <input
                  id="item-label"
                  name="label"
                  required
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="item-kind">
                  Kind
                </label>
                <select
                  id="item-kind"
                  name="kind"
                  defaultValue="SETUP"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                >
                  {PROPOSAL_ITEM_KINDS.map((k) => (
                    <option key={k} value={k} className="bg-[#05060a]">
                      {PROPOSAL_ITEM_KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="item-amount">
                  Amount ($ — enter positive; discounts are stored negative automatically)
                </label>
                <input
                  id="item-amount"
                  name="amountDollars"
                  type="number"
                  step="0.01"
                  required
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="item-unitLabel">
                  Unit label (optional, e.g. &quot;per file&quot;)
                </label>
                <input
                  id="item-unitLabel"
                  name="unitLabel"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1" htmlFor="item-catalogServiceId">
                  Link to a catalog service (optional)
                </label>
                <select
                  id="item-catalogServiceId"
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
              <div className="flex items-center gap-2">
                <input id="item-isOptionalAddOn" name="isOptionalAddOn" type="checkbox" className="h-4 w-4" />
                <label className="text-xs text-white/70" htmlFor="item-isOptionalAddOn">
                  Optional add-on (not part of the core total)
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Add line item
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
