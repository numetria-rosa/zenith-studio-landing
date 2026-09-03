/* Zenith Lab — course bundles.
   A bundle is its own Whop product/plan (a pure checkout vehicle — nobody
   is ever granted content through it directly), sold at one fixed price.
   What it actually unlocks is decided entirely here: courseIds lists the
   real course ids from courses.ts that a successful bundle payment grants
   a CourseEntitlement row for (see handlePaymentSucceeded in
   src/app/api/webhooks/whop/route.ts).

   Created via scripts/create-whop-bundles.mjs on 2026-09-03. Prices are
   15% off the sum of the bundled courses' live per-course prices at
   creation time — not automated, so if a course's individual price
   changes later, a bundle's price does not silently follow it. */

export type Bundle = {
  id: string; // stable internal id, distinct from any Course.id
  title: string;
  description: string;
  /** The real Course.id values (see courses.ts) this bundle grants access to. */
  courseIds: string[];
  /** Display price, e.g. "$56.10". */
  price: string;
  /** Real Whop access_pass_id (product id) for this bundle's checkout vehicle. */
  whopAccessPassId: string;
  /** Real Whop plan_id for this bundle. */
  whopPlanId: string;
  /** Real Whop purchase_url (checkout link) for this bundle. */
  checkoutUrl: string;
};

export const BUNDLES: Bundle[] = [
  {
    id: "ai-engineering-automation",
    title: "AI Engineering + AI Automation Bundle",
    description:
      "Full access to AI Engineering and AI Automation, bundled at 15% off buying them separately.",
    courseIds: ["ai-engineering", "ai-automation"],
    price: "$56.10",
    whopAccessPassId: "prod_vTnpT739BU4eM",
    whopPlanId: "plan_NFGFagPrJyNM5",
    checkoutUrl: "https://whop.com/checkout/plan_NFGFagPrJyNM5",
  },
  {
    id: "swe-ai-engineering",
    title: "AI-Assisted Software Engineering + AI Engineering Bundle",
    description:
      "Full access to AI-Assisted Software Engineering and AI Engineering, bundled at 15% off buying them separately.",
    courseIds: ["ai-assisted-software-engineering", "ai-engineering"],
    price: "$45.48",
    whopAccessPassId: "prod_WiyrjnVMppopW",
    whopPlanId: "plan_GnqESzu68VSrz",
    checkoutUrl: "https://whop.com/checkout/plan_GnqESzu68VSrz",
  },
];

/** Whop access_pass_id -> the list of internal course ids it should grant, or null if none match. */
export function courseIdsForWhopBundleProductId(whopProductId: string): string[] | null {
  for (const bundle of BUNDLES) {
    if (bundle.whopAccessPassId === whopProductId) return bundle.courseIds;
  }
  return null;
}
