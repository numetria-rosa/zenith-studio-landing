import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getClientProfileByEmail } from "@/lib/client-directory";

/* Single merged client identity (Slice 3 of the business command center,
   2026-08-28). Route param is the lowercased, URL-encoded email — the only
   key that spans a pre-account lead (audit-only), a proposal-only lead, and
   a real User account. 404s (not a redirect, matching every other admin
   route) both for non-admins and for an email param that resolves to zero
   rows across all three source tables. */

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDateTime(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ");
}

const AUDIT_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In review",
  PROPOSAL_SENT: "Proposal sent",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
};

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

const PROJECT_STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  SCOPING: "Scoping",
  ONBOARDING: "Onboarding",
  BUILDING: "Building",
  QA: "QA",
  LIVE: "Live",
  MAINTENANCE: "Maintenance",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export default async function AdminClientProfilePage({
  params,
}: {
  params: Promise<{ identity: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const { identity } = await params;
  let email: string;
  try {
    email = decodeURIComponent(identity);
  } catch {
    notFound();
  }

  const profile = await getClientProfileByEmail(email);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-4xl">
        <Link href="/admin/clients" className="text-sm text-white/50 hover:text-white/80">
          &larr; All clients
        </Link>

        {/* Overview */}
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{profile.displayName}</h1>
            <p className="mt-1 text-sm text-white/50">{profile.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-400/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
                {profile.stageLabel}
              </span>
              {profile.userId && (
                <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-wide text-white/60">
                  {profile.role === "ADMIN" ? "Admin account" : "Has account"}
                </span>
              )}
              {!profile.userId && (
                <span className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-wide text-white/40">
                  No account yet
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold">{formatCents(profile.mrrCents)} MRR</p>
            <p className="text-xs text-white/40">{formatCents(profile.setupCents)} setup, all-time</p>
            {profile.userCreatedAt && (
              <p className="mt-1 text-xs text-white/40">Account since {profile.userCreatedAt.toISOString().slice(0, 10)}</p>
            )}
          </div>
        </div>

        {profile.services.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.services.map((s) => (
              <span
                key={s}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/60"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {profile.outstandingActions.length > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
            <p className="text-sm font-semibold text-amber-200">Outstanding</p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {profile.outstandingActions.map((a, i) => (
                <li key={i} className="text-sm text-amber-200/80">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Purchases / revenue */}
        <SectionCard title="Purchases &amp; revenue">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-wide text-white/40">Current MRR</p>
              <p className="mt-2 text-2xl font-semibold">{formatCents(profile.mrrCents)}</p>
              <p className="mt-1 text-xs text-white/40">Active ServiceRequest rows only.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-wide text-white/40">Confirmed setup revenue (all-time)</p>
              <p className="mt-2 text-2xl font-semibold">{formatCents(profile.setupCents)}</p>
              <p className="mt-1 text-xs text-white/40">ServiceRequest rows with a real Whop setup payment id.</p>
            </div>
          </div>
          <p className="text-xs text-white/40">
            Uses the same methodology as the main dashboard — never derived from Proposal or ServiceProject data,
            since approval isn&apos;t payment.
          </p>
        </SectionCard>

        {/* Audits */}
        <SectionCard title={`Audits (${profile.audits.length})`}>
          {profile.audits.length === 0 && <p className="text-sm text-white/50">No audit submissions.</p>}
          {profile.audits.map((a) => (
            <Link
              key={a.id}
              href={`/admin/audits/${a.id}`}
              className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/25 hover:bg-white/[0.06]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{a.companyName || a.name || a.email}</p>
                <span className="text-xs text-white/40">
                  {AUDIT_STATUS_LABELS[a.status] ?? a.status} · {a.createdAt.toISOString().slice(0, 10)}
                </span>
              </div>
            </Link>
          ))}
        </SectionCard>

        {/* Proposals */}
        <SectionCard title={`Proposals (${profile.proposals.length})`}>
          {profile.proposals.length === 0 && <p className="text-sm text-white/50">No proposals.</p>}
          {profile.proposals.map((p) => (
            <Link
              key={p.id}
              href={`/admin/proposals/${p.id}`}
              className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/25 hover:bg-white/[0.06]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{p.companyName || p.clientName || p.clientEmail}</p>
                <span className="text-xs text-white/40">
                  {PROPOSAL_STATUS_LABELS[p.status] ?? p.status} · {p.createdAt.toISOString().slice(0, 10)}
                </span>
              </div>
            </Link>
          ))}
        </SectionCard>

        {/* Services / projects */}
        <SectionCard title="Services &amp; projects">
          {profile.serviceRequests.length === 0 && profile.serviceProjects.length === 0 && (
            <p className="text-sm text-white/50">No service requests or projects.</p>
          )}
          {profile.serviceRequests.map((sr) => (
            <div key={sr.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{sr.serviceId}</p>
                <span className="text-xs text-white/40">
                  Status: {sr.status} · Monthly: {sr.monthlyStatus}
                </span>
              </div>
              {sr.adminNote && (
                <p className="mt-2 text-xs text-white/50">
                  <span className="text-white/30">Internal note: </span>
                  {sr.adminNote}
                </p>
              )}
              <p className="mt-2 text-[10px] uppercase tracking-wide text-white/30">
                <Link href="/admin/service-requests" className="hover:text-white/60">
                  View in service requests &rarr;
                </Link>
              </p>
            </div>
          ))}
          {profile.serviceProjects.map((sp) => (
            <Link
              key={sp.id}
              href={`/admin/projects/${sp.id}`}
              className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/25 hover:bg-white/[0.06]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{sp.title}</p>
                <span className="text-xs text-white/40">
                  {PROJECT_STAGE_LABELS[sp.stage] ?? sp.stage}
                  {sp.catalogService?.title ? ` · ${sp.catalogService.title}` : ""}
                </span>
              </div>
              {sp.adminNote && (
                <p className="mt-2 text-xs text-white/50">
                  <span className="text-white/30">Internal note: </span>
                  {sp.adminNote}
                </p>
              )}
              <p className="mt-2 text-[10px] uppercase tracking-wide text-white/30">View project &rarr;</p>
            </Link>
          ))}
        </SectionCard>

        {/* Messages */}
        <SectionCard title={`Messages (${profile.messages.length})`}>
          {profile.messages.length === 0 && <p className="text-sm text-white/50">No messages.</p>}
          {profile.messages.map((m) => (
            <div key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs font-semibold text-white/70">
                  {m.senderRole === "CLIENT" ? "Client" : "Admin"} · {m.senderName || m.senderEmail} · {m.projectTitle}
                </p>
                <span className="text-xs text-white/40">{formatDateTime(m.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm text-white/80">{m.body}</p>
            </div>
          ))}
        </SectionCard>

        {/* Support */}
        <SectionCard title={`Support requests (${profile.supportRequests.length})`}>
          {profile.supportRequests.length === 0 && <p className="text-sm text-white/50">No support requests.</p>}
          {profile.supportRequests.map((s) => (
            <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{s.subject}</p>
                <span className="text-xs text-white/40">
                  {s.status} · {s.priority} · {s.createdAt.toISOString().slice(0, 10)}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/70">{s.body}</p>
            </div>
          ))}
        </SectionCard>

        {/* Activity */}
        <section className="mt-10 mb-16">
          <h2 className="text-lg font-semibold">Activity</h2>
          <div className="mt-4 flex flex-col gap-2">
            {profile.activity.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
                No activity yet.
              </p>
            )}
            {profile.activity.map((ev) => (
              <Link
                key={ev.id}
                href={ev.href}
                className="flex items-baseline justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                <span className="text-white/90">{ev.label}</span>
                <span className="shrink-0 text-xs text-white/40">{formatDateTime(ev.at)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
  );
}
