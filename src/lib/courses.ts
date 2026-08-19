/* Zenith Lab — central course catalog.
   The single authoritative place a course is defined: what it's called, where
   its content lives, and how it maps to a real Whop product. Nothing else
   (checkout buttons, the dashboard, the webhook handler) should hardcode a
   checkout link or a product ID — they all read through this file.

   Adding a fifth course later means adding one entry here, not touching the
   access-control system. */

export type Course = {
  id: string; // stable internal id — also the courseId stored on CourseEntitlement/CourseProgress rows
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  /** Env var name holding the real Whop access_pass_id for this course, once created. */
  whopAccessPassIdEnvKey: string;
  /** Env var name holding the real Whop plan_id for this course, once created. */
  whopPlanIdEnvKey: string;
  /** Env var name holding the real purchase_url (checkout link) for this course, once created. */
  checkoutUrlEnvKey: string;
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
    whopAccessPassIdEnvKey: "WHOP_AI_ENGINEERING_ACCESS_PASS_ID",
    whopPlanIdEnvKey: "WHOP_AI_ENGINEERING_PLAN_ID",
    checkoutUrlEnvKey: "WHOP_AI_ENGINEERING_CHECKOUT_URL",
    contentDir: "courses/ai-engineering",
    firstLessonPath: "dashboard.html",
    waitlistUrl:
      "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20AI%20Engineering%0A",
    published: true,
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
  const configured = process.env[course.checkoutUrlEnvKey];
  if (configured) return { url: configured, isRealCheckout: true };
  return { url: course.waitlistUrl, isRealCheckout: false };
}

/** Whop access_pass_id -> internal course id, built from env at call time so it
    picks up whatever's actually configured without needing a code change. */
export function courseIdForWhopProductId(whopProductId: string): string | null {
  for (const course of COURSES) {
    const configuredId = process.env[course.whopAccessPassIdEnvKey];
    if (configuredId && configuredId === whopProductId) return course.id;
  }
  return null;
}
