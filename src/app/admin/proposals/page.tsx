import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { computeProposalAmountBreakdown, computeProposalTotals } from "@/lib/proposals-admin";

/* Owner-facing list of proposals (Slice 5 of the service-platform build,
   2026-08-28; enhanced in Slice 5 of the admin command center, 2026-08-28),
   matching admin/audits and admin/service-requests' own pattern exactly:
   requireAdmin() -> 404 (not a redirect) for non-admins. */

const ALL_STATUSES = ["DRAFT", "SENT", "VIEWED", "CHANGES_REQUESTED", "APPROVED", "DECLINED", "EXPIRED"] as const;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

const SORT_OPTIONS = {
  updated: { label: "Last updated" },
  created: { label: "Date created" },
  amount: { label: "Amount" },
} as const;
type SortKey = keyof typeof SORT_OPTIONS;
function isSortKey(v: string | undefined): v is SortKey {
  return !!v && v in SORT_OPTIONS;
}

function fmtMoney(cents: number) {
  return `${cents < 0 ? "-" : ""}$${(Math.abs(cents) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default async function AdminProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sort?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const { status, q, sort: sortRaw } = await searchParams;

  // Comma-separated status filter, e.g. ?status=SENT,VIEWED — used by the
  // /admin dashboard's pipeline links. No param at all keeps the
  // unfiltered list. Now supports all 7 statuses, not a partial set.
  const statusList = status
    ? status
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const search = (q ?? "").trim();
  const sort: SortKey = isSortKey(sortRaw) ? sortRaw : "updated";

  const proposals = await db.proposal.findMany({
    where: statusList.length ? { status: { in: statusList as never[] } } : undefined,
    // Sorting by amount is computed (items aren't a DB column), so we
    // always fetch ordered by updatedAt and re-sort in memory below — the
    // row counts here are small (per client-directory.ts's own precedent
    // for in-application-code work at this scale).
    orderBy: { updatedAt: "desc" },
    include: { items: true },
  });

  // Search: case-insensitive substring across client name/email/company,
  // in application code — matching client-directory.ts's own approach
  // rather than a DB-level search feature at this data scale.
  const needle = search.toLowerCase();
  const filtered = needle
    ? proposals.filter((p) =>
        [p.clientName, p.clientEmail, p.companyName].some((f) => f?.toLowerCase().includes(needle))
      )
    : proposals;

  const now = Date.now();
  const rows = filtered.map((p) => {
    const totals = computeProposalTotals(p.items);
    const breakdown = computeProposalAmountBreakdown(p.items);
    // Display-only "(expired)" badge: expiresAt in the past but status
    // hasn't been explicitly transitioned. This never mutates the stored
    // row — resolveProposalByToken in proposals-public.ts already treats
    // a past-expiresAt proposal as unreachable regardless of stored
    // status, so a read-only badge here matches that existing behavior
    // instead of racing a background job against it.
    const isExpiredButNotMarked =
      p.status !== "EXPIRED" && !!p.expiresAt && p.expiresAt.getTime() < now;
    return { p, totals, breakdown, isExpiredButNotMarked };
  });

  rows.sort((a, b) => {
    if (sort === "created") return b.p.createdAt.getTime() - a.p.createdAt.getTime();
    if (sort === "amount") return b.totals.totalCents - a.totals.totalCents;
    return b.p.updatedAt.getTime() - a.p.updatedAt.getTime();
  });

  function chipHref(nextStatus: string | null) {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (search) params.set("q", search);
    if (sort !== "updated") params.set("sort", sort);
    const qs = params.toString();
    return `/admin/proposals${qs ? `?${qs}` : ""}`;
  }

  function sortHref(nextSort: SortKey) {
    const params = new URLSearchParams();
    if (statusList.length) params.set("status", statusList.join(","));
    if (search) params.set("q", search);
    if (nextSort !== "updated") params.set("sort", nextSort);
    const qs = params.toString();
    return `/admin/proposals${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold">Proposals</h1>
        <p className="mt-1 text-sm text-white/50">
          {rows.length} {statusList.length || search ? "matching" : "total"}
          {statusList.length || search ? (
            <>
              {" "}
              <Link href="/admin/proposals" className="underline hover:text-white">
                Clear filters
              </Link>
            </>
          ) : null}
        </p>

        {/* Status filter chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={chipHref(null)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              statusList.length === 0
                ? "border-white/60 bg-white/10 text-white"
                : "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
            }`}
          >
            All
          </Link>
          {ALL_STATUSES.map((s) => {
            const active = statusList.length === 1 && statusList[0] === s;
            return (
              <Link
                key={s}
                href={chipHref(s)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-300"
                    : "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                {STATUS_LABELS[s]}
              </Link>
            );
          })}
        </div>

        {/* Search + sort */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <form method="GET" className="flex items-center gap-2">
            {statusList.length > 0 && <input type="hidden" name="status" value={statusList.join(",")} />}
            {sort !== "updated" && <input type="hidden" name="sort" value={sort} />}
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search client, email, or company..."
              className="w-72 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm placeholder:text-white/30"
            />
            <button
              type="submit"
              className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:border-white/30 hover:text-white"
            >
              Search
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1 text-xs text-white/50">
            Sort:
            {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => (
              <Link
                key={key}
                href={sortHref(key)}
                className={`rounded-full border px-3 py-1.5 transition ${
                  sort === key
                    ? "border-white/60 bg-white/10 text-white"
                    : "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                {SORT_OPTIONS[key].label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {rows.length === 0 && <p className="text-sm text-white/50">No proposals match.</p>}

          {rows.map(({ p, totals, breakdown, isExpiredButNotMarked }) => (
            <Link
              key={p.id}
              href={`/admin/proposals/${p.id}`}
              className="block rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-white/25 hover:bg-white/[0.06]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{p.companyName || p.clientName || p.clientEmail}</h2>
                  <p className="text-sm text-white/50">{p.clientEmail}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                    {isExpiredButNotMarked && (
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                        (expired)
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-white/40">One-time / setup</p>
                      <p className="text-sm font-semibold text-white/90">{fmtMoney(breakdown.oneTimeCents)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-white/40">Recurring / mo</p>
                      <p className="text-sm font-semibold text-white/90">{fmtMoney(breakdown.recurringCents)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-white/40">Total (core)</p>
                      <p className="text-sm font-semibold text-cyan-300">{fmtMoney(totals.coreCents)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    Updated {p.updatedAt.toISOString().slice(0, 10)} · Created {p.createdAt.toISOString().slice(0, 10)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
  );
}
