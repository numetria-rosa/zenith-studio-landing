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
    setupPriceDisplay: "$190",
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
    setupPriceDisplay: "$270",
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
    setupPriceDisplay: "$360",
    monthlyPriceDisplay: "$300/mo",
    whopSetupPlanId: "plan_ts3JwXpFBKKMp",
    whopMonthlyPlanId: "plan_CJyNkObEaPquA",
    setupCheckoutUrl: "https://whop.com/checkout/plan_ts3JwXpFBKKMp",
    monthlyCheckoutUrl: "https://whop.com/checkout/plan_CJyNkObEaPquA",
  },
  // The two vertical/role offers from src/app/page.tsx's own `verticalSystems`
  // array — monthly-only (no separate setup plan), which is why
  // setupPriceDisplay/whopSetupPlanId/setupCheckoutUrl are empty, matching
  // this file's own "empty string until created" convention. Added here so
  // serviceKindForWhopPlanId can actually resolve their plan ids: before this,
  // a real purchase of either produced no CourseEntitlement/ServiceRequest at
  // all — the webhook's handlePaymentSucceeded hit its unmapped-product branch
  // and silently dropped the purchase (found during the 2026-08-27 service-
  // platform architecture audit). No webhook code changes were needed to fix
  // this — handlePaymentSucceeded's existing `kind === "monthly"` branch
  // already creates a fresh ServiceRequest on first purchase.
  {
    id: "law-firms",
    title: "Law Firm AI Team",
    pitch: "Your firm works 49 hours a week and bills 37.",
    description:
      "An AI Intake Coordinator, Follow-Up Clerk, and Billing Clerk as one team: answers and qualifies every enquiry, works the leads that didn't retain, and reconstructs billable time before the write-down window closes.",
    setupPriceDisplay: "",
    monthlyPriceDisplay: "$1,200/mo",
    whopSetupPlanId: "",
    whopMonthlyPlanId: "plan_kTlL5gBlJTsqy",
    setupCheckoutUrl: "",
    monthlyCheckoutUrl: "https://whop.com/checkout/plan_kTlL5gBlJTsqy",
  },
  {
    id: "brokerages",
    title: "Brokerage AI Team",
    pitch: "Your agents are not leaving for a better split.",
    description:
      "An AI Inside Sales Agent, Transaction Coordinator, and Database Manager as one team: answers new leads in seconds, tracks every file to close, and wakes up the dormant contacts already sitting in your CRM.",
    setupPriceDisplay: "",
    monthlyPriceDisplay: "$1,200/mo",
    whopSetupPlanId: "",
    whopMonthlyPlanId: "plan_m3i6RwMYvMATE",
    setupCheckoutUrl: "",
    monthlyCheckoutUrl: "https://whop.com/checkout/plan_m3i6RwMYvMATE",
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

/** Public marketing URLs used in outbound email. Catalog `id` stays the
    webhook/checkout key; these slugs are what a cold-email visitor hits. */
export const SERVICE_PAGE_BY_ID: Record<string, { slug: string; path: string }> = {
  "ai-inbox-manager": { slug: "ai-inbox-manager", path: "/services/ai-inbox-manager" },
  "ai-lead-capture": { slug: "ai-lead-capture-follow-up", path: "/services/ai-lead-capture-follow-up" },
  "ai-receptionist": { slug: "ai-receptionist-booking", path: "/services/ai-receptionist-booking" },
  "law-firms": { slug: "law-firm-ai-team", path: "/services/law-firm-ai-team" },
  brokerages: { slug: "brokerage-ai-team", path: "/services/brokerage-ai-team" },
};

export function servicePagePath(serviceId: string): string | null {
  return SERVICE_PAGE_BY_ID[serviceId]?.path ?? null;
}

export function serviceIdForPageSlug(slug: string): string | null {
  for (const [id, page] of Object.entries(SERVICE_PAGE_BY_ID)) {
    if (page.slug === slug) return id;
  }
  return null;
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
