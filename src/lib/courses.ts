/* Zenith Lab — central course catalog.
   The single authoritative place a course is defined: what it's called, where
   its content lives, and how it maps to a real Whop product. Nothing else
   (checkout buttons, the dashboard, the webhook handler) should hardcode a
   checkout link or a product ID — they all read through this file.

   Whop IDs are literal values, not env vars — they're not secrets (only
   WHOP_API_KEY and WHOP_WEBHOOK_SECRET are), and hardcoding them here means
   one file to update instead of keeping .env and Vercel's env vars in sync.
   Created via scripts/create-whop-products.mjs on 2026-08-21.

   Adding a fifth course later means adding one entry here, not touching the
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
    firstLessonPath: "dashboard.html",
    waitlistUrl:
      "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20AI%20Engineering%0A",
    published: true,
  },
  {
    id: "data-science",
    slug: "data-science",
    title: "Data Science & Analysis",
    description:
      "Twelve weeks, three entry tracks, spreadsheets through a full capstone analysis. Real messy data, real statistics, real dashboards, and a Career Path Edition built around actually getting paid. No prior coding required.",
    thumbnail: "/lab/data-science.webp",
    whopAccessPassId: "",
    whopPlanId: "",
    checkoutUrl: "",
    contentDir: "courses/data-science",
    firstLessonPath: "dashboard.html",
    waitlistUrl:
      "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20Data%20Science%20%26%20Analysis%0A",
    // Module 0 and Module 1 are built and live; Modules 2-9 and the Career Path
    // Edition pages exist as real, on-brand shells with placeholder lesson
    // content. Flip to true once a real Whop product exists and enough of the
    // module content is filled in to actually sell.
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
