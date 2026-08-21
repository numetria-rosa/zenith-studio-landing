/* AI Systems (done-for-you automation) service catalog — the equivalent of
   courses.ts for the agency side of the business. Different shape on
   purpose: two checkout links per service (one-time setup, separate
   recurring monthly), because that's how these are actually sold, and
   there's no waitlist fallback since "Book a free audit" already is the
   working funnel entry point (see src/app/page.tsx).

   Whop IDs are literal values, not env vars — they're not secrets (only
   WHOP_API_KEY and WHOP_WEBHOOK_SECRET are), and hardcoding them here means
   one file to update instead of keeping .env and Vercel's env vars in sync.
   Created via scripts/create-whop-products.mjs on 2026-08-21. */

export type Service = {
  id: string;
  title: string;
  pitch: string;
  description: string;
  setupPriceDisplay: string;
  monthlyPriceDisplay: string;
  /** Real Whop plan_id for the one-time setup charge. Empty string until created. */
  whopSetupPlanId: string;
  /** Real Whop plan_id for the recurring monthly charge. Empty string until created. */
  whopMonthlyPlanId: string;
  /** Real Whop purchase_url for the setup plan. Empty string until created. */
  setupCheckoutUrl: string;
  /** Real Whop purchase_url for the monthly plan. Empty string until created. */
  monthlyCheckoutUrl: string;
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
    whopSetupPlanId: "plan_AUhS9tvz8KrJC",
    whopMonthlyPlanId: "plan_Qvl24MqIyHNfQ",
    setupCheckoutUrl: "https://whop.com/checkout/plan_AUhS9tvz8KrJC",
    monthlyCheckoutUrl: "https://whop.com/checkout/plan_Qvl24MqIyHNfQ",
  },
  {
    id: "ai-lead-capture",
    title: "AI Lead Capture & Follow-Up",
    pitch: "Never lose a lead to a slow reply again.",
    description:
      "Captures every enquiry, qualifies it, and follows up by email and SMS until they book. The business that answers first wins the job.",
    setupPriceDisplay: "$1,000",
    monthlyPriceDisplay: "$200/mo",
    whopSetupPlanId: "plan_l6f3sCRsCR2Em",
    whopMonthlyPlanId: "plan_EKCkv5lP6CSPP",
    setupCheckoutUrl: "https://whop.com/checkout/plan_l6f3sCRsCR2Em",
    monthlyCheckoutUrl: "https://whop.com/checkout/plan_EKCkv5lP6CSPP",
  },
  {
    id: "ai-receptionist",
    title: "AI Receptionist & Booking",
    pitch: "Answers and books while you are on the job.",
    description:
      "Handles enquiries around the clock, books straight into your calendar, and sends the reminders that cut no-shows.",
    setupPriceDisplay: "$1,500",
    monthlyPriceDisplay: "$300/mo",
    whopSetupPlanId: "plan_ts3JwXpFBKKMp",
    whopMonthlyPlanId: "plan_CJyNkObEaPquA",
    setupCheckoutUrl: "https://whop.com/checkout/plan_ts3JwXpFBKKMp",
    monthlyCheckoutUrl: "https://whop.com/checkout/plan_CJyNkObEaPquA",
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
  return service.setupCheckoutUrl || null;
}

export function getMonthlyCheckoutUrl(service: Service): string | null {
  return service.monthlyCheckoutUrl || null;
}

/** Keyed on plan_id (not product_id) because a single service's setup and
    monthly checkout links are two different plans that can share one
    underlying Whop product — see the plan's "why plan_id" note. */
export function serviceKindForWhopPlanId(
  planId: string | null | undefined
): { serviceId: string; kind: "setup" | "monthly" } | null {
  if (!planId) return null;
  for (const service of SERVICES) {
    if (service.whopSetupPlanId === planId) {
      return { serviceId: service.id, kind: "setup" };
    }
    if (service.whopMonthlyPlanId === planId) {
      return { serviceId: service.id, kind: "monthly" };
    }
  }
  return null;
}
