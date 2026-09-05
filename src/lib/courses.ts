/* Zenith Lab - central course catalog.
   The single authoritative place a course is defined: what it's called, where
   its content lives, and how it maps to a real Whop product. Nothing else
   (checkout buttons, the dashboard, the webhook handler) should hardcode a
   checkout link or a product ID - they all read through this file.

   Whop IDs are literal values, not env vars - they're not secrets (only
   WHOP_API_KEY and WHOP_WEBHOOK_SECRET are), and hardcoding them here means
   one file to update instead of keeping .env and Vercel's env vars in sync.
   Created via scripts/create-whop-products.mjs on 2026-08-21.

   Adding another course later means adding one entry here, not touching the
   access-control system. */

export type Course = {
  id: string; // stable internal id - also the courseId stored on CourseEntitlement/CourseProgress rows
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
  /** Where content actually lives on disk, served only through the guarded route.
      Optional when renderMode is "react" - a React course has no static contentDir. */
  contentDir?: string;
  /** First page inside contentDir a newly-entitled user should land on.
      Optional when renderMode is "react". */
  firstLessonPath?: string;
  /** "static" (default, omit the field) = the existing static-HTML-per-module
      courses, served by the guarded contentDir route. "react" = real Next.js/
      React lesson pages under /lab/[courseId]/learn, gated by that route's own
      layout instead. See the "if we work on a new course" architecture plan. */
  renderMode?: "static" | "react";
  /** Path (relative to repo root) to the ordered lesson manifest module for a
      "react" course. Only used when renderMode === "react". */
  lessonManifest?: string;
  /** Fallback when no purchase_url is configured yet - never show a dead button. */
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
      "An 8-week accelerated program, ~10 hours a week: prompting, retrieval, agents, tool use, structured outputs, and evaluation, the real stack behind production AI products. Basic programming logic required, no prior Python needed.",
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
    thumbnail: "/lab/ai-automation.webp",
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
      "Software engineering with AI as your pair programmer, for people who have never shipped code. Fourteen Northline Digital tickets: you write the spec, write engineering prompts for an AI coding assistant, inspect what an agent produced, run it, test it, review it, and ship it. Graded practice across HTML, CSS, JavaScript, specs, Git, review, testing, Python, and AI Code Detective - plus a real Cursor session, a real GitHub repo, and a live URL that is not the repo itself. Not AI Engineering (that course builds LLM products). No job guarantee.",
    thumbnail: "/lab/ai-assisted-software-engineering.webp",
    whopAccessPassId: "prod_rW17sq9hKeXYN",
    whopPlanId: "plan_ximKlnIKYO7Bx",
    checkoutUrl: "https://whop.com/checkout/plan_ximKlnIKYO7Bx",
    contentDir: "courses/ai-assisted-software-engineering",
    firstLessonPath: "module-00",
    waitlistUrl:
      "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20AI-Assisted%20Software%20Engineering%0A",
    // Live path: module ids 1–13 plus NL-014 (prompt engineering) inserted
    // after module 6. Storage stays schema 2 so existing completions are not remapped.
    // Fourteen Northline Digital tickets, the 11-step loop, AI Code Detective, Desktop Labs.
    // Practice-task count is whatever verify-aise-practice-tasks.py reports.
    // Real Whop product/plan created 2026-08-30
    // (prod_rW17sq9hKeXYN / plan_ximKlnIKYO7Bx).
    published: true,
  },
  {
    id: "math-for-ml",
    slug: "math-for-ml",
    title: "Mathematics for Machine Learning",
    description:
      "From mathematical foundations to understanding how modern machine learning actually works: vectors, transformations, PCA, calculus and optimization, probability, information theory, and the math behind neural networks and attention. Built as a real interactive computational lab, not a video series. No prior calculus or linear algebra required.",
    thumbnail: "/lab/math-for-ml.webp",
    whopAccessPassId: "prod_OKFbmWkhFm7rS",
    whopPlanId: "plan_3kAXjmfXopjpa",
    checkoutUrl: "https://whop.com/checkout/plan_3kAXjmfXopjpa",
    renderMode: "react",
    lessonManifest: "content/react-courses/math-for-ml/lessons.ts",
    waitlistUrl:
      "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20Mathematics%20for%20Machine%20Learning%0A",
    // Built as the flagship pilot of the "react" render mode (see
    // if-we-work-on-adaptive-raccoon.md and MATH_FOR_ML_CURRICULUM_RESEARCH.md).
    // All 11 modules, Foundation Bridge, diagnostic, practice library,
    // projects, and capstone are real content. Real Whop product/plan
    // created 2026-09-05 (prod_OKFbmWkhFm7rS / plan_3kAXjmfXopjpa),
    // $21.25 (75% off $85) through Sept 7, matching the other 4 courses'
    // launch-sale deadline. See scripts/create-math-for-ml-whop-product.mjs.
    published: true,
  },
];

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getCourseBySlug(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

/** Where an entitled student should land: the guarded static contentDir route
    for a "static" course, or the guarded /learn route for a "react" course. */
export function courseHomeUrl(course: Course): string {
  if (course.renderMode === "react") return `/lab/${course.id}/learn`;
  return `/courses/${course.id}/${course.firstLessonPath}`;
}

/** Real purchase_url if configured, else the waitlist fallback - a button is never dead. */
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
