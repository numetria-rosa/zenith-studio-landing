import type { IconName } from "./_halo/Icon";

/* Sample content for the client dashboard visual preview (Phase 1 - shell
   and Overview, reviewed before any real data is wired in). Shaped like a
   real Law Firm AI Team client on purpose, not generic placeholders, so
   this preview reads as "what a real client would actually see" - not a
   demo of an unrelated product. Every agent id here is one of the three
   real roles law-firms clients already have wired (billing-clerk.ts,
   follow-up-clerk.ts, signalwire-text-back.ts). Swap this file for real
   Prisma queries in Phase 2; the shape below is deliberately close to the
   AGENT_TYPES registry shape agreed for that phase, so this isn't throwaway
   work. */

export const agency = {
  name: "Whitfield & Cole Law",
  userName: "Dana",
  userInitial: "D",
  userRole: "Firm owner",
};

export type Tone = "neutral" | "attention";

export const stats: { label: string; value: string; tone: Tone }[] = [
  { label: "Calls answered today", value: "12", tone: "neutral" },
  { label: "Avg. reply time", value: "8s", tone: "neutral" },
  { label: "Agents active", value: "3", tone: "neutral" },
  { label: "Needs you", value: "3", tone: "attention" },
];

export type AgentState = "active" | "idle" | "attention";

export type MapAgent = {
  id: string;
  name: string;
  status: string;
  state: AgentState;
  icon: IconName;
  href: string;
};

export const mapAgents: MapAgent[] = [
  { id: "text-back", name: "Missed Call Text-Back", status: "running", state: "active", icon: "phone", href: "/lab/dashboard/preview/agents/text-back" },
  { id: "follow-up", name: "Follow-Up Clerk", status: "running", state: "active", icon: "message", href: "/lab/dashboard/preview/agents/follow-up" },
  { id: "billing-clerk", name: "Billing Clerk", status: "3 drafts waiting", state: "attention", icon: "dollar", href: "/lab/dashboard/preview/agents/billing-clerk" },
];

export type DotTone = "live" | "done" | "attention";

export const activity: { text: string; meta: string; tone: DotTone }[] = [
  { text: "Missed call from (555) 019-2231 texted back", meta: "Text-Back · 3 min ago", tone: "live" },
  { text: "Follow-up sent to Marcus R. (didn't retain)", meta: "Follow-Up Clerk · 22 min ago", tone: "done" },
  { text: "3 time entries drafted from yesterday's calendar", meta: "Billing Clerk · 1h ago", tone: "attention" },
  { text: "New consult booked: Priya S.", meta: "Text-Back · 2h ago", tone: "done" },
];

export const needsYou = {
  title: "3 time entries ready for your review",
  meta: "Billing Clerk · yesterday's calendar + email",
  href: "/lab/dashboard/preview/agents/billing-clerk",
};

/* ---------- Agent detail pages ---------- */

export type StepState = "done" | "active" | "pending";

export type AgentDetail = {
  name: string;
  icon: IconName;
  statusTone: "live" | "attention";
  statusLabel: string;
  description: string;
  steps: { title: string; meta: string; icon: IconName; state: StepState; duration?: string }[];
  run: { title: string; subtitle: string; progress: number };
  details: { key: string; value: string; mono?: boolean }[];
  detailsBadge?: { label: string; value: string };
  recentRuns: { text: string; time: string }[];
};

export const agents: Record<string, AgentDetail> = {
  "billing-clerk": {
    name: "Billing Clerk",
    icon: "dollar",
    statusTone: "attention",
    statusLabel: "Needs review",
    description: "Reconstructs billable time from your calendar, email, and documents, and drafts entries for you to approve.",
    steps: [
      { title: "Calendar + email fetched", meta: "trigger · daily at 4pm", icon: "mail", state: "done", duration: "2s" },
      { title: "Filtered to real external meetings", meta: "filter · 10+ min, outside domain", icon: "search", state: "done", duration: "1s" },
      { title: "Drafted narrative + matter name", meta: "draft · 3 entries", icon: "file", state: "done", duration: "8s" },
      { title: "Waiting on your approval", meta: "human review · 3 drafts", icon: "userCheck", state: "active" },
      { title: "Export to invoicing", meta: "csv export · after approval", icon: "clipboard", state: "pending" },
    ],
    run: { title: "3 drafts · yesterday", subtitle: "Waiting on your review", progress: 75 },
    details: [
      { key: "Matter", value: "Alvarez v. Kline" },
      { key: "Duration", value: "45 min" },
      { key: "Type", value: "External meeting" },
      { key: "Source", value: "Google Calendar" },
    ],
    detailsBadge: { label: "Status", value: "Draft" },
    recentRuns: [
      { text: "2 entries approved, exported to Clio", time: "1d" },
      { text: "1 entry rejected (duplicate)", time: "1d" },
      { text: "4 entries approved, exported", time: "3d" },
    ],
  },
  "text-back": {
    name: "Missed Call Text-Back",
    icon: "phone",
    statusTone: "live",
    statusLabel: "Running",
    description: "Texts back every missed call in seconds, qualifies against your case criteria, and books a consult.",
    steps: [
      { title: "Missed call detected", meta: "trigger · voice webhook", icon: "phone", state: "done", duration: "0s" },
      { title: "Text sent to caller", meta: "sms · qualifying questions", icon: "message", state: "done", duration: "3s" },
      { title: "Case criteria checked", meta: "qualify · practice area, jurisdiction", icon: "shieldCheck", state: "done", duration: "2s" },
      { title: "Consult booked", meta: "calendar · confirmed", icon: "check", state: "active" },
      { title: "Handoff note sent to your team", meta: "notify · next", icon: "userCheck", state: "pending" },
    ],
    run: { title: "(555) 019-2231", subtitle: "Booking consult", progress: 80 },
    details: [
      { key: "Caller", value: "(555) 019-2231", mono: true },
      { key: "Practice area", value: "Personal injury" },
      { key: "Qualified", value: "Yes" },
      { key: "Response time", value: "8s" },
    ],
    detailsBadge: { label: "Status", value: "Active" },
    recentRuns: [
      { text: "Consult booked: Priya S.", time: "2h" },
      { text: "Not qualified, referred out", time: "5h" },
      { text: "Consult booked: James T.", time: "1d" },
    ],
  },
  "follow-up": {
    name: "Follow-Up Clerk",
    icon: "message",
    statusTone: "live",
    statusLabel: "Running",
    description: "Works every lead that didn't retain on the first call, so they're never simply forgotten.",
    steps: [
      { title: "Lead marked \"did not retain\"", meta: "trigger · CRM status change", icon: "clipboard", state: "done", duration: "0s" },
      { title: "Follow-up sequence started", meta: "sequence · 3 touches over 14 days", icon: "message", state: "done", duration: "1s" },
      { title: "Reply received", meta: "check · sentiment: interested", icon: "mail", state: "active" },
      { title: "Notify your team to call back", meta: "notify · next", icon: "userCheck", state: "pending" },
    ],
    run: { title: "Marcus R.", subtitle: "Sequence step 2 of 3", progress: 60 },
    details: [
      { key: "Lead", value: "Marcus R." },
      { key: "Reason", value: "Did not retain" },
      { key: "Sequence step", value: "2 of 3" },
      { key: "Last touch", value: "22 min ago" },
    ],
    detailsBadge: { label: "Status", value: "Active" },
    recentRuns: [
      { text: "Re-engaged: booked consult", time: "4h" },
      { text: "Sequence completed, no reply", time: "1d" },
      { text: "Re-engaged: booked consult", time: "2d" },
    ],
  },
};
