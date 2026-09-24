import type { IconName } from "@/app/services/dashboard/[clientId]/Icon";

/* Shapes real ServiceProject data into what the client console's screens
   need (KPI tiles, team map nodes, workflow steps, activity feed,
   approvals) - the design system (screens.md) specifies exact content
   per plan; this is where that spec meets the real Prisma data instead
   of sample data.

   Honesty note: not every agent priced/sold actually has a working
   backend yet. Verified against the real provisioning code while
   building this: Brokerage's Transaction Coordinator and Database
   Manager, and Insurance's Intake Agent, have no engine wired up at all
   (only the ISA/lead-capture engine, and Insurance's Document
   Audit/CRM Logging/Renewal Reminders, are real - see
   lead-capture-provisioning.ts and service-projects.ts's requirement
   sets). Those agents render an honest "not set up yet" state instead of
   a fake running workflow - a client should never see invented activity
   for something that doesn't actually run. */

export type Tone = "run" | "need" | "done" | "dim";
export type PlanId = "law-firms" | "insurance-ai-team" | "brokerages" | "ai-inbox-manager" | "ai-receptionist" | "ai-lead-capture";

export const SUPPORTED_PLANS: PlanId[] = ["law-firms", "insurance-ai-team", "brokerages", "ai-inbox-manager", "ai-receptionist", "ai-lead-capture"];

export function isSupportedPlan(sourceServiceId: string | null): sourceServiceId is PlanId {
  return SUPPORTED_PLANS.includes(sourceServiceId as PlanId);
}

export type AgentDefinition = {
  id: string;
  name: string;
  icon: IconName;
  description: string;
  /** false = priced/sold but genuinely not built yet - renders an honest
      "not set up" state everywhere instead of fake activity. */
  real: boolean;
};

export type WorkflowStep = {
  title: string;
  kind: string;
  detail: string;
  state: "done" | "current" | "pending" | "human-pending" | "human-waiting";
};

export type AgentStatus = {
  tone: Tone;
  stateLabel: string;
  todayLabel: string;
  todayValue: string | number;
};

// Only ServiceProject's real fields this file reads - kept narrow so
// callers can pass the exact shape getOwnedServiceProject already
// returns without re-selecting anything.
export type ConsoleProject = {
  id: string;
  sourceServiceId: string | null;
  integrations: { provider: string; status: string; config: unknown }[];
  timeEntries: { id: string; status: string; matterName: string; narrative: string; entryDate: Date; durationMinutes: number | null }[];
  leads: { id: string; name: string | null; status: string; createdAt: Date; sequenceStep: number; sequenceStoppedAt: Date | null }[];
  requirements: { id: string; label: string; status: string }[];
  inboxDrafts: { id: string; status: string; subject: string; createdAt: Date }[];
  mailConnections: { id: string; status: string; emailAddress: string }[];
  documents: { id: string; filename: string; summary: string | null; createdAt: Date }[];
  insurancePolicies: { id: string; clientName: string; renewalDate: Date; lastReminderSentAt: Date | null }[];
  metrics: { key: string; value: number }[];
};

function hasIntegration(project: ConsoleProject, provider: string): boolean {
  return project.integrations.some((i) => i.provider === provider && i.status === "CONNECTED");
}

function metricTotal(project: ConsoleProject, key: string): number {
  return project.metrics.filter((m) => m.key === key).reduce((sum, m) => sum + m.value, 0);
}

// Shared by Brokerage's ISA and the standalone AI Lead Capture & Follow-Up
// plan - both are the same signalwire-backed engine (provisionLeadCaptureIfNeeded),
// just sold under different names/bundles.
function leadResponseStatus(project: ConsoleProject): AgentStatus {
  const connected = hasIntegration(project, "signalwire");
  const leadsToday = project.leads.filter((l) => l.status !== "LOST").length;
  if (!connected) return { tone: "dim", stateLabel: "idle", todayLabel: "Leads answered", todayValue: 0 };
  return { tone: "run", stateLabel: "running", todayLabel: "Leads answered", todayValue: leadsToday };
}

