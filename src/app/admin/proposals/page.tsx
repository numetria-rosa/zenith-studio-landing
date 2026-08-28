import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { computeProposalTotals } from "@/lib/proposals-admin";

/* Owner-facing list of proposals (Slice 5 of the service-platform build,
   2026-08-28), matching admin/audits and admin/service-requests' own
   pattern exactly: requireAdmin() -> 404 (not a redirect) for non-admins. */
export default async function AdminProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const { status } = await searchParams;
  // Comma-separated status filter, e.g. ?status=SENT,VIEWED — added
  // additively for the /admin dashboard's pipeline links (Slice 2). No
  // param at all keeps the original unfiltered list.
  const statusList = status
    ? status
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const proposals = await db.proposal.findMany({
    where: statusList.length ? { status: { in: statusList as never[] } } : undefined,
    orderBy: { updatedAt: "desc" },
    include: { items: { select: { amountCents: true, isOptionalAddOn: true } } },
  });

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft",
    SENT: "Sent",
    VIEWED: "Viewed",
    CHANGES_REQUESTED: "Changes requested",
    APPROVED: "Approved",
    DECLINED: "Declined",
    EXPIRED: "Expired",
  };

  return (
    <div className="min-h-screen bg-[#05060a] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">Proposals</h1>
        <p className="mt-1 text-sm text-white/50">
          {proposals.length} {statusList.length ? "matching filter" : "total"}, most recently updated first.
          {statusList.length > 0 && (
            <>
              {" "}
              <Link href="/admin/proposals" className="underline hover:text-white">
                Clear filter
              </Link>
            </>
          )}
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {proposals.length === 0 && <p className="text-sm text-white/50">No proposals yet.</p>}

          {proposals.map((p) => {
            const totals = computeProposalTotals(p.items);
            return (
              <Link
                key={p.id}
                href={`/admin/proposals/${p.id}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-white/25 hover:bg-white/[0.06]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{p.companyName || p.clientName || p.clientEmail}</h2>
                    <p className="text-sm text-white/50">{p.clientEmail}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs uppercase tracking-wide text-white/40">
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                    <span className="block text-sm text-white/70">
                      ${(totals.totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="block text-xs text-white/40">
                      Updated {p.updatedAt.toISOString().slice(0, 10)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
