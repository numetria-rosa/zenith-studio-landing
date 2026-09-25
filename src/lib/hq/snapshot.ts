import { db } from "@/lib/db";

/* Writes one MrrSnapshot row per service for the given month, from real
   active ServiceProject/ServiceRequest/ServiceCatalog data - shared by the
   monthly cron (api/cron/snapshot-mrr) and the standalone script
   (scripts/snapshot-mrr.mjs) so the logic only lives once. Defaults to
   "last month" - the cron runs early on the 1st, when the month that just
   ended is the one worth snapshotting, not the one that just started. */
export async function snapshotMrr(targetMonth?: Date): Promise<{ serviceSlug: string; mrrCents: number }[]> {
  const now = new Date();
  const monthStart = targetMonth ?? new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const asOf = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59); // last instant of that month

  const projects = await db.serviceProject.findMany({
    where: { sourceServiceId: { not: null }, stage: { in: ["LIVE", "MAINTENANCE"] } },
    select: { userId: true, sourceServiceId: true, trialEndsAt: true },
  });
  const [catalog, requests] = await Promise.all([db.serviceCatalog.findMany(), db.serviceRequest.findMany()]);
  const catalogBySlug = new Map(catalog.map((c) => [c.slug, c]));
  const requestByKey = new Map(requests.map((r) => [`${r.userId}:${r.serviceId}`, r]));

  const mrrBySlug = new Map<string, number>();
  for (const p of projects) {
    if (!p.sourceServiceId) continue;
    if (p.trialEndsAt && p.trialEndsAt.getTime() > asOf.getTime()) continue; // still trialing as of that month, not active revenue
    const request = requestByKey.get(`${p.userId}:${p.sourceServiceId}`);
    if (!request || request.monthlyStatus !== "active") continue;
    const cat = catalogBySlug.get(p.sourceServiceId);
    if (!cat) continue;
    const price = request.billingCycle === "quarterly" && cat.quarterlyPriceCentsPerMonth != null ? cat.quarterlyPriceCentsPerMonth : (cat.monthlyPriceCents ?? 0);
    mrrBySlug.set(p.sourceServiceId, (mrrBySlug.get(p.sourceServiceId) ?? 0) + price);
  }

  const results: { serviceSlug: string; mrrCents: number }[] = [];
  for (const [serviceSlug, mrrCents] of mrrBySlug) {
    await db.mrrSnapshot.upsert({
      where: { month_serviceSlug: { month: monthStart, serviceSlug } },
      create: { month: monthStart, serviceSlug, mrrCents },
      update: { mrrCents },
    });
    results.push({ serviceSlug, mrrCents });
  }
  return results;
}