function leadResponseWorkflowSteps(project: ConsoleProject): WorkflowStep[] {
  const connected = hasIntegration(project, "signalwire");
  return [
    { title: "New lead", kind: "trigger", detail: "website or referral", state: connected ? "current" : "pending" },
    { title: "First text sent", kind: "sms", detail: "instant reply", state: connected ? "done" : "pending" },
    { title: "Qualify", kind: "qualify", detail: "against your rules", state: connected ? "done" : "pending" },
    { title: "Notify you", kind: "notify", detail: "email the moment they qualify", state: connected ? "done" : "pending" },
    { title: "Follow up until they reply", kind: "handoff", detail: "automatic sequence", state: connected ? "done" : "pending" },
  ];
}

function leadResponseActivityFeed(project: ConsoleProject, agentName: string): ActivityEvent[] {
  return project.leads
    .map((l) => ({ tone: (l.status === "LOST" ? "dim" : "run") as Tone, text: l.status === "LOST" ? `Lead went cold: ${l.name ?? "a lead"}` : `Answered a new lead: ${l.name ?? "a lead"}`, meta: `${agentName} · ${l.createdAt.toISOString().slice(0, 10)}`, at: l.createdAt }))
    .sort((a, b) => b.at.getTime() - a.at.getTime());
}

// ---------- Law firm ----------

export const LAW_FIRM_AGENTS: AgentDefinition[] = [
  { id: "billing-clerk", name: "AI Billing Clerk", icon: "dollar", real: true, description: "Reconstructs billable time from your calendar and email, drafts entries, and waits for your approval." },
  { id: "text-back", name: "Missed Call Text-Back", icon: "phone", real: true, description: "Texts back every missed call in seconds, qualifies against your case criteria, and books the consult." },
  { id: "follow-up-clerk", name: "AI Follow-Up Clerk", icon: "message", real: true, description: "Works the leads that didn't retain until they book, reply, or the sequence runs out." },
];

function billingClerkStatus(project: ConsoleProject): AgentStatus {
  const connected = project.timeEntries.length > 0 || project.requirements.some((r) => r.label.includes("attorney"));
  const drafts = project.timeEntries.filter((e) => e.status === "DRAFT").length;
  const approvedToday = project.timeEntries.filter((e) => e.status === "APPROVED").length;
  if (drafts > 0) return { tone: "need", stateLabel: "waiting on you", todayLabel: "Entries waiting", todayValue: drafts };
  if (!connected) return { tone: "dim", stateLabel: "idle", todayLabel: "Entries drafted", todayValue: 0 };
  return { tone: "run", stateLabel: "running", todayLabel: "Entries approved", todayValue: approvedToday };
}

function textBackStatus(project: ConsoleProject): AgentStatus {
  const connected = hasIntegration(project, "signalwire");
  const leadsToday = project.leads.filter((l) => l.status !== "LOST").length;
  if (!connected) return { tone: "dim", stateLabel: "idle", todayLabel: "Missed calls answered", todayValue: 0 };
  return { tone: "run", stateLabel: "running", todayLabel: "Missed calls answered", todayValue: leadsToday };
}

function followUpClerkStatus(project: ConsoleProject): AgentStatus {
  const connected = hasIntegration(project, "signalwire");
  const inSequence = project.leads.filter((l) => l.status === "IN_SEQUENCE" && !l.sequenceStoppedAt).length;
  if (!connected) return { tone: "dim", stateLabel: "idle", todayLabel: "Leads in sequence", todayValue: 0 };
  return { tone: "run", stateLabel: "running", todayLabel: "Leads in sequence", todayValue: inSequence };
}

function lawFirmKpiTiles(project: ConsoleProject): { label: string; value: string | number }[] {
  const handledToday = project.leads.length + project.timeEntries.filter((e) => e.status === "APPROVED").length;
  const agentsOnShift = LAW_FIRM_AGENTS.filter((a) => lawFirmAgentStatus(project, a.id).tone === "run").length;
  return [
    { label: "Handled today", value: handledToday },
    { label: "Avg. text-back time", value: hasIntegration(project, "signalwire") ? "< 1 min" : "–" },
    { label: "Agents on shift", value: agentsOnShift },
  ];
}

