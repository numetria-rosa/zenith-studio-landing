import type { PlanId, Tone } from "@/lib/client-console-data";

// Zenith HQ's service key IS the real sourceServiceId/ServiceCatalog.slug -
// no separate short-code mapping (the prototype's ins/law/bro/inbox keys
// only existed to keep its sample data terse).
export type ServiceKey = PlanId;

export type ClientStatus = "setup" | "trial" | "active" | "paused";
export type BillingCycle = "monthly" | "quarterly";

export type HqAgent = {
  id: string;
  name: string;
  tone: Tone; // run | need | done | dim, from client-console-data.ts's planAgentStatus
  stateLabel: string;
  todayLabel: string;
  todayValue: string | number;
  real: boolean;
};

export type HqClient = {
  id: string; // ServiceProject.id
  name: string; // business name (ServiceProject.title)
  contactName: string;
  contactEmail: string;
  service: ServiceKey;
  status: ClientStatus;
  billingCycle: BillingCycle;
  since: Date;
  health: number | null; // 0-100, null while status === "setup"
  paymentOk: boolean;
  nextChargeAt: Date | null;
  setupStage: 0 | 1 | 2 | 3 | null; // index into SETUP_STEPS, null once not in setup
  setupReadyBy: Date | null;
  trialEndsAt: Date | null;
  agents: HqAgent[];
  adminNote: string;
  priceCents: number; // resolved for this client's service + billingCycle
  slaHours: number;
};

export type HqService = {
  slug: ServiceKey;
  title: string;
  short: string;
  color: string;
  listPriceCents: number | null;
  monthlyPriceCents: number | null;
  quarterlyPriceCentsPerMonth: number | null;
  setupPriceCents: number | null;
  freeSetup: boolean;
  trialEnabled: boolean;
  acceptingNewClients: boolean;
  slaHours: number;
  landingPageUrl: string | null;
  agents: { name: string; real: boolean }[];
};

export type AttentionKind = "error" | "payment" | "setup" | "health" | "trial" | "request";
export type AttentionSeverity = "red" | "amber" | "cyan";

export type AttentionItem = {
  kind: AttentionKind;
  severity: AttentionSeverity;
  icon: "alert" | "card" | "clock" | "flag" | "users" | "chat";
  title: string;
  subtitle: string;
  actionLabel: string;
  href: string; // where the action button navigates
  clientId?: string;
  agentId?: string;
};

// Fixed order + colors for the 4 original bundles (validated for
// colorblind separation on the dark surface, per DESIGN.md section 1) plus
// the 2 standalone systems this build adds - those two are NOT validated
// the same way, just chosen to stay visually distinct from the other 4 and
// from the status-pill colors (cyan/mint/amber/red/violet).
export const SERVICE_ORDER: ServiceKey[] = [
  "insurance-ai-team",
  "law-firms",
  "brokerages",
  "ai-inbox-manager",
  "ai-receptionist",
  "ai-lead-capture",
];

export const SERVICE_COLOR: Record<ServiceKey, string> = {
  "insurance-ai-team": "#3B8FE0",
  "law-firms": "#B07A1E",
  brokerages: "#8B6CF0",
  "ai-inbox-manager": "#2BA37A",
  "ai-receptionist": "#D9788F",
  "ai-lead-capture": "#C99A3D",
};

export const SERVICE_SHORT: Record<ServiceKey, string> = {
  "insurance-ai-team": "Insurance",
  "law-firms": "Law firms",
  brokerages: "Brokerages",
  "ai-inbox-manager": "Inbox Manager",
  "ai-receptionist": "Receptionist",
  "ai-lead-capture": "Lead Capture",
};

export const SETUP_STEPS = ["Payment received", "Tools connected", "Agents tuned and tested", "Ready"] as const;
