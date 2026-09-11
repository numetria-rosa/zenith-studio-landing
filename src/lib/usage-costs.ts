import { db } from "@/lib/db";
import { sendAdminAlert } from "@/lib/outreach-mail";
import { catalogPricesForService } from "@/lib/service-pages";

/* Per-client API cost tracking and soft-cap margin protection. Every live
   service (Receptionist via Vapi, the SignalWire-based services, Billing
   Clerk via Groq) incurs real per-use cost with nothing currently stopping
   one client's usage from eating the user's stated 70% margin target, or
   even alerting anyone if it happens. This closes that gap.

   Reuses ServiceMetric (key "api_cost_cents") rather than a new table, one
   client's monthly cost is just a sum over existing rows, exactly the kind
   of generic key/value log this model already exists for.

   ponytail: per-event cost rates below are estimates, not reconciled
   against real provider invoices (Vapi's real per-call cost is read from
   its webhook payload when present and is accurate; SignalWire SMS/voice
   and Groq costs are flat-rate estimates since neither returns real
   billed cost synchronously). Good enough to catch a runaway client or a
   margin problem; true these up against actual monthly bills periodically
   rather than trusting them as exact accounting. */

// Cents. SignalWire's list pricing for US local SMS/voice trigger is
// roughly $0.0079-0.01 per message/leg; Groq's Llama 3.3 70B is roughly
// $0.59/$0.79 per 1M prompt/completion tokens, a single narrative/
// qualification call is a few hundred tokens, call it a fraction of a cent
// rounded up to 1 cent as a conservative estimate.
export const ESTIMATED_COST_CENTS = {
  SIGNALWIRE_SMS: 1,
  SIGNALWIRE_VOICE_TRIGGER: 1,
  GROQ_CALL: 1,
  // Fallback only, used when a Vapi webhook payload has no real cost field.
  VAPI_PER_MINUTE_FALLBACK: 10,
} as const;

const USAGE_METRIC_KEY = "api_cost_cents";

export async function recordUsageCost(projectId: string, costCents: number, source: string): Promise<void> {
  if (costCents <= 0) return;
  await db.serviceMetric.create({ data: { projectId, key: USAGE_METRIC_KEY, value: costCents } });
  await checkBudgetThresholds(projectId, source);
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getMonthlyCostCents(projectId: string): Promise<number> {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const rows = await db.serviceMetric.findMany({
    where: { projectId, key: USAGE_METRIC_KEY, recordedAt: { gte: monthStart } },
    select: { value: true },
  });
  return rows.reduce((sum, r) => sum + r.value, 0);
}

const DEFAULT_MONTHLY_BUDGET_CENTS = 6000; // fallback only, used when no price can be resolved at all

/** 30% of the client's monthly price, targeting the user's stated 70% net
    margin. Price is resolved from the static SERVICES catalog via the
    project's sourceServiceId, same source the checkout pages themselves
    use, not invented here. */
export async function resolveMonthlyBudgetCents(projectId: string): Promise<number> {
  const project = await db.serviceProject.findUnique({ where: { id: projectId }, select: { sourceServiceId: true } });
  if (!project?.sourceServiceId) return DEFAULT_MONTHLY_BUDGET_CENTS;

  const { monthlyCents } = catalogPricesForService(project.sourceServiceId);
  if (monthlyCents <= 0) return DEFAULT_MONTHLY_BUDGET_CENTS;
  return Math.round(monthlyCents * 0.3);
}

function budgetAutoPauseMarkerKey(): string {
  return `budget_auto_paused_${currentMonthKey()}`;
}

/** Whether this project's current PAUSED state was set by the hard cap
    below (vs. an admin manually pausing it) - drives the admin page's
    "why is this paused" messaging, since the Pause/Resume button itself
    can't tell the two apart. */
export async function isBudgetAutoPaused(projectId: string): Promise<boolean> {
  const marker = await db.serviceMetric.findFirst({ where: { projectId, key: budgetAutoPauseMarkerKey() } });
  return marker !== null;
}

/** Fires an admin alert exactly once per threshold per calendar month, not
    on every single event once past it, dedupe via a marker ServiceMetric
    row so a restart/redeploy can't lose the "already alerted" state.

    At 100%, also auto-pauses the project (reusing the same PAUSED stage
    and isProjectPaused gate the admin's manual Pause button already
    enforces on every AI-driven webhook/cron), a hard stop rather than
    just an alert. Previously left unenforced deliberately, to avoid
    breaking a live client's phone/SMS over a soft cost estimate; the
    dashboard's own usage bar and admin alert give enough warning at 90%
    to catch a false positive before it bites, and an admin can resume to
    LIVE in one click if this fires wrongly. */
async function checkBudgetThresholds(projectId: string, source: string): Promise<void> {
  const [spentCents, budgetCents] = await Promise.all([
    getMonthlyCostCents(projectId),
    resolveMonthlyBudgetCents(projectId),
  ]);
  if (budgetCents <= 0) return;

  const pct = spentCents / budgetCents;
  const threshold = pct >= 1 ? 100 : pct >= 0.9 ? 90 : null;
  if (threshold === null) return;

  const markerKey = `budget_alert_${threshold}_${currentMonthKey()}`;
  const existing = await db.serviceMetric.findFirst({ where: { projectId, key: markerKey } });
  if (existing) return;

  await db.serviceMetric.create({ data: { projectId, key: markerKey, value: 1 } });

  const project = await db.serviceProject.findUnique({ where: { id: projectId }, select: { title: true, stage: true } });

  let autoPaused = false;
  if (threshold >= 100 && project?.stage !== "PAUSED") {
    await db.serviceProject.update({ where: { id: projectId }, data: { stage: "PAUSED" } });
    await db.serviceMetric.create({ data: { projectId, key: budgetAutoPauseMarkerKey(), value: 1 } });
    autoPaused = true;
  }

  await sendAdminAlert(
    threshold >= 100
      ? `Usage over budget${autoPaused ? " - project auto-paused" : ""}: ${project?.title ?? projectId}`
      : `Usage approaching budget (90%): ${project?.title ?? projectId}`,
    `This month's API cost is $${(spentCents / 100).toFixed(2)} against a $${(budgetCents / 100).toFixed(2)} budget (30% of plan price, targeting 70% margin). Last event: ${source}.${
      autoPaused
        ? " This project has been automatically paused - every AI-driven call, text, and follow-up is now blocked until you resume it from the admin project page. If this is a false positive, resume it there; otherwise it stays paused until next month's budget resets."
        : ""
    }`
  );
}
