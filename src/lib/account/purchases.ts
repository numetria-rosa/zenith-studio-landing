import { COURSES } from "@/lib/courses";
import { getUserEntitlements } from "@/lib/entitlements";
import { getWhopClient } from "@/lib/whop";

export type Purchase = {
  courseId: string;
  title: string;
  subtitle: string;
  date: Date;
  /** Formatted amount, or null when Whop could not be reached or has no total. */
  paid: string | null;
  /** Whop's hosted page for this membership (receipts and cancellation live there). */
  manageUrl: string | null;
};

export function formatMoney(total: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(total);
  } catch {
    return `${total.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

/** Purchases from our entitlement records, enriched from Whop (amount, hosted manage page). Whop failures degrade to "—". */
export async function loadPurchases(userId: string): Promise<Purchase[]> {
  const entitlements = await getUserEntitlements(userId);
  const canCallWhop = !!process.env.WHOP_API_KEY;
  return Promise.all(
    entitlements.flatMap((e) => {
      const course = COURSES.find((c) => c.id === e.courseId);
      if (!course) return [];
      return [(async (): Promise<Purchase> => {
        let paid: string | null = null;
        let manageUrl: string | null = null;
        if (canCallWhop) {
          const whop = getWhopClient();
          const [payment, membership] = await Promise.allSettled([
            e.whopPaymentId ? whop.payments.retrieve(e.whopPaymentId) : Promise.reject(new Error("no payment id")),
            e.whopMembershipId ? whop.memberships.retrieve(e.whopMembershipId) : Promise.reject(new Error("no membership id")),
          ]);
          if (payment.status === "fulfilled" && payment.value.total != null) paid = formatMoney(payment.value.total, payment.value.currency);
          if (membership.status === "fulfilled") manageUrl = membership.value.manage_url;
        }
        return {
          courseId: course.id,
          title: course.title,
          subtitle: course.id === "ai-engineering" ? "Career Path Edition · Lifetime access" : "Lifetime access",
          date: e.grantedAt,
          paid,
          manageUrl,
        };
      })()];
    }),
  );
}
