import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOwnedServiceProject } from "@/lib/service-workspace";
import { planAgents, planAgentStatus, planKpiTiles, planActivityFeed, planApprovalItems, isSupportedPlan } from "@/lib/client-console-data";
import { KpiTile, ActivityRow, Eyebrow } from "./ui";
import { TeamMap, type MapAgent } from "./TeamMap";
import { HeaderActions } from "./HeaderActions";
import u from "./ui.module.css";
import s from "./overview.module.css";

/* Overview screen (design-system/screens.md #1), all 4 supported plans. */

// Inbox Manager is one real agent, but the design system's own README
// says to show it on the map as three stages (Sorting/Drafting/
// Decisions) rather than a single node - all three link to the one real
// agent detail page.
const INBOX_MANAGER_MAP_STAGES = [
  { id: "inbox", name: "Sorting" },
  { id: "inbox", name: "Drafting" },
  { id: "inbox", name: "Decisions" },
];

export default async function ClientConsoleOverview({ params }: { params: Promise<{ clientId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { clientId } = await params;
  const project = await getOwnedServiceProject(clientId, session.user.id);
  if (!project) notFound();
  if (!isSupportedPlan(project.sourceServiceId)) notFound();

  const agents = planAgents(project.sourceServiceId);
  const kpis = planKpiTiles(project);
  const activity = planActivityFeed(project);
  const approvals = planApprovalItems(project, (agentId) => `/services/dashboard/${clientId}/agents/${agentId}`);

  const mapAgents: MapAgent[] =
    project.sourceServiceId === "ai-inbox-manager"
      ? INBOX_MANAGER_MAP_STAGES.map((stage) => ({ id: stage.id, name: stage.name, icon: "mail", tone: planAgentStatus(project, "inbox").tone }))
      : agents.map((a) => ({ id: a.id, name: a.name, icon: a.icon, tone: a.real ? planAgentStatus(project, a.id).tone : "dim" }));

  const agentsOnShift = agents.filter((a) => a.real && planAgentStatus(project, a.id).tone === "run").length;
  const firstName = (session.user.name ?? "there").split(" ")[0];

  return (
    <div>
      <div className={s.header}>
        <div>
          <h1 className={s.greeting}>Good morning, {firstName}</h1>
          <p className={s.subline}>
            {agentsOnShift} agent{agentsOnShift === 1 ? "" : "s"} on shift &middot; {approvals.length} item{approvals.length === 1 ? "" : "s"} need
            you
          </p>
        </div>
        <HeaderActions />
      </div>

      <div className={`${u.kpiRow} ${s.kpis}`}>
        {kpis.map((k) => (
          <KpiTile key={k.label} label={k.label} value={k.value} />
        ))}
        <KpiTile label="Needs you" value={approvals.length} need />
      </div>

      <div className={s.body}>
        <section className={`${u.card} ${s.mapCard}`}>
          <div className={s.mapHead}>
            <Eyebrow>Team map</Eyebrow>
            <span className={s.liveTag}>
              <span className={s.liveDot} />
              Live
            </span>
          </div>
          <TeamMap agents={mapAgents} agentHref={(id) => `/services/dashboard/${clientId}/agents/${id}`} />
        </section>

        <div className={s.side}>
          {approvals.length > 0 ? (
            <Link href={`/services/dashboard/${clientId}/approvals`} className={u.needsYouCard}>
              <Eyebrow>Needs you</Eyebrow>
              <p className={u.needsYouTitle}>{approvals[0].title}</p>
              <p className={u.needsYouMeta}>{approvals[0].agentName}</p>
              <span className={u.textLink} style={{ marginTop: 12 }}>
                Review now &rarr;
              </span>
            </Link>
          ) : (
            <div className={`${u.needsYouCard} ${u.allClear}`}>
              <Eyebrow>Needs you</Eyebrow>
              <p className={u.needsYouTitle}>All clear</p>
              <p className={u.needsYouMeta}>Nothing needs you right now.</p>
            </div>
          )}

          <section className={`${u.card} ${s.activityCard}`}>
            <div className={s.activityHead}>
              <Eyebrow>Live activity</Eyebrow>
              <Link href={`/services/dashboard/${clientId}/activity`} className={u.textLink}>
                View all
              </Link>
            </div>
            <div style={{ marginTop: 8 }}>
              {activity.length === 0 && <p style={{ color: "var(--zc-muted)", fontSize: 14 }}>Nothing yet - check back once your agents start running.</p>}
              {activity.slice(0, 4).map((a, i) => (
                <ActivityRow key={i} tone={a.tone} text={a.text} meta={a.meta} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