function lawFirmWorkflowSteps(project: ConsoleProject, agentId: string): WorkflowStep[] {
  if (agentId === "billing-clerk") {
    const drafts = project.timeEntries.filter((e) => e.status === "DRAFT").length;
    const connected = hasIntegration(project, "signalwire") || project.timeEntries.length > 0;
    return [
      { title: "Scan your day", kind: "trigger", detail: "calendar + email", state: connected ? "done" : "pending" },
      { title: "Match matters", kind: "match", detail: "client + case", state: connected ? "done" : "pending" },
      { title: "Draft entries", kind: "draft", detail: `${project.timeEntries.length} total`, state: connected ? "done" : "pending" },
      { title: "Invoice timing", kind: "check", detail: "inside 14-day window", state: connected ? "done" : "pending" },
      { title: "You approve entries", kind: "human review", detail: drafts > 0 ? `${drafts} waiting` : "none waiting", state: drafts > 0 ? "human-waiting" : connected ? "human-pending" : "pending" },
    ];
  }
  if (agentId === "text-back") {
    const connected = hasIntegration(project, "signalwire");
    return [
      { title: "Missed call detected", kind: "trigger", detail: "voice webhook", state: connected ? "current" : "pending" },
      { title: "Text sent to caller", kind: "sms", detail: "qualifying questions", state: connected ? "done" : "pending" },
      { title: "Case criteria checked", kind: "qualify", detail: "practice area, jurisdiction", state: connected ? "done" : "pending" },
      { title: "Consult booked", kind: "calendar", detail: "confirmed", state: connected ? "done" : "pending" },
      { title: "Added to calendar", kind: "notify", detail: "next", state: connected ? "done" : "pending" },
    ];
  }
  const inSequence = project.leads.filter((l) => l.status === "IN_SEQUENCE" && !l.sequenceStoppedAt).length;
  return [
    { title: "Pick leads that didn't retain", kind: "trigger", detail: `${inSequence} in sequence`, state: inSequence > 0 ? "current" : "pending" },
    { title: "Day 2: text", kind: "sms", detail: "check-in", state: inSequence > 0 ? "done" : "pending" },
    { title: "Day 7: email", kind: "email", detail: "follow-up", state: inSequence > 0 ? "done" : "pending" },
    { title: "Day 21: final check-in", kind: "sms", detail: "last touch", state: inSequence > 0 ? "done" : "pending" },
    { title: "Rebook if they reply", kind: "handoff", detail: "to your team", state: inSequence > 0 ? "done" : "pending" },
  ];
}

function lawFirmActivityFeed(project: ConsoleProject): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const e of project.timeEntries) {
    events.push({
      tone: e.status === "DRAFT" ? "need" : e.status === "APPROVED" ? "done" : "dim",
      text: e.status === "DRAFT" ? `Drafted a time entry: ${e.matterName}` : e.status === "APPROVED" ? `Entry approved: ${e.matterName}` : `Entry rejected: ${e.matterName}`,
      meta: `AI Billing Clerk · ${e.entryDate.toISOString().slice(0, 10)}`,
      at: e.entryDate,
    });
  }
  for (const l of project.leads) {
    events.push({
      tone: l.status === "LOST" ? "dim" : "run",
      text: l.status === "LOST" ? `Sequence ended for ${l.name ?? "a lead"}` : `Texted back a missed call from ${l.name ?? "a caller"}`,
      meta: `Missed Call Text-Back · ${l.createdAt.toISOString().slice(0, 10)}`,
      at: l.createdAt,
    });
  }
  return events.sort((a, b) => b.at.getTime() - a.at.getTime());
}

