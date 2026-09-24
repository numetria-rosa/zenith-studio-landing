/* AI Systems (done-for-you automation) service catalog - the equivalent of
   courses.ts for the agency side of the business. Different shape on
   purpose: two checkout links per service (one-time setup, separate
   recurring monthly), because that's how these are actually sold, and
   there's no waitlist fallback since "Book a free audit" already is the
   working funnel entry point (see src/app/page.tsx).

   Whop IDs are literal values, not env vars - they're not secrets (only
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
  /** Real Whop plan_id for the discounted longer-cycle charge. Currently
      quarterly (90 days), not yearly - Whop rejects any single charge over
      $2,500 for this account, which blocks real annual billing on every
      bundle here. Quarterly is the stand-in until that cap is raised; see
      scripts/sync-details-page-pricing.mjs and create-quarterly-plans.mjs
      for the exact numbers and how to switch back to yearly later. */
  whopQuarterlyPlanId?: string;
  /** Real Whop purchase_url for the quarterly plan. Empty string until created. */
  quarterlyCheckoutUrl?: string;
};

export const SERVICES: Service[] = [
  {
    id: "ai-inbox-manager",
    title: "AI Inbox Manager",
    pitch: "Wake up to an inbox that is already handled.",
    description:
      "Sorts and prioritizes email, then drafts replies to the routine ones so your day starts with decisions, not admin. Connects to Gmail (personal accounts) or Yahoo Mail via a secure app password; Outlook/Microsoft 365 isn't supported yet.",
    setupPriceDisplay: "$190",
    monthlyPriceDisplay: "$150/mo",
    whopSetupPlanId: "plan_AUhS9tvz8KrJC",
    whopMonthlyPlanId: "plan_Qvl24MqIyHNfQ",
    setupCheckoutUrl: "https://whop.com/checkout/ch_eCiR8tjLkqVUe3L/",
    monthlyCheckoutUrl: "https://whop.com/checkout/ch_phNxifgOlrStCAu/",
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
    setupCheckoutUrl: "https://whop.com/checkout/ch_qeORXXxV8lkxl59/",
    monthlyCheckoutUrl: "https://whop.com/checkout/ch_9NA0gyMpYqAE3dX/",
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
    setupCheckoutUrl: "https://whop.com/checkout/ch_4vQmstGbs1C4W50/",
    monthlyCheckoutUrl: "https://whop.com/checkout/ch_ZvGXKYoanGI1eVn/",
  },
  // The two vertical/role offers from src/app/page.tsx's own `verticalSystems`
  // array - monthly-only (no separate setup plan), which is why
  // setupPriceDisplay/whopSetupPlanId/setupCheckoutUrl are empty, matching
  // this file's own "empty string until created" convention. Added here so
  // serviceKindForWhopPlanId can actually resolve their plan ids: before this,
  // a real purchase of either produced no CourseEntitlement/ServiceRequest at
  // all - the webhook's handlePaymentSucceeded hit its unmapped-product branch
  // and silently dropped the purchase (found during the 2026-08-27 service-
  // platform architecture audit). No webhook code changes were needed to fix
  // this - handlePaymentSucceeded's existing `kind === "monthly"` branch
  // already creates a fresh ServiceRequest on first purchase.
  {
    id: "law-firms",
    title: "Law Firm AI Team",
    pitch: "Your firm works 49 hours a week and bills 37.",
    description:
      "An AI Missed Call Text-Back, Follow-Up Clerk, and Billing Clerk as one team: texts back every unanswered call in seconds, works the leads that didn't retain, and reconstructs billable time before the write-down window closes.",
    setupPriceDisplay: "",
    // Real charge is $1,080/mo (10% launch discount off $1,200, confirmed
    // live on the plan itself via strike_through_renewal_price) - updated
    // 2026-09-23 to match public/demos/law-firm-ai-team.html, which was
    // showing this discounted price while the actual Whop plan still
    // charged $1,200. A real annual plan is blocked on Whop's $2,500/
    // purchase cap for this account - quarterly (25% off, $2,430/quarter)
    // is the stand-in until that's raised.
    monthlyPriceDisplay: "$1,080/mo",
    whopSetupPlanId: "",
    whopMonthlyPlanId: "plan_kTlL5gBlJTsqy",
    setupCheckoutUrl: "",
    monthlyCheckoutUrl: "https://whop.com/checkout/ch_we86QAB7NOpqcL1/",
    whopQuarterlyPlanId: "plan_IY3eOH5sH5FD0",
    quarterlyCheckoutUrl: "https://whop.com/checkout/plan_IY3eOH5sH5FD0",
  },
  {
    id: "brokerages",
    title: "Brokerage AI Team",
    pitch: "Your agents are not leaving for a better split.",
    description:
      "An AI Inside Sales Agent, Transaction Coordinator, and Database Manager as one team: answers new leads in seconds, tracks every file to close, and wakes up the dormant contacts already sitting in your CRM.",
    setupPriceDisplay: "",
    // Real charge is $910/mo (24% launch discount off $1,200, confirmed
    // live on the plan via strike_through_renewal_price) - updated
    // 2026-09-24 to match public/demos/brokerage-ai-team.html.
    monthlyPriceDisplay: "$910/mo",
    whopSetupPlanId: "",
    whopMonthlyPlanId: "plan_m3i6RwMYvMATE",
    setupCheckoutUrl: "",
    monthlyCheckoutUrl: "https://whop.com/checkout/ch_HKET2g6l0b9Jchp/",
    // Quarterly is 32% off the $1,200 LIST price, not off the $910 monthly
    // sale price - same "discount off list, independent of the other tier"
    // convention as law-firms/insurance below. $1,200 x 3 x 0.75 = $2,700
    // would exceed Whop's $2,500 cap, so this bundle needs a deeper
    // discount just to clear the same ceiling. Not a value judgment, purely
    // mechanical - revisit once the cap is lifted and real annual billing
    // can restore a consistent ~25% across every bundle.
    whopQuarterlyPlanId: "plan_apcRrrvFpvnWl",
    quarterlyCheckoutUrl: "https://whop.com/checkout/plan_apcRrrvFpvnWl",
  },
  // Real Whop product created 2026-09-23 to match public/demos/
  // insurance-ai-team.html's pricing - previously this niche's outreach/
  // checkout reused ai-lead-capture's unrelated $200/mo plan, which didn't
  // match what the details page promised. A real annual plan is blocked on
  // Whop's $2,500/purchase cap for this account - quarterly (25% off,
  // $1,912.50/quarter) is the stand-in until that's raised.
  {
    id: "insurance-ai-team",
    title: "Insurance Account Manager Bundle",
    pitch: "Your front office, on autopilot.",
    description:
      "An Intake Agent, Document Audit, CRM & Logging, and Renewal Reminders as one team: texts back every quote request, reads policy documents in seconds, logs every lead automatically, and reminds clients before their policy renews. No access to your AMS required.",
    setupPriceDisplay: "",
    monthlyPriceDisplay: "$850/mo",
    whopSetupPlanId: "",
    whopMonthlyPlanId: "plan_aW9AIh13BCZPV",
    setupCheckoutUrl: "",
    monthlyCheckoutUrl: "https://whop.com/checkout/plan_aW9AIh13BCZPV",
    whopQuarterlyPlanId: "plan_LzUY3p0RRbU3N",
    quarterlyCheckoutUrl: "https://whop.com/checkout/plan_LzUY3p0RRbU3N",
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
  // Kept for law-firms/brokerages even though the homepage verticals section
  // no longer links to it (see [locale]/page.tsx) - outreach.ts's hard
  // filter still requires servicePagePath() to resolve for every recommended
  // service, so removing these would silently break cold-outreach
  // eligibility for both niches. insurance-ai-team is deliberately absent:
  // it has no matching SERVICE_PAGES entry in service-pages.ts, so adding it
  // here would make outreach link to a 404 instead of correctly excluding it.
  "law-firms": { slug: "law-firm-ai-team", path: "/services/law-firm-ai-team" },
  brokerages: { slug: "brokerage-ai-team", path: "/services/brokerage-ai-team" },
};

export function servicePagePath(serviceId: string): string | null {
  return SERVICE_PAGE_BY_ID[serviceId]?.path ?? null;
}

/** Same idea as SERVICE_PAGE_BY_ID but for the interactive /demo pages
    (src/app/demo/*), so outbound email can link to actual proof instead of
    only describing the service in prose. */
export const DEMO_PATH_BY_SERVICE_ID: Record<string, string> = {
  "ai-inbox-manager": "/demo/ai-inbox-manager",
  "ai-lead-capture": "/demo/ai-lead-capture-follow-up",
  "ai-receptionist": "/demo/ai-receptionist",
  "law-firms": "/demo/law-firm-ai-team",
  brokerages: "/demo/brokerage-ai-team",
  "insurance-ai-team": "/demo/insurance-ai-team",
};

export function demoPagePath(serviceId: string): string | null {
  return DEMO_PATH_BY_SERVICE_ID[serviceId] ?? null;
}

export function serviceIdForPageSlug(slug: string): string | null {
  for (const [id, page] of Object.entries(SERVICE_PAGE_BY_ID)) {
    if (page.slug === slug) return id;
  }
  return null;
}

/** null (not a fallback URL) - the page's job is to keep showing the
    working "Book a free audit" CTA until a real checkout link exists. */
export function getSetupCheckoutUrl(service: Service): string | null {
  return service.setupCheckoutUrl || null;
}

export function getMonthlyCheckoutUrl(service: Service): string | null {
  return service.monthlyCheckoutUrl || null;
}

/** Keyed on plan_id (not product_id) because a single service's setup and
    monthly checkout links are two different plans that can share one
    underlying Whop product - see the plan's "why plan_id" note. */
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
    // A quarterly purchase grants the same access as monthly, just billed
    // on a longer cycle - ServiceRequest has no separate quarterly status.
    if (service.whopQuarterlyPlanId && service.whopQuarterlyPlanId === planId) {
      return { serviceId: service.id, kind: "monthly" };
    }
  }
  return null;
}

/** Resolves the display label for a project's service, reusing the same
    catalogService-title-first / sourceServiceId-fallback pattern used by
    the client-facing workspace page and client-directory.ts.
    Deliberately lives here, not in service-projects-admin.ts: this file
    has no server-only dependencies, so a client component can safely
    import it (directly, or transitively through admin-search.ts) without
    dragging in provisioning code (Vapi/SignalWire/Groq clients) into a
    browser bundle, which is exactly what broke every production build
    from 2026-09-10's SignalWire switch onward, see git history. */
export function projectServiceLabel(project: {
  title: string;
  sourceServiceId: string | null;
  catalogService?: { title: string } | null;
}): string {
  if (project.catalogService?.title) return project.catalogService.title;
  if (project.sourceServiceId) return getService(project.sourceServiceId)?.title ?? project.sourceServiceId;
  return project.title;
}
