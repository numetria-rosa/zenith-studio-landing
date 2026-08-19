/* AI Systems (done-for-you automation) service catalog — the equivalent of
   courses.ts for the agency side of the business. Different shape on
   purpose: two checkout links per service (one-time setup, separate
   recurring monthly), because that's how these are actually sold, and
   there's no waitlist fallback since "Book a free audit" already is the
   working funnel entry point (see src/app/page.tsx). */

export type Service = {
  id: string;
  title: string;
  pitch: string;
  description: string;
  setupPriceDisplay: string;
  monthlyPriceDisplay: string;
  whopSetupPlanIdEnvKey: string;
  whopMonthlyPlanIdEnvKey: string;
  setupCheckoutUrlEnvKey: string;
  monthlyCheckoutUrlEnvKey: string;
};

export const SERVICES: Service[] = [
  {
    id: "ai-inbox-manager",
    title: "AI Inbox Manager",
    pitch: "Wake up to an inbox that is already handled.",
    description:
      "Sorts and prioritizes email, then drafts replies to the routine ones so your day starts with decisions, not admin.",
    setupPriceDisplay: "$800",
    monthlyPriceDisplay: "$150/mo",
    whopSetupPlanIdEnvKey: "WHOP_AI_INBOX_MANAGER_SETUP_PLAN_ID",
    whopMonthlyPlanIdEnvKey: "WHOP_AI_INBOX_MANAGER_MONTHLY_PLAN_ID",
    setupCheckoutUrlEnvKey: "WHOP_AI_INBOX_MANAGER_SETUP_CHECKOUT_URL",
    monthlyCheckoutUrlEnvKey: "WHOP_AI_INBOX_MANAGER_MONTHLY_CHECKOUT_URL",
  },
  {
    id: "ai-lead-capture",
    title: "AI Lead Capture & Follow-Up",
    pitch: "Never lose a lead to a slow reply again.",
    description:
      "Captures every enquiry, qualifies it, and follows up by email and SMS until they book. The business that answers first wins the job.",
    setupPriceDisplay: "$1,000",
    monthlyPriceDisplay: "$200/mo",
    whopSetupPlanIdEnvKey: "WHOP_AI_LEAD_CAPTURE_SETUP_PLAN_ID",
    whopMonthlyPlanIdEnvKey: "WHOP_AI_LEAD_CAPTURE_MONTHLY_PLAN_ID",
    setupCheckoutUrlEnvKey: "WHOP_AI_LEAD_CAPTURE_SETUP_CHECKOUT_URL",
    monthlyCheckoutUrlEnvKey: "WHOP_AI_LEAD_CAPTURE_MONTHLY_CHECKOUT_URL",
  },
  {
    id: "ai-receptionist",
    title: "AI Receptionist & Booking",
    pitch: "Answers and books while you are on the job.",
    description:
      "Handles enquiries around the clock, books straight into your calendar, and sends the reminders that cut no-shows.",
    setupPriceDisplay: "$1,500",
    monthlyPriceDisplay: "$300/mo",
    whopSetupPlanIdEnvKey: "WHOP_AI_RECEPTIONIST_SETUP_PLAN_ID",
    whopMonthlyPlanIdEnvKey: "WHOP_AI_RECEPTIONIST_MONTHLY_PLAN_ID",
    setupCheckoutUrlEnvKey: "WHOP_AI_RECEPTIONIST_SETUP_CHECKOUT_URL",
    monthlyCheckoutUrlEnvKey: "WHOP_AI_RECEPTIONIST_MONTHLY_CHECKOUT_URL",
  },
];

export const SERVICE_STATUSES = ["new", "scoping", "building", "live", "maintenance"] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  new: "New",
  scoping: "Scoping",
  building: "Building",
  live: "Live",
  maintenance: "Maintenance",
};

export function isServiceStatus(v: string): v is ServiceStatus {
  return (SERVICE_STATUSES as readonly string[]).includes(v);
}

export function getService(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

/** null (not a fallback URL) — the page's job is to keep showing the
    working "Book a free audit" CTA until a real checkout link exists. */
export function getSetupCheckoutUrl(service: Service): string | null {
  return process.env[service.setupCheckoutUrlEnvKey] || null;
}

export function getMonthlyCheckoutUrl(service: Service): string | null {
  return process.env[service.monthlyCheckoutUrlEnvKey] || null;
}

/** Keyed on plan_id (not product_id) because a single service's setup and
    monthly checkout links are two different plans that can share one
    underlying Whop product — see the plan's "why plan_id" note. */
export function serviceKindForWhopPlanId(
  planId: string | null | undefined
): { serviceId: string; kind: "setup" | "monthly" } | null {
  if (!planId) return null;
  for (const service of SERVICES) {
    if (process.env[service.whopSetupPlanIdEnvKey] === planId) {
      return { serviceId: service.id, kind: "setup" };
    }
    if (process.env[service.whopMonthlyPlanIdEnvKey] === planId) {
      return { serviceId: service.id, kind: "monthly" };
    }
  }
  return null;
}