function lawFirmApprovalItems(project: ConsoleProject, agentHref: (agentId: string) => string): ApprovalItem[] {
  const items: ApprovalItem[] = [];
  for (const e of project.timeEntries.filter((t) => t.status === "DRAFT")) {
    items.push({
      id: e.id,
      kind: "timeEntry",
      title: `${e.matterName} · ${e.durationMinutes ? `${(e.durationMinutes / 60).toFixed(1)}h` : "expense"}`,
      meta: e.narrative,
      agentName: "AI Billing Clerk",
      href: agentHref("billing-clerk"),
    });
  }
  for (const d of project.inboxDrafts.filter((x) => x.status === "DRAFT")) {
    items.push({ id: d.id, kind: "inboxDraft", title: d.subject, meta: "Reply drafted, waiting on your review", agentName: "Inbox", href: agentHref("text-back") });
  }
  return items;
}

// ---------- Insurance ----------

export const INSURANCE_AGENTS: AgentDefinition[] = [
  { id: "intake", name: "Intake Agent", icon: "phone", real: false, description: "Replies to every quote request with a real text, the moment it comes in." },
  { id: "document-audit", name: "Document Audit", icon: "file", real: true, description: "Reads a policy document, ACORD form, or loss run and pulls the key fields in seconds." },
  { id: "crm", name: "CRM & Logging", icon: "database", real: true, description: "Every lead touch gets logged straight into your own CRM." },
  { id: "renewals", name: "Renewal Reminders", icon: "calendar", real: true, description: "Tracks your whole book of business and reminds clients before their policy renews." },
];

function insuranceAgentStatus(project: ConsoleProject, agentId: string): AgentStatus {
  if (agentId === "intake") return { tone: "dim", stateLabel: "not set up", todayLabel: "Quote requests answered", todayValue: 0 };
  if (agentId === "document-audit") {
    const today = project.documents.filter((d) => d.summary).length;
    return { tone: today > 0 ? "run" : "dim", stateLabel: today > 0 ? "running" : "idle", todayLabel: "Documents audited", todayValue: today };
  }
  if (agentId === "crm") {
    const connected = hasIntegration(project, "crm");
    return connected
      ? { tone: "run", stateLabel: "running", todayLabel: "Leads logged", todayValue: "–" }
      : { tone: "dim", stateLabel: "idle", todayLabel: "Leads logged", todayValue: 0 };
  }
  const dueSoon = project.insurancePolicies.filter((p) => (p.renewalDate.getTime() - Date.now()) / 86400000 <= 30).length;
  return project.insurancePolicies.length > 0
    ? { tone: dueSoon > 0 ? "run" : "done", stateLabel: "running", todayLabel: "Renewals due within 30 days", todayValue: dueSoon }
    : { tone: "dim", stateLabel: "idle", todayLabel: "Book of business", todayValue: 0 };
}

function insuranceKpiTiles(project: ConsoleProject): { label: string; value: string | number }[] {
  const handledToday = project.documents.length;
  const agentsOnShift = INSURANCE_AGENTS.filter((a) => a.real && insuranceAgentStatus(project, a.id).tone === "run").length;
  return [
    { label: "Handled today", value: handledToday },
    { label: "Avg. reply time", value: hasIntegration(project, "crm") ? "< 1 min" : "–" },
    { label: "Agents on shift", value: agentsOnShift },
  ];
}

