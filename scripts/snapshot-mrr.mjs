// Zenith HQ monthly MRR snapshot - manual/local runner for src/lib/hq/
// snapshot.ts's snapshotMrr(). The real schedule is the Vercel Cron at
// /api/cron/snapshot-mrr (see vercel.json) - this script is for a manual
// backfill or a dry run, same logic, no duplication.
//
// Usage: node --env-file=.env scripts/snapshot-mrr.mjs [YYYY-MM]

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const arg = process.argv[2];
const targetMonth = arg ? new Date(`${arg}-01T00:00:00`) : undefined;

// Inlined rather than importing the TS module directly (this is a plain
// .mjs run with `node`, same convention as this directory's other seed
// scripts) - kept in exact sync with src/lib/hq/snapshot.ts's logic.
const now = new Date();
const monthStart = targetMonth ?? new Date(now.getFullYear(), now.getMonth() - 1, 1);
const asOf = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);

const projects = await db.serviceProject.findMany({
  where: { sourceServiceId: { not: null }, stage: { in: ["LIVE", "MAINTENANCE"] } },
  select: { userId: true, sourceServiceId: true, trialEndsAt: true },
});
const [catalog, requests] = await Promise.all([db.serviceCatalog.findMany(), db.serviceRequest.findMany()]);
const catalogBySlug = new Map(catalog.map((c) => [c.slug, c]));
const requestByKey = new Map(requests.map((r) => [`${r.userId}:${r.serviceId}`, r]));

const mrrBySlug = new Map();
for (const p of projects) {
  if (p.trialEndsAt && p.trialEndsAt.getTime() > asOf.getTime()) continue;
  const request = requestByKey.get(`${p.userId}:${p.sourceServiceId}`);
  if (!request || request.monthlyStatus !== "active") continue;
  const cat = catalogBySlug.get(p.sourceServiceId);
  if (!cat) continue;
  const price = request.billingCycle === "quarterly" && cat.quarterlyPriceCentsPerMonth != null ? cat.quarterlyPriceCentsPerMonth : (cat.monthlyPriceCents ?? 0);
  mrrBySlug.set(p.sourceServiceId, (mrrBySlug.get(p.sourceServiceId) ?? 0) + price);
}

console.log(`Snapshotting ${monthStart.toISOString().slice(0, 7)}:`);
for (const [serviceSlug, mrrCents] of mrrBySlug) {
  await db.mrrSnapshot.upsert({
    where: { month_serviceSlug: { month: monthStart, serviceSlug } },
    create: { month: monthStart, serviceSlug, mrrCents },
    update: { mrrCents },
  });
  console.log(`  ${serviceSlug}: $${mrrCents / 100}`);
}

await db.$disconnect();
