import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedServiceProject } from "@/lib/service-workspace";
import { planApprovalItems, planLabel, isSupportedPlan } from "@/lib/client-console-data";
import { Sidebar } from "./Sidebar";
import { AskYourTeamProvider } from "./AskYourTeam";
import consoleStyles from "./console.module.css";
import shell from "./sidebar.module.css";

/* Client console shell (Slice 9 - visual rebuild against the
   halo/client_dashboard_design_system/client-dashboard-frontend design
   system, 2026-09-24). Wraps every screen under this route: Overview,
   Agents, Agent detail, Activity, Approvals, Settings. Fetches the
   project once here via the cache()-wrapped getOwnedServiceProject; each
   child page calls it again with the same args (same IDOR-safe pattern
   every other action in this codebase follows - never trust a parent
   layout's check already passed), and React's cache() dedupes those
   into one query per request rather than one per screen. */

export default async function ClientConsoleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { clientId } = await params;
  const project = await getOwnedServiceProject(clientId, session.user.id);
  if (!project) notFound();
  // This design system (halo/client_dashboard_design_system) covers exactly
  // 4 bundle plans (see screens.md) - a standalone ai-receptionist/
  // ai-lead-capture purchase isn't part of it and has no new screens yet.
  if (!isSupportedPlan(project.sourceServiceId)) notFound();

  const approvalsCount = planApprovalItems(project, () => "").length;

  return (
    <div className={consoleStyles.console}>
      <AskYourTeamProvider projectId={clientId}>
        <div className={shell.shell}>
          <Sidebar
            clientId={clientId}
            planLabel={planLabel(project.sourceServiceId)}
            businessName={project.title}
            userName={session.user.name ?? null}
            userEmail={session.user.email ?? null}
            approvalsCount={approvalsCount}
          />
          <main className={shell.main}>{children}</main>
        </div>
      </AskYourTeamProvider>
    </div>
  );
}
