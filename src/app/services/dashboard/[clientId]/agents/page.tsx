import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOwnedServiceProject } from "@/lib/service-workspace";
import { planAgents, planAgentStatus, isSupportedPlan } from "@/lib/client-console-data";
import { Icon } from "../Icon";
import { StatusPill } from "../ui";
import u from "../ui.module.css";
import s from "./agents.module.css";

export default async function ClientConsoleAgents({ params }: { params: Promise<{ clientId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { clientId } = await params;
  const project = await getOwnedServiceProject(clientId, session.user.id);
  if (!project) notFound();
  if (!isSupportedPlan(project.sourceServiceId)) notFound();

  const agents = planAgents(project.sourceServiceId);

  return (
    <div>
      <h1 className={s.title}>Your agents</h1>
      <p className={s.subtitle}>{agents.length} agents working for {project.title}.</p>

      <div className={s.grid}>
        {agents.map((agent) => {
          const status = agent.real ? planAgentStatus(project, agent.id) : { tone: "dim" as const, stateLabel: "not set up", todayLabel: "Status", todayValue: "coming soon" };
          return (
            <Link key={agent.id} href={`/services/dashboard/${clientId}/agents/${agent.id}`} className={`${u.card} ${s.card}`}>
              <div className={s.cardHead}>
                <div className={s.iconTile}>
                  <Icon name={agent.icon} size={24} strokeWidth={1.6} />
                </div>
                <StatusPill tone={status.tone}>{status.stateLabel}</StatusPill>
              </div>
              <div className={s.name}>{agent.name}</div>
              <p className={s.desc}>{agent.description}</p>
              <div className={s.footer}>
                <span>{status.todayLabel}</span>
                <span className={s.footerValue}>{status.todayValue}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
