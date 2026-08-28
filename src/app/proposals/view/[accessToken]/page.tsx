import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  getClientIp,
  markProposalViewed,
  recordClientResponse,
  resolveProposalByToken,
} from "@/lib/proposals-public";
import { PROPOSAL_ITEM_KIND_LABELS, PROPOSAL_SECTION_LABELS, computeProposalTotals } from "@/lib/proposals-admin";

/* Token-secured, zero-account client-facing proposal view (Slice 5 of the
   service-platform build, 2026-08-28). No auth() call anywhere in this
   file — the accessToken in the URL is the entire access-control
   mechanism, exactly like /api/auth/claim's PurchaseClaim lookup. Renders
   one identical "invalid or expired" state for a garbage token, a
   well-formed-but-nonexistent token, an expired proposal, and a DRAFT
   proposal's token — none of those four cases is distinguishable from the
   outside. Studio-side dark cyan/fuchsia/emerald aesthetic, matching the
   marketing site (this is not a Lab-branded page). */

const RESPONDED_STATUSES = ["APPROVED", "CHANGES_REQUESTED", "DECLINED"];

export default async function ProposalViewPage({
  params,
}: {
  params: Promise<{ accessToken: string }>;
}) {
  const { accessToken } = await params;

  const proposal = await resolveProposalByToken(accessToken);

  if (!proposal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060a] px-6 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">This link is invalid or has expired</h1>
          <p className="mt-3 text-sm text-white/50">
            Double-check the link you were sent, or contact us if you believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  await markProposalViewed(proposal.id);

  const totals = computeProposalTotals(proposal.items);
  const coreItems = proposal.items.filter((i) => !i.isOptionalAddOn);
  const addOnItems = proposal.items.filter((i) => i.isOptionalAddOn);
  const alreadyResponded = RESPONDED_STATUSES.includes(proposal.status);

  async function respond(formData: FormData) {
    "use server";
    const token = String(formData.get("accessToken") || "");
    const action = String(formData.get("action") || "") as "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";
    const note = String(formData.get("note") || "");

    const h = await headers();
    const ip = getClientIp(h);

    await recordClientResponse(token, action, note, ip);
    revalidatePath(`/proposals/view/${token}`);
  }

  const sections = Object.keys(PROPOSAL_SECTION_LABELS) as (keyof typeof PROPOSAL_SECTION_LABELS)[];

  return (
    <div className="min-h-screen bg-[#05060a] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Zenith Studio Proposal</p>
        <h1 className="mt-2 text-3xl font-semibold">{proposal.companyName || proposal.clientName || "Your proposal"}</h1>
        <p className="mt-2 text-sm text-white/50">
          Prepared for {proposal.clientName || proposal.clientEmail}
          {proposal.companyName ? ` · ${proposal.companyName}` : ""}
        </p>

        <div className="mt-10 flex flex-col gap-8">
          {sections.map((key) => {
            const value = proposal[key];
            if (!value?.trim()) return null;
            return (
              <section key={key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-lg font-semibold text-cyan-300">{PROPOSAL_SECTION_LABELS[key]}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/80">{value}</p>
              </section>
            );
          })}

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-semibold text-cyan-300">Pricing</h2>

            <div className="mt-4 flex flex-col gap-2">
              {coreItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-white/80">
                    {item.label}
                    {item.unitLabel ? ` (${item.unitLabel})` : ""}
                    <span className="ml-2 text-xs text-white/40">{PROPOSAL_ITEM_KIND_LABELS[item.kind]}</span>
                  </span>
                  <span className={item.amountCents < 0 ? "text-emerald-400" : "text-white/90"}>
                    {item.amountCents < 0 ? "-" : ""}$
                    {(Math.abs(item.amountCents) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-sm font-semibold">
              <span>Core total</span>
              <span className="text-cyan-300">
                ${(totals.coreCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {addOnItems.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-semibold text-fuchsia-300">Optional add-ons</h3>
                <div className="mt-3 flex flex-col gap-2">
                  {addOnItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-white/80">
                        {item.label}
                        {item.unitLabel ? ` (${item.unitLabel})` : ""}
                      </span>
                      <span className="text-white/90">
                        ${(item.amountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold">
              <span>Total if all accepted</span>
              <span className="text-cyan-300">
                ${(totals.totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </section>

          {alreadyResponded ? (
            <section className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-6">
              <h2 className="text-lg font-semibold text-emerald-300">
                {proposal.status === "APPROVED" && "You approved this proposal"}
                {proposal.status === "CHANGES_REQUESTED" && "You requested changes"}
                {proposal.status === "DECLINED" && "You declined this proposal"}
              </h2>
              {proposal.approvals.length > 0 && (
                <ul className="mt-4 flex flex-col gap-3">
                  {proposal.approvals.map((a) => (
                    <li key={a.id} className="text-sm text-white/70">
                      <span className="font-semibold text-white/90">{a.action.replace("_", " ")}</span>
                      {" — "}
                      {a.respondedAt.toISOString().slice(0, 16).replace("T", " ")}
                      {a.note && <span className="mt-1 block whitespace-pre-wrap text-white/60">{a.note}</span>}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-sm text-white/50">
                Questions about this proposal? Reply to whoever sent you this link.
              </p>
            </section>
          ) : (
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-lg font-semibold">Your response</h2>
              <p className="mt-2 text-sm text-white/50">
                Approve to move forward, request changes with a note, or decline. This records your response —
                we&apos;ll follow up either way.
              </p>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start">
                <form action={respond}>
                  <input type="hidden" name="accessToken" value={accessToken} />
                  <input type="hidden" name="action" value="APPROVED" />
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                  >
                    Approve
                  </button>
                </form>

                <form action={respond} className="flex flex-1 flex-col gap-2">
                  <input type="hidden" name="accessToken" value={accessToken} />
                  <input type="hidden" name="action" value="CHANGES_REQUESTED" />
                  <textarea
                    name="note"
                    required
                    placeholder="What would you like changed?"
                    rows={2}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="self-start rounded-full border border-fuchsia-400/40 px-5 py-2.5 text-sm font-semibold text-fuchsia-300 transition hover:border-fuchsia-400/70"
                  >
                    Request changes
                  </button>
                </form>

                <form action={respond} className="flex flex-1 flex-col gap-2">
                  <input type="hidden" name="accessToken" value={accessToken} />
                  <input type="hidden" name="action" value="REJECTED" />
                  <textarea
                    name="note"
                    placeholder="Reason (optional)"
                    rows={2}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="self-start rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/35"
                  >
                    Decline
                  </button>
                </form>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