function insuranceWorkflowSteps(project: ConsoleProject, agentId: string): WorkflowStep[] {
  if (agentId === "document-audit") {
    const has = project.documents.length > 0;
    return [
      { title: "Document uploaded", kind: "trigger", detail: "PDF or pasted text", state: has ? "done" : "pending" },
      { title: "Read the document", kind: "match", detail: "policy, ACORD, or loss run", state: has ? "done" : "pending" },
      { title: "Pull the fields", kind: "draft", detail: "named insured, limits, dates", state: has ? "done" : "pending" },
      { title: "Flag red flags", kind: "check", detail: "lapses, exclusions", state: has ? "done" : "pending" },
      { title: "You copy into your AMS", kind: "human review", detail: "no AMS access needed", state: has ? "human-pending" : "pending" },
    ];
  }
  if (agentId === "crm") {
    const connected = hasIntegration(project, "crm");
    return [
      { title: "Lead captured", kind: "trigger", detail: "quote request or referral", state: connected ? "current" : "pending" },
      { title: "Match the contact", kind: "match", detail: "existing or new", state: connected ? "done" : "pending" },
      { title: "Write the record", kind: "draft", detail: "your CRM's fields", state: connected ? "done" : "pending" },
      { title: "Log the conversation", kind: "notify", detail: "full history", state: connected ? "done" : "pending" },
      { title: "Visible in your CRM", kind: "check", detail: "no manual entry", state: connected ? "done" : "pending" },
    ];
  }
  const has = project.insurancePolicies.length > 0;
  const dueSoon = project.insurancePolicies.filter((p) => (p.renewalDate.getTime() - Date.now()) / 86400000 <= 30).length;
  return [
    { title: "Book of business imported", kind: "trigger", detail: `${project.insurancePolicies.length} clients`, state: has ? "done" : "pending" },
    { title: "Scan for renewals", kind: "match", detail: "30-day window", state: has ? "done" : "pending" },
    { title: "Draft the reminder", kind: "draft", detail: "per client", state: has ? "done" : "pending" },
    { title: "You approve the batch", kind: "human review", detail: dueSoon > 0 ? `${dueSoon} due soon` : "none due", state: dueSoon > 0 ? "human-waiting" : has ? "human-pending" : "pending" },
    { title: "Sent at 9:00am", kind: "notify", detail: "email", state: has ? "done" : "pending" },
  ];
}

function insuranceActivityFeed(project: ConsoleProject): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const d of project.documents) {
    events.push({ tone: "done", text: `Audited a document: ${d.filename}`, meta: `Document Audit · ${d.createdAt.toISOString().slice(0, 10)}`, at: d.createdAt });
  }
  for (const p of project.insurancePolicies) {
    if (p.lastReminderSentAt) {
      events.push({ tone: "done", text: `Renewal reminder sent to ${p.clientName}`, meta: `Renewal Reminders · ${p.lastReminderSentAt.toISOString().slice(0, 10)}`, at: p.lastReminderSentAt });
    }
  }
  return events.sort((a, b) => b.at.getTime() - a.at.getTime());
}

function insuranceApprovalItems(project: ConsoleProject, agentHref: (agentId: string) => string): ApprovalItem[] {
  const dueSoon = project.insurancePolicies.filter((p) => !p.lastReminderSentAt && (p.renewalDate.getTime() - Date.now()) / 86400000 <= 30);
  if (dueSoon.length === 0) return [];
  return [
    {
      id: "renewals-batch",
      kind: "renewalBatch",
      title: `${dueSoon.length} renewal reminder${dueSoon.length === 1 ? "" : "s"} ready`,
      meta: dueSoon.map((p) => p.clientName).slice(0, 3).join(", "),
      agentName: "Renewal Reminders",
      href: agentHref("renewals"),
    },
  ];
}

// ---------- Brokerage ----------

export const BROKERAGE_AGENTS: AgentDefinition[] = [
  { id: "isa", name: "AI Inside Sales Agent", icon: "phone", real: true, description: "Answers new leads in seconds, qualifies motivation, timeline, and financing, and books the appointment." },
  { id: "tc", name: "AI Transaction Coordinator", icon: "file", real: false, description: "Contract to close - deadlines tracked, documents chased, every party updated." },
  { id: "db", name: "AI Database Manager", icon: "database", real: false, description: "Wakes up the dormant contacts and past clients already sitting in your CRM." },
];

function brokerageAgentStatus(project: ConsoleProject, agentId: string): AgentStatus {
  if (agentId !== "isa") return { tone: "dim", stateLabel: "not set up", todayLabel: "Status", todayValue: "coming soon" };
  return leadResponseStatus(project);
}

function brokerageKpiTiles(project: ConsoleProject): { label: string; value: string | number }[] {
  const handledToday = project.leads.length;
  const agentsOnShift = brokerageAgentStatus(project, "isa").tone === "run" ? 1 : 0;
  return [
    { label: "Handled today", value: handledToday },
    { label: "Avg. lead reply", value: hasIntegration(project, "signalwire") ? "< 1 min" : "–" },
    { label: "Agents on shift", value: agentsOnShift },
  ];
}

