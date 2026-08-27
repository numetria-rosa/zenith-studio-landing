import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

/* Read-only owner-facing view of free-audit intake submissions (Slice 3 of
   the service-platform build, 2026-08-28). Matches admin/service-requests
   and admin/service-catalog's own pattern exactly: requireAdmin() -> 404
   (not a redirect) for non-admins, since the route's existence isn't
   something to confirm to a logged-in-but-not-you visitor. No detail/review
   UI yet (findings, recommendations, "Create Proposal") — that's Slice 4. */
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
        <p className="mt-1 text-sm text-white/50">
          {audits.length} total, newest first. Read-only for now — review/findings UI is a later slice.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {audits.length === 0 && <p className="text-sm text-white/50">No audit requests yet.</p>}

          {audits.map((a) => (
            <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
