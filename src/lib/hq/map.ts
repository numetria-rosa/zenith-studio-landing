import { planAgents, planAgentStatus, type ConsoleProject } from "@/lib/client-console-data";
import type { HqProjectRow } from "./queries";
import type { HqClient, HqAgent, BillingCycle, ServiceKey } from "./types";

const SETUP_STAGES = ["NEW", "SCOPING", "ONBOARDING", "BUILDING", "QA"] as const;

function statusFor(stage: string, trialEndsAt: Date | null, now: Date): HqClient["status"] {
  if (stage === "PAUSED") return "paused";
  if ((SETUP_STAGES as readonly string[]).includes(stage)) return "setup";
  if (trialEndsAt && trialEndsAt.getTime() > now.getTime()) return "trial";
  return "active";
}

function priceCentsFor(catalog: { monthlyPriceCents: number | null; quarterlyPriceCentsPerMonth: number | null } | null, billingCycle: BillingCycle): number {
  if (!catalog) return 0;
  if (billingCycle === "quarterly" && catalog.quarterlyPriceCentsPerMonth != null) return catalog.quarterlyPriceCentsPerMonth;
  return catalog.monthlyPriceCents ?? 0;
}

/* Maps a real ServiceProject row (+ its ServiceRequest's billing state, +
   its ServiceCatalog row for pricing) to Zenith HQ's client view model.
   Agents come from client-console-data.ts's own planAgents/planAgentStatus
   dispatcher - the exact same real per-plan logic the client dashboard
   itself renders, so a client never sees different agent status than the
   owner does. */
export function toHqClient(
  row: HqProjectRow,
  serviceRequest: { monthlyStatus: string; billingCycle: string; adminNote: string | null } | null,
  catalog: { monthlyPriceCents: number | null; quarterlyPriceCentsPerMonth: number | null; slaHours: number } | null,
  now: Date = new Date()
): HqClient {
  const service = row.sourceServiceId as ServiceKey;
  const billingCycle: BillingCycle = serviceRequest?.billingCycle === "quarterly" ? "quarterly" : "monthly";
  const status = statusFor(row.stage, row.trialEndsAt, now);
  const consoleProject = row as unknown as ConsoleProject;

  const agents: HqAgent[] = planAgents(service).map((def) => {
    const st = def.real ? planAgentStatus(consoleProject, def.id) : { tone: "dim" as const, stateLabel: "not set up", todayLabel: "Status", todayValue: "coming soon" };
    return { id: def.id, name: def.name, tone: st.tone, stateLabel: st.stateLabel, todayLabel: st.todayLabel, todayValue: st.todayValue, real: def.real };
  });

  const paymentOk = serviceRequest ? serviceRequest.monthlyStatus !== "canceled" : true;

  return {
    id: row.id,
    name: row.title,
    contactName: row.user.name || row.user.email,
    contactEmail: row.user.email,
    service,
    status,
    billingCycle,
    since: row.createdAt,
    health: status === "setup" ? null : computeHealth(consoleProject, agents, row.supportRequests, paymentOk, now),
    paymentOk,
    nextChargeAt: null, // resolved from Whop directly where shown (billing.ts), not stored locally
    setupStage: status === "setup" ? (row.setupStepsCompleted as 0 | 1 | 2) : null,
    setupReadyBy: row.setupReadyBy,
    trialEndsAt: row.trialEndsAt,
    agents,
    adminNote: row.adminNote ?? "",
    priceCents: priceCentsFor(catalog, billingCycle),
    slaHours: catalog?.slaHours ?? 24,
  };
}

/* v1 health formula - real signals only, no fabricated numbers. There is
   no per-agent run/error log yet (see the README's own "decide how the
   real one is calculated" note), so this leans on what IS real: whether
   any agent needs attention, stale open support tickets, recent activity,
   and payment health. Documented here so it's the one place to improve
   once real per-run telemetry exists. Pure function - no DB access - so
   it's directly unit-testable. */
export function computeHealth(
  project: ConsoleProject,
  agents: HqAgent[],
  supportRequests: { status: string; createdAt: Date }[],
  paymentOk: boolean,
  now: Date
): number {
  let score = 100;
  if (!paymentOk) score -= 30;
  if (agents.some((a) => a.real && a.tone === "need")) score -= 25;

  const staleOpen = supportRequests.filter((r) => r.status === "OPEN" && now.getTime() - r.createdAt.getTime() > 48 * 3600_000);
  score -= Math.min(30, staleOpen.length * 15);

  const activityDates = [
    ...project.leads.map((l) => l.createdAt),
    ...project.inboxDrafts.map((d) => d.createdAt),
    ...project.timeEntries.map((e) => e.entryDate),
    ...project.documents.map((d) => d.createdAt),
    ...project.insurancePolicies.map((p) => p.lastReminderSentAt).filter((d): d is Date => !!d),
  ];
  const lastActivity = activityDates.length ? Math.max(...activityDates.map((d) => d.getTime())) : null;
  if (lastActivity == null || now.getTime() - lastActivity > 14 * 24 * 3600_000) score -= 20;

  return Math.max(0, Math.min(100, score));
}