function brokerageWorkflowSteps(project: ConsoleProject, agentId: string): WorkflowStep[] {
  if (agentId !== "isa") return [];
  const connected = hasIntegration(project, "signalwire");
  return [
    { title: "New lead", kind: "trigger", detail: "website or referral", state: connected ? "current" : "pending" },
    { title: "First text sent", kind: "sms", detail: "instant reply", state: connected ? "done" : "pending" },
    { title: "Qualify", kind: "qualify", detail: "motivation, timeline, financing", state: connected ? "done" : "pending" },
    { title: "Book showing", kind: "calendar", detail: "confirmed", state: connected ? "done" : "pending" },
    { title: "Added to your calendar", kind: "notify", detail: "next", state: connected ? "done" : "pending" },
  ];
}

function brokerageActivityFeed(project: ConsoleProject): ActivityEvent[] {
  return leadResponseActivityFeed(project, "AI Inside Sales Agent");
}

function brokerageApprovalItems(): ApprovalItem[] {
  return [];
}

// ---------- AI Receptionist (standalone) ----------

export const RECEPTIONIST_AGENTS: AgentDefinition[] = [
  { id: "receptionist", name: "AI Receptionist", icon: "phone", real: true, description: "Answers every call, handles your FAQs and hours, books what it can, and transfers the rest." },
];

function receptionistAgentStatus(project: ConsoleProject): AgentStatus {
  const connected = hasIntegration(project, "vapi");
  const callsHandled = metricTotal(project, "calls_received");
  if (!connected) return { tone: "dim", stateLabel: "idle", todayLabel: "Calls handled", todayValue: 0 };
  return { tone: "run", stateLabel: "running", todayLabel: "Calls handled", todayValue: callsHandled };
}

function receptionistKpiTiles(project: ConsoleProject): { label: string; value: string | number }[] {
  const connected = hasIntegration(project, "vapi");
  const callsHandled = metricTotal(project, "calls_received");
  const durationSeconds = metricTotal(project, "call_duration_seconds");
  const avgCallTime = callsHandled > 0 ? `${Math.round(durationSeconds / callsHandled)}s` : "–";
  return [
    { label: "Calls handled", value: callsHandled },
    { label: "Avg. call length", value: avgCallTime },
    { label: "Agents on shift", value: connected ? 1 : 0 },
  ];
}

function receptionistWorkflowSteps(project: ConsoleProject): WorkflowStep[] {
  const connected = hasIntegration(project, "vapi");
  return [
    { title: "Call comes in", kind: "trigger", detail: "answered in one ring", state: connected ? "current" : "pending" },
    { title: "Answer FAQs", kind: "qualify", detail: "your hours & info", state: connected ? "done" : "pending" },
    { title: "Book if requested", kind: "calendar", detail: "confirmed", state: connected ? "done" : "pending" },
    { title: "Escalate if needed", kind: "handoff", detail: "transferred to your fallback number", state: connected ? "done" : "pending" },
    { title: "Logged", kind: "notify", detail: "call summary", state: connected ? "done" : "pending" },
  ];
}

// No per-call log is kept, only aggregate ClientMetric counters - an
// honest activity feed for this plan has nothing event-level to show.
function receptionistActivityFeed(): ActivityEvent[] {
  return [];
}

function receptionistApprovalItems(): ApprovalItem[] {
  return [];
}

// ---------- AI Lead Capture & Follow-Up (standalone) ----------

export const LEAD_CAPTURE_AGENTS: AgentDefinition[] = [
  { id: "lead-capture", name: "AI Lead Capture & Follow-Up", icon: "phone", real: true, description: "Answers every new lead in seconds, qualifies them against your rules, and follows up automatically until they reply or go cold." },
];

function leadCaptureKpiTiles(project: ConsoleProject): { label: string; value: string | number }[] {
  const connected = hasIntegration(project, "signalwire");
  return [
    { label: "Handled today", value: project.leads.length },
    { label: "Avg. reply time", value: connected ? "< 1 min" : "–" },
    { label: "Agents on shift", value: connected ? 1 : 0 },
  ];
}

// ---------- AI Inbox Manager ----------

