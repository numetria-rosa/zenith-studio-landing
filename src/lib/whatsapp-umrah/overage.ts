import type { Prisma, PrismaClient } from "@prisma/client";
import { currentBillingPeriodStart } from "@/lib/whatsapp-umrah/entitlements";

type Tx = PrismaClient | Prisma.TransactionClient;

/** £5 one-time Whop plan credited via payment.succeeded - see
    scripts/create-whatsapp-umrah-overage-plan.mjs and CLAUDE.md's overage
    add-on section. Each pack adds 1,000 replies to THIS billing period's
    cap (withinCap in entitlements.ts reads it back). */
export async function creditOveragePack(tx: Tx, agencyId: string): Promise<void> {
  const periodStart = currentBillingPeriodStart();
  const periodEnd = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 0));
  await tx.waUsageCounter.upsert({
    where: { agencyId_periodStart: { agencyId, periodStart } },
    create: { agencyId, periodStart, periodEnd, overagePacks: 1 },
    update: { overagePacks: { increment: 1 } },
  });
}
