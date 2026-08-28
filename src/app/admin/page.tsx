import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import {
  getTopMetrics,
  getPipelineCounts,
  getNeedsAttention,
  getRecentActivity,
  getRevenueByService,
  summarizeRevenue,
  getPendingProposalValueCents,
  getServicePerformance,
  hasUnlinkedProposalItems,
} from "@/lib/dashboard-metrics";

/* Superadmin business command center index (Slice 2 of the service-platform
   build, 2026-08-28). Replaces the previously-nonexistent /admin route —
   there was no index page here before this slice, only its child routes
   (audits, proposals, service-requests, service-catalog). Matches every
   other admin page's pattern exactly: requireAdmin() -> notFound() for
   non-admins, dark #05060a / white-text Studio marketing aesthetic,
   rounded-2xl border border-white/10 bg-white/[0.04] cards. Every number on
   this page is a real server-side Prisma query — no client-side fetching,
   no client-provided input drives anything here. */

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatAge(ms: number): string {
  if (ms < 0) ms = 0;
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/40">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const [
    topMetrics,
    pipeline,
    needsAttention,
    recentActivity,
    revenueByService,
    pendingProposalValueCents,
    servicePerformance,
    hasUnlinkedItems,
  ] = await Promise.all([
    getTopMetrics(),
    getPipelineCounts(),
    getNeedsAttention(),
    getRecentActivity(20),
    getRevenueByService(),
    getPendingProposalValueCents(),
    getServicePerformance(),
    hasUnlinkedProposalItems(),
  ]);

  const revenueTotals = summarizeRevenue(revenueByService);
  const hasAnyRevenue = revenueTotals.mrrCents > 0 || revenueTotals.setupCents > 0;

  const PIPELINE_STAGES: { label: string; count: number; href: string | null }[] = [
    { label: "Audit (open)", count: pipeline.openAudits, href: "/admin/audits?status=SUBMITTED,IN_REVIEW" },
    { label: "Proposal (sent/viewed)", count: pipeline.sentOrViewedProposals, href: "/admin/proposals?status=SENT,VIEWED" },
    { label: "Approved", count: pipeline.approvedProposals, href: "/admin/proposals?status=APPROVED" },
    { label: "Building", count: pipeline.building, href: "/admin/projects?stage=BUILDING" },
    { label: "Live", count: pipeline.live, href: "/admin/projects?stage=LIVE" },
    { label: "Maintenance", count: pipeline.maintenance, href: "/admin/projects?stage=MAINTENANCE" },
  ];

  return (
    <div className="min-h-screen bg-[#05060a] px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold">Business dashboard</h1>
          <nav className="flex flex-wrap gap-4 text-sm text-white/50">
            <Link href="/admin/clients" className="hover:text-white">Clients</Link>
            <Link href="/admin/audits" className="hover:text-white">Audits</Link>
            <Link href="/admin/proposals" className="hover:text-white">Proposals</Link>
            <Link href="/admin/service-requests" className="hover:text-white">Service requests</Link>
            <Link href="/admin/service-catalog" className="hover:text-white">Service catalog</Link>
          </nav>
        </div>

        {/* A. Top metrics */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <MetricCard label="Total clients" value={String(topMetrics.totalClients)} />
          <MetricCard label="Active clients" value={String(topMetrics.activeClients)} />
          <MetricCard label="Active service projects" value={String(topMetrics.activeServiceProjects)} />
          <MetricCard label="MRR" value={formatCents(revenueTotals.mrrCents)} />
          <MetricCard label="One-time revenue (all-time)" value={formatCents(revenueTotals.setupCents)} />
          <MetricCard label="Pending proposals" value={String(topMetrics.pendingProposals)} />
          <MetricCard label="Open audits" value={String(topMetrics.openAudits)} />
          <MetricCard label="Open support requests" value={String(topMetrics.openSupportRequests)} />
        </div>

        {/* B. Business pipeline */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Pipeline</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {PIPELINE_STAGES.map((stage, i) => {
              const inner = (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center sm:min-w-[140px]">
                  <p className="text-xl font-semibold">{stage.count}</p>
                  <p className="mt-1 text-xs text-white/40">{stage.label}</p>
                </div>
              );
              return (
                <div key={stage.label} className="flex items-center gap-3">
                  {stage.href ? (
                    <Link href={stage.href} className="block transition hover:opacity-80">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                  {i < PIPELINE_STAGES.length - 1 && <span className="hidden text-white/20 sm:inline">&rarr;</span>}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-white/40">
            Every pipeline stage links to a filtered view — Audit/Proposal/Approved to their own admin pages,
            Building/Live/Maintenance to <code>/admin/projects</code> filtered by that ServiceProject stage.
          </p>
        </section>

        {/* C. Needs attention */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Needs attention</h2>
          <p className="mt-1 text-xs text-white/40">
            New audit submissions, proposals sent 3+ days ago with no response, approved proposals with no
            workspace yet, projects with missing client requirements, and open support requests. Does not include
            overdue internal tasks or unanswered client messages — neither a Task model nor a &quot;last admin
            reply&quot; concept exists yet.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {needsAttention.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
                Nothing needs attention right now.
              </p>
            )}
            {needsAttention.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/25 hover:bg-white/[0.06]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{item.clientLabel}</p>
                    <p className="text-sm text-white/60">{item.label}</p>
                  </div>
                  <span className="text-xs text-white/40">{formatAge(item.ageMs)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* E. Revenue overview */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Revenue overview</h2>
          {!hasAnyRevenue ? (
            <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
              Not much revenue data yet — this is a very new system. MRR and one-time revenue will populate as real
              Whop payments come in.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricCard label="MRR" value={formatCents(revenueTotals.mrrCents)} />
              <MetricCard label="One-time / setup revenue" value={formatCents(revenueTotals.setupCents)} />
              <MetricCard label="Active recurring services" value={String(revenueTotals.activeRecurringCount)} />
              <MetricCard label="Pending proposal value" value={formatCents(pendingProposalValueCents)} sub="pipeline, unconfirmed" />
            </div>
          )}
          <p className="mt-3 text-xs text-white/40">
            MRR and one-time revenue are shown separately and are never multiplied together or by a time period —
            doing so would imply revenue that hasn&apos;t actually been collected. Proposal-driven service projects
            with no matching ServiceRequest have genuinely unknown revenue (approval is not payment) and are
            excluded from these totals.
          </p>
        </section>

        {/* F. Service performance */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Service performance</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Active clients</th>
                  <th className="px-4 py-3">Pending proposals</th>
                  <th className="px-4 py-3">Active projects</th>
                  <th className="px-4 py-3">MRR</th>
                  <th className="px-4 py-3">Setup revenue</th>
                </tr>
              </thead>
              <tbody>
                {servicePerformance.map((row) => (
                  <tr key={row.serviceId} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/service-requests?service=${row.serviceId}`} className="hover:underline">
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{row.activeClients}</td>
                    <td className="px-4 py-3">{row.pendingProposals}</td>
                    <td className="px-4 py-3">{row.activeProjects}</td>
                    <td className="px-4 py-3">{formatCents(row.mrrCents)}</td>
                    <td className="px-4 py-3">{formatCents(row.setupCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasUnlinkedItems && (
            <p className="mt-3 text-xs text-white/40">
              Pending-proposal counts only include proposal line items explicitly linked to a service catalog
              entry. Some sent/viewed proposals have unlinked line items, so this table may undercount pending
              proposals for a given service — a real traceability gap, not a bug.
            </p>
          )}
        </section>

        {/* D. Recent activity */}
        <section className="mt-10 mb-8">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <div className="mt-4 flex flex-col gap-2">
            {recentActivity.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
                No activity yet.
              </p>
            )}
            {recentActivity.map((ev) => (
              <Link
                key={ev.id}
                href={ev.href}
                className="flex items-baseline justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                <span>
                  <span className="text-white/90">{ev.label}</span>
                  <span className="text-white/40"> — {ev.detail}</span>
                </span>
                <span className="shrink-0 text-xs text-white/40">{ev.at.toISOString().slice(0, 16).replace("T", " ")}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
