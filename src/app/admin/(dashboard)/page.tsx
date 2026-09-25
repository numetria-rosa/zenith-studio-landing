import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import {
  getHqClients,
  getMrrHistory,
  getHqActivityFeed,
  totalMrrCents,
  mrrByService,
  activeClientCountByService,
  fmtMoney,
  attentionQueue,
  SERVICE_ORDER,
  SERVICE_SHORT,
  SERVICE_COLOR,
} from "@/lib/hq";
import { listSupportRequestsForHq } from "@/lib/hq/queries";
import { HqTopbar } from "./HqTopbar";
import { Kpi } from "./Kpi";
import { MrrChart } from "./MrrChart";
import { AttentionQueue } from "./AttentionQueue";

/* Zenith HQ · Overview (DESIGN.md section 4.1). Every number here is a
   real query - no client-provided input drives anything, matching every
   other admin page's own convention. */
export default async function HqOverviewPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const [clients, months, activity, supportRequests] = await Promise.all([getHqClients(), getMrrHistory(), getHqActivityFeed(5), listSupportRequestsForHq()]);

  const mrr = totalMrrCents(clients);
  const lastMonth = months.length > 1 ? months[months.length - 2].totalCents : mrr;
  const delta = mrr - lastMonth;

  const now = new Date();
  const activeCount = clients.filter((c) => c.status === "active").length;
  const trials = clients.filter((c) => c.status === "trial");
  const pipelineCents = trials.reduce((sum, c) => sum + c.priceCents, 0);
  const soonTrials = trials.filter((c) => c.trialEndsAt && c.trialEndsAt.getTime() - now.getTime() <= 24 * 3600_000).length;

  const setups = clients.filter((c) => c.status === "setup");
  const nextSetup = setups
    .filter((c) => c.setupReadyBy)
    .sort((a, b) => a.setupReadyBy!.getTime() - b.setupReadyBy!.getTime())[0];
  const nextSetupHours = nextSetup ? Math.max(0, (nextSetup.setupReadyBy!.getTime() - now.getTime()) / 3600_000) : null;

  const openRequests = supportRequests.filter((r) => r.status === "OPEN");
  const queue = attentionQueue(
    clients,
    openRequests.map((r) => ({ id: r.id, clientId: r.projectId ?? "", clientName: r.project?.title ?? r.user.name ?? r.user.email, title: r.subject, ageLabel: "" })),
    now
  );

  const mix = SERVICE_ORDER.map((s) => ({ slug: s, mrr: mrrByService(clients, s), count: activeClientCountByService(clients, s) }));
  const maxMix = Math.max(1, ...mix.map((m) => m.mrr));

  return (
    <>
      <HqTopbar title={`Good morning, ${admin.user?.name?.split(" ")[0] || "there"}`} subtitle="Everything across every client, in one place." />

      <div className="kpis k6">
        <Kpi href="/admin/billing" label="MRR" value={fmtMoney(mrr)} sub={<em style={delta < 0 ? { color: "var(--amber-t)" } : undefined}>{delta >= 0 ? "+" : "−"}{fmtMoney(Math.abs(delta))} vs last month</em>} />
        <Kpi href="/admin/clients?status=active" label="Active clients" value={activeCount} sub={`of ${clients.length} total`} numeric={false} />
        <Kpi href="/admin/clients?status=trial" label="In free trial" value={trials.length} sub={`${fmtMoney(pipelineCents)}/mo if they convert`} numeric={false} />
        <Kpi href="/admin/onboarding" label="Setups running" value={setups.length} sub={nextSetupHours != null ? `next due in ${Math.round(nextSetupHours)}h` : "none"} warn={nextSetupHours != null && nextSetupHours <= 12} numeric={false} />
        <Kpi href="/admin/agents" label="Agent runs today" value="—" sub="not tracked per-run yet" />
        <Kpi href="#queue" label="Needs you" value={queue.length} sub={`${soonTrials} trial${soonTrials === 1 ? "" : "s"} end${soonTrials === 1 ? "s" : ""} within 24h`} need numeric={false} />
      </div>

      <div className="g2">
        <MrrChart months={months} />
        <section className="card pad">
          <div className="ctop">
            <h2>Revenue by service</h2>
            <Link href="/admin/services" className="link">
              Manage →
            </Link>
          </div>
          <div className="mix">
            {mix.map((m) => (
              <div className="row" key={m.slug}>
                <span>
                  <i style={{ background: SERVICE_COLOR[m.slug] }} />
                  {SERVICE_SHORT[m.slug]} <span className="muted">· {m.count}</span>
                </span>
                <span className="track">
                  <i style={{ width: `${(m.mrr / maxMix) * 100}%`, background: SERVICE_COLOR[m.slug] }} />
                </span>
                <b className="num">{fmtMoney(m.mrr)}</b>
              </div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
            MRR from active clients. The number after each service is its client count, paused excluded.
          </p>
        </section>
      </div>

      <div className="g2">
        <AttentionQueue items={queue} />
        <section className="card feed">
          <div className="feed-top">
            <span className="eyebrow">Live across clients</span>
            <Link href="/admin/agents" className="link">
              Agents
            </Link>
          </div>
          {activity.length === 0 && <p className="muted">Nothing yet.</p>}
          {activity.map((a, i) => (
            <div className="fi" key={i}>
              <i className={a.tone === "need" ? "t-amber" : a.tone === "run" || a.tone === "done" ? "t-mint" : "t-cyan"} />
              <div>
                <b>
                  {a.clientName} · {a.text}
                </b>
                <span>{timeAgo(a.at, now)}</span>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

function timeAgo(d: Date, now: Date): string {
  const ms = now.getTime() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}