export const INBOX_MANAGER_AGENTS: AgentDefinition[] = [
  { id: "inbox", name: "AI Inbox Manager", icon: "mail", real: true, description: "Sorts your inbox and drafts replies to the routine ones, so your day starts with decisions, not admin." },
];

function inboxManagerAgentStatus(project: ConsoleProject): AgentStatus {
  const connected = project.mailConnections.some((c) => c.status === "CONNECTED");
  const drafts = project.inboxDrafts.filter((d) => d.status === "DRAFT").length;
  if (drafts > 0) return { tone: "need", stateLabel: "waiting on you", todayLabel: "Drafts waiting", todayValue: drafts };
  if (!connected) return { tone: "dim", stateLabel: "idle", todayLabel: "Emails sorted", todayValue: 0 };
  return { tone: "run", stateLabel: "running", todayLabel: "Emails sorted", todayValue: project.inboxDrafts.length };
}

function inboxManagerKpiTiles(project: ConsoleProject): { label: string; value: string | number }[] {
  const draftsReady = project.inboxDrafts.filter((d) => d.status === "DRAFT").length;
  const filed = project.inboxDrafts.filter((d) => d.status === "APPROVED").length;
  return [
    { label: "Emails sorted", value: project.inboxDrafts.length },
    { label: "Drafts ready", value: draftsReady },
    { label: "Filed for you", value: filed },
  ];
}

function inboxManagerWorkflowSteps(project: ConsoleProject): WorkflowStep[] {
  const connected = project.mailConnections.some((c) => c.status === "CONNECTED");
  const drafts = project.inboxDrafts.filter((d) => d.status === "DRAFT").length;
  return [
    { title: "Overnight mail", kind: "trigger", detail: "new since last check", state: connected ? "done" : "pending" },
    { title: "Sort", kind: "match", detail: "routine vs. needs you", state: connected ? "done" : "pending" },
    { title: "Draft replies", kind: "draft", detail: "the routine ones", state: connected ? "done" : "pending" },
    { title: "Your decisions", kind: "human review", detail: drafts > 0 ? `${drafts} waiting` : "none waiting", state: drafts > 0 ? "human-waiting" : connected ? "human-pending" : "pending" },
    { title: "Send approved", kind: "notify", detail: "only what you approve", state: connected ? "done" : "pending" },
  ];
}

function inboxManagerActivityFeed(project: ConsoleProject): ActivityEvent[] {
  return project.inboxDrafts
    .map((d) => ({ tone: (d.status === "DRAFT" ? "need" : "done") as Tone, text: d.status === "DRAFT" ? `Drafted a reply: ${d.subject}` : `Reply sent: ${d.subject}`, meta: `AI Inbox Manager · ${d.createdAt.toISOString().slice(0, 10)}`, at: d.createdAt }))
    .sort((a, b) => b.at.getTime() - a.at.getTime());
}

function inboxManagerApprovalItems(project: ConsoleProject, agentHref: (agentId: string) => string): ApprovalItem[] {
  return project.inboxDrafts
    .filter((d) => d.status === "DRAFT")
    .map((d) => ({ id: d.id, kind: "inboxDraft" as const, title: d.subject, meta: "Reply drafted, waiting on your review", agentName: "AI Inbox Manager", href: agentHref("inbox") }));
}

// ---------- Dispatcher ----------

export type ActivityEvent = { tone: Tone; text: string; meta: string; at: Date };
export type ApprovalItem = { id: string; kind: "timeEntry" | "inboxDraft" | "renewalBatch"; title: string; meta: string; agentName: string; href: string };

export function planAgents(sourceServiceId: string | null): AgentDefinition[] {
  if (sourceServiceId === "law-firms") return LAW_FIRM_AGENTS;
  if (sourceServiceId === "insurance-ai-team") return INSURANCE_AGENTS;
  if (sourceServiceId === "brokerages") return BROKERAGE_AGENTS;
  if (sourceServiceId === "ai-inbox-manager") return INBOX_MANAGER_AGENTS;
  if (sourceServiceId === "ai-receptionist") return RECEPTIONIST_AGENTS;
  if (sourceServiceId === "ai-lead-capture") return LEAD_CAPTURE_AGENTS;
  return [];
}

