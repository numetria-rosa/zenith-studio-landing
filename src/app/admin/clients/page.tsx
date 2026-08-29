import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { CLIENT_STAGE_LABELS, ClientStage, getClientDirectory } from "@/lib/client-directory";

/* Unified client directory (Slice 3 of the business command center,
   2026-08-28). Merges User / AuditRequest / Proposal / ServiceRequest /
   ServiceProject identities on lowercased email — see
   src/lib/client-directory.ts for the full merge approach. Matches every
   other admin page's pattern exactly: requireAdmin() -> notFound() for
   non-admins, dark #05060a Studio aesthetic, rounded-2xl border
   border-white/10 bg-white/[0.04] cards. */

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(d: Date | null): string {
  if (!d) return "-";
  return d.toISOString().slice(0, 10);
}

const STAGE_ORDER: ClientStage[] = ["ACTIVE_SERVICE", "APPROVED_PENDING", "PROPOSAL", "AUDIT_PROSPECT"];

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const { q, stage } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const stageFilter = stage && STAGE_ORDER.includes(stage as ClientStage) ? (stage as ClientStage) : null;

  const allClients = await getClientDirectory();

  const filtered = allClients.filter((c) => {
    if (stageFilter && c.stage !== stageFilter) return false;
    if (query) {
      const haystack = `${c.displayName} ${c.companyName ?? ""} ${c.email}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const stageCounts = new Map<ClientStage, number>();
  for (const c of allClients) stageCounts.set(c.stage, (stageCounts.get(c.stage) ?? 0) + 1);

  return (
    <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold">Clients</h1>
          <nav className="flex flex-wrap gap-4 text-sm text-white/50">
            <Link href="/admin" className="hover:text-white">
              Dashboard
            </Link>
            <Link href="/admin/audits" className="hover:text-white">
              Audits
            </Link>
            <Link href="/admin/proposals" className="hover:text-white">
              Proposals
            </Link>
            <Link href="/admin/service-requests" className="hover:text-white">
              Service requests
            </Link>
          </nav>
        </div>
        <p className="mt-1 text-sm text-white/50">
          {allClients.length} unique identit{allClients.length === 1 ? "y" : "ies"} across accounts, audits, and
          proposals.
        </p>

        {/* Search + filters */}
        <form className="mt-6 flex flex-wrap items-end gap-3" action="/admin/clients">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs text-white/50 mb-1" htmlFor="q">
              Search by name, company, or email
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q ?? ""}
              placeholder="e.g. sarah@example.com"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            />
          </div>
          {stageFilter && <input type="hidden" name="stage" value={stageFilter} />}
          <button
            type="submit"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            Search
          </button>
          {(query || stageFilter) && (
            <Link href="/admin/clients" className="text-sm text-white/50 underline hover:text-white">
              Clear all
            </Link>
          )}
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {STAGE_ORDER.map((s) => {
            const active = stageFilter === s;
            const href = active
              ? `/admin/clients${query ? `?q=${encodeURIComponent(query)}` : ""}`
              : `/admin/clients?stage=${s}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
            return (
              <Link
                key={s}
                href={href}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  active
                    ? "border-white bg-white text-black"
                    : "border-white/15 bg-white/[0.04] text-white/70 hover:border-white/30"
                }`}
              >
                {CLIENT_STAGE_LABELS[s]} ({stageCounts.get(s) ?? 0})
              </Link>
            );
          })}
        </div>

        {/* List */}
        <div className="mt-8 flex flex-col gap-4">
          {filtered.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
              No clients match this search/filter.
            </p>
          )}

          {filtered.map((c) => (
            <Link
              key={c.email}
              href={`/admin/clients/${encodeURIComponent(c.email)}`}
              className="block rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-white/25 hover:bg-white/[0.06]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{c.displayName}</h2>
                  <p className="text-sm text-white/50">{c.email}</p>
                  {c.services.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.services.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/60"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {c.outstandingActions.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-0.5">
                      {c.outstandingActions.map((a, i) => (
                        <li key={i} className="text-xs text-amber-300/80">
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-400/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
                    {c.stageLabel}
                  </span>
                  <p className="mt-2 text-sm font-semibold">{formatCents(c.mrrCents)} MRR</p>
                  <p className="text-xs text-white/40">{formatCents(c.setupCents)} setup, all-time</p>
                  <p className="mt-1 text-xs text-white/40">Last activity {formatDate(c.lastActivityAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
  );
}
