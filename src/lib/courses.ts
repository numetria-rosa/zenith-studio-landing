/* Zenith Lab — central course catalog.
   The single authoritative place a course is defined: what it's called, where
   its content lives, and how it maps to a real Whop product. Nothing else
   (checkout buttons, the dashboard, the webhook handler) should hardcode a
   checkout link or a product ID — they all read through this file.

   Whop IDs are literal values, not env vars — they're not secrets (only
   WHOP_API_KEY and WHOP_WEBHOOK_SECRET are), and hardcoding them here means
   one file to update instead of keeping .env and Vercel's env vars in sync.
   Created via scripts/create-whop-products.mjs on 2026-08-21.

   Adding another course later means adding one entry here, not touching the
   access-control system. */

export type Course = {
  id: string; // stable internal id — also the courseId stored on CourseEntitlement/CourseProgress rows
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  /** Real Whop access_pass_id (product id) for this course, once created. Empty string until then. */
  whopAccessPassId: string;
  /** Real Whop plan_id for this course, once created. Empty string until then. */
  whopPlanId: string;
  /** Real Whop purchase_url (checkout link) for this course, once created. Empty string until then. */
  checkoutUrl: string;
  /** Where content actually lives on disk, served only through the guarded route. */
  contentDir: string;
  /** First page inside contentDir a newly-entitled user should land on. */
  firstLessonPath: string;
  /** Fallback when no purchase_url is configured yet — never show a dead button. */
  waitlistUrl: string;
  /** False = not for sale yet; hidden from "Available courses" purchase CTAs. */
  published: boolean;
};

export const COURSES: Course[] = [
  {
    id: "ai-engineering",
    slug: "ai-engineering",
    title: "AI Engineering",
    description:
      "An 8-week accelerated program, ~10 hours a week: prompting, retrieval, agents, tool use, structured outputs, and evaluation. The exact stack behind VoyAI and SmartRevise. Basic programming logic required, no prior Python needed.",
    thumbnail: "/lab/ai-engineering.webp",
    whopAccessPassId: "prod_CKyY55RfnSTlU",
    whopPlanId: "plan_VSU3hyAITNsNk",
    checkoutUrl: "https://whop.com/checkout/plan_VSU3hyAITNsNk",
    contentDir: "courses/ai-engineering",
    firstLessonPath: "dashboard",
    waitlistUrl:
      "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20AI%20Engineering%0A",
    published: true,
  },
  {
    id: "data-science",
    slug: "data-science",
    title: "Data Science & Analysis",
    description:
      "Twelve weeks, spreadsheets through a full capstone analysis. Real messy data, real statistics, real dashboards built in Python, and Tableau/Power BI judgment practiced as labeled simulations. Career Path Edition is honest about junior roles. No prior coding required.",
    thumbnail: "/lab/data-science.webp",
    whopAccessPassId: "prod_9eVAjfMpwcaX8",
    whopPlanId: "plan_ysRjmrPzOn9j1",
    checkoutUrl: "https://whop.com/checkout/plan_ysRjmrPzOn9j1",
    contentDir: "courses/data-science",
    firstLessonPath: "module-00",
    waitlistUrl:
      "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20Data%20Science%20%26%20Analysis%0A",
    // All 9 modules, all 315 practice tasks (SQL/Excel/Python/Statistics/
    // Tableau/Power BI/Automation/Integrated), the diagnostic, adaptive
    // engine, misconception system, learning roadmap, portfolio, career
    // path, and capstone are real and built. Real Whop product/plan created
    // 2026-08-25 (see whop-created-products.json). checkout -> webhook ->
    // entitlement -> access verified end to end live against production on
    // 2026-08-25 (real signed webhook, real DB writes, duplicate protection,
    // revocation, and cross-course isolation all confirmed, test data
    // cleaned up afterward) before flipping this to true.
    published: true,
  },
  {
    id: "ai-automation",
    slug: "ai-automation",
    title: "AI Automation",
    description:
      "Build client-ready workflow judgment: process mapping, simulated API and webhook labs, retries, idempotency, and bounded AI steps. No programming required. n8n is the example, not the product. Does not promise clients or a job.",
    thumbnail: "/lab/ai-engineering.webp",
    whopAccessPassId: "prod_2u2WQzQUio8kF",
    whopPlanId: "plan_ED9yF9ehN2RIa",
    checkoutUrl: "https://whop.com/checkout/plan_ED9yF9ehN2RIa",
    contentDir: "courses/automation-engineering",
    firstLessonPath: "dashboard",
    waitlistUrl:
      "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20AI%20Automation%0A",
    // Content is built (8 modules, 80 practice tasks, 8 projects). Real Whop
    // product/plan created 2026-08-30 (prod_2u2WQzQUio8kF / plan_ED9yF9ehN2RIa).
    published: true,
  },
  {
    id: "ai-assisted-software-engineering",
    slug: "ai-assisted-software-engineering",
    title: "AI-Assisted Software Engineering",
    description:
      "Twelve weeks for people who have never shipped code: HTML, CSS, and JavaScript by hand, then Cursor, GitHub, tests, and a live URL. Not AI Engineering (that course builds LLM products). No job guarantee.",
    thumbnail: "/lab/data-science.webp",
    whopAccessPassId: "",
    whopPlanId: "",
    checkoutUrl: "",
    contentDir: "courses/ai-assisted-software-engineering",
    firstLessonPath: "module-00",
    waitlistUrl:
      "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20AI-Assisted%20Software%20Engineering%0A",
    // Content is on disk (modules, practice libraries, desktop labs). Keep
    // unpublished until the structural verifier, live gate tests, and a real
    // Whop product exist. Flipping this to true would start serving files
    // through the guarded course route.
    published: false,
  },
];

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getCourseBySlug(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

/** Real purchase_url if configured, else the waitlist fallback — a button is never dead. */
export function getCheckoutUrl(course: Course): { url: string; isRealCheckout: boolean } {
  if (course.checkoutUrl) return { url: course.checkoutUrl, isRealCheckout: true };
  return { url: course.waitlistUrl, isRealCheckout: false };
}

/** Whop access_pass_id -> internal course id. */
export function courseIdForWhopProductId(whopProductId: string): string | null {
  for (const course of COURSES) {
    if (course.whopAccessPassId && course.whopAccessPassId === whopProductId) return course.id;
  }
  return null;
}
