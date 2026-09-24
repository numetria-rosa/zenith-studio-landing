// Demo content for the AI Team screens.
// Numbers and activity items are SAMPLE data. Replace before showing a client.
// Anything in [BRACKETS] is a placeholder to fill in.
import type { IconName } from "@/components/Icon";

export const agency = {
  name: "[Agency Name]",
  userName: "[Name]",
  userInitial: "N",
  userRole: "Agency owner",
};

export type Tone = "neutral" | "attention";

export const stats: { label: string; value: string; tone: Tone }[] = [
  { label: "Handled today", value: "48", tone: "neutral" },
  { label: "Avg. reply time", value: "2m", tone: "neutral" },
  { label: "Agents on shift", value: "5", tone: "neutral" },
  { label: "Needs you", value: "1", tone: "attention" },
];

/** active = running (neon edge + cyan dot), idle = plain tile, attention = amber, waiting on a human */
export type AgentState = "active" | "idle" | "attention";

export type MapAgent = {
  id: string;
  name: string;
  status: string;
  state: AgentState;
  icon: IconName;
  /** Tile top-left inside the 680x440 team map */
  x: number;
  y: number;
  href?: string;
};

export const mapAgents: MapAgent[] = [
  { id: "intake", name: "Intake", status: "running", state: "active", icon: "mail", x: 40, y: 90 },
  { id: "renewals", name: "Renewals", status: "idle", state: "idle", icon: "refresh", x: 576, y: 90 },
  { id: "quoting", name: "Quoting", status: "waiting on you", state: "attention", icon: "file", x: 150, y: 230 },
  { id: "claims", name: "Claims", status: "running", state: "active", icon: "clipboard", x: 466, y: 230, href: "/agents/claims" },
  { id: "service", name: "Client service", status: "running", state: "active", icon: "message", x: 308, y: 320 },
];

export type DotTone = "live" | "done" | "attention";

export const activity: { text: string; meta: string; tone: DotTone }[] = [
  { text: "New web lead sorted and assigned", meta: "Intake · 2 min ago", tone: "live" },
  { text: "Answered a billing question for [Client]", meta: "Client service · 6 min ago", tone: "done" },
  { text: "Pulled policy for Claim [#ID]", meta: "Claims · 9 min ago", tone: "done" },
  { text: "Home quote waiting for your sign-off", meta: "Quoting · 14 min ago", tone: "attention" },
];

export const needsYou = {
  title: "Claim summary ready to review",
  meta: "Claims Agent · [Client Name]",
  href: "/agents/claims",
};

/* ---------- Claims Agent ---------- */

export type StepState = "done" | "active" | "pending";

export const claimsAgent = {
  name: "Claims Agent",
  description:
    "Reads first notice of loss emails, checks the policy, and drafts a summary for your adjuster.",
  steps: [
    { title: "New claim email received", meta: "trigger · claims inbox", icon: "mail", state: "done", duration: "0s" },
    { title: "Pull policy #, loss date, photos", meta: "extract · 3 fields, 4 files", icon: "search", state: "done", duration: "6s" },
    { title: "Check coverage in AMS", meta: "verify · policy active", icon: "shieldCheck", state: "done", duration: "4s" },
    { title: "Write adjuster summary", meta: "draft · writing…", icon: "file", state: "active" },
    { title: "You approve before it's sent", meta: "human review · next", icon: "userCheck", state: "pending" },
  ] as { title: string; meta: string; icon: IconName; state: StepState; duration?: string }[],
  run: {
    title: "Claim [#ID] · [Client Name]",
    subtitle: "Drafting summary",
    progress: 80,
  },
  details: [
    { key: "Policy #", value: "[POLICY #]", mono: true },
    { key: "Date of loss", value: "[DATE]", mono: true },
    { key: "Line", value: "[Auto / Home]" },
    { key: "Attachments", value: "4 files" },
  ] as { key: string; value: string; mono?: boolean }[],
  coverage: "Active",
  recentRuns: [
    { text: "Claim [#ID] · sent to adjuster", time: "1h" },
    { text: "Claim [#ID] · sent to adjuster", time: "3h" },
  ],
};
