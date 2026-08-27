import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

/* Owner-facing list of free-audit intake submissions (Slice 3), each linking
   to the real per-audit review workspace at /admin/audits/[id] (Slice 4).
   Matches admin/service-requests and admin/service-catalog's own pattern
   exactly: requireAdmin() -> 404 (not a redirect) for non-admins, since the
   route's existence isn't something to confirm to a logged-in-but-not-you
   visitor. */
export default async function AdminAuditsPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const audits = await db.auditRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  const STATUS_LABELS: Record<string, string> = {
    SUBMITTED: "Submitted",
    IN_REVIEW: "In review",
    PROPOSAL_SENT: "Proposal sent",
    ACCEPTED: "Accepted",
    DECLINED: "Declined",
  };

  return (
    <div className="min-h-screen bg-[#05060a] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">Audit requests</h1>
        <p className="mt-1 text-sm text-white/50">{audits.length} total, newest first.</p>

        <div className="mt-8 flex flex-col gap-4">
          {audits.length === 0 && <p className="text-sm text-white/50">No audit requests yet.</p>}

          {audits.map((a) => (
            <Link
              key={a.id}
              href={`/admin/audits/${a.id}`}
              className="block rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-white/25 hover:bg-white/[0.06]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{a.companyName || "(no company given)"}</h2>
                  <p className="text-sm text-white/50">
                    {a.name || "(no name)"} · {a.email}
                  </p>
                </div>
                <span className="text-xs text-white/40">
                  {STATUS_LABELS[a.status] ?? a.status} · Submitted {a.createdAt.toISOString().slice(0, 10)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