export function planAgentStatus(project: ConsoleProject, agentId: string): AgentStatus {
  switch (project.sourceServiceId) {
    case "law-firms":
      return lawFirmAgentStatus(project, agentId);
    case "insurance-ai-team":
      return insuranceAgentStatus(project, agentId);
    case "brokerages":
      return brokerageAgentStatus(project, agentId);
    case "ai-inbox-manager":
      return inboxManagerAgentStatus(project);
    case "ai-receptionist":
      return receptionistAgentStatus(project);
    case "ai-lead-capture":
      return leadResponseStatus(project);
    default:
      return { tone: "dim", stateLabel: "idle", todayLabel: "–", todayValue: "–" };
  }
}

export function lawFirmAgentStatus(project: ConsoleProject, agentId: string): AgentStatus {
  if (agentId === "billing-clerk") return billingClerkStatus(project);
  if (agentId === "text-back") return textBackStatus(project);
  return followUpClerkStatus(project);
}

export function planKpiTiles(project: ConsoleProject): { label: string; value: string | number }[] {
  switch (project.sourceServiceId) {
    case "law-firms":
      return lawFirmKpiTiles(project);
    case "insurance-ai-team":
      return insuranceKpiTiles(project);
    case "brokerages":
      return brokerageKpiTiles(project);
    case "ai-inbox-manager":
      return inboxManagerKpiTiles(project);
    case "ai-receptionist":
      return receptionistKpiTiles(project);
    case "ai-lead-capture":
      return leadCaptureKpiTiles(project);
    default:
      return [];
  }
}

export function planWorkflowSteps(project: ConsoleProject, agentId: string): WorkflowStep[] {
  switch (project.sourceServiceId) {
    case "law-firms":
      return lawFirmWorkflowSteps(project, agentId);
    case "insurance-ai-team":
      return insuranceWorkflowSteps(project, agentId);
    case "brokerages":
      return brokerageWorkflowSteps(project, agentId);
    case "ai-inbox-manager":
      return inboxManagerWorkflowSteps(project);
    case "ai-receptionist":
      return receptionistWorkflowSteps(project);
    case "ai-lead-capture":
      return leadResponseWorkflowSteps(project);
    default:
      return [];
  }
}

export function planActivityFeed(project: ConsoleProject): ActivityEvent[] {
  switch (project.sourceServiceId) {
    case "law-firms":
      return lawFirmActivityFeed(project);
    case "insurance-ai-team":
      return insuranceActivityFeed(project);
    case "brokerages":
      return brokerageActivityFeed(project);
    case "ai-inbox-manager":
      return inboxManagerActivityFeed(project);
    case "ai-receptionist":
      return receptionistActivityFeed();
    case "ai-lead-capture":
      return leadResponseActivityFeed(project, "AI Lead Capture & Follow-Up");
    default:
      return [];
  }
}

export function planApprovalItems(project: ConsoleProject, agentHref: (agentId: string) => string): ApprovalItem[] {
  switch (project.sourceServiceId) {
    case "law-firms":
      return lawFirmApprovalItems(project, agentHref);
    case "insurance-ai-team":
      return insuranceApprovalItems(project, agentHref);
    case "brokerages":
      return brokerageApprovalItems();
    case "ai-inbox-manager":
      return inboxManagerApprovalItems(project, agentHref);
    case "ai-receptionist":
      return receptionistApprovalItems();
    case "ai-lead-capture":
      return [];
    default:
      return [];
  }
}

export function planLabel(sourceServiceId: string | null): string {
  if (sourceServiceId === "law-firms") return "Law Firm AI Team";
  if (sourceServiceId === "insurance-ai-team") return "Insurance AI Team";
  if (sourceServiceId === "brokerages") return "Brokerage AI Team";
  if (sourceServiceId === "ai-inbox-manager") return "AI Inbox Manager";
  if (sourceServiceId === "ai-receptionist") return "AI Receptionist";
  if (sourceServiceId === "ai-lead-capture") return "AI Lead Capture & Follow-Up";
  return "AI Team";
}
