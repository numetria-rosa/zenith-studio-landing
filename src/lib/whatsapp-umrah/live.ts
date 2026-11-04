import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";

type Tx = PrismaClient | Prisma.TransactionClient;

/** What an agency needs before the agent may reply to customers: a connected number, a knowledge base with
    content, and a subscription in good standing. Settings are optional (defaults apply). */
export function isReadyToGoLive(a: { whatsappConnected: boolean; kbHasContent: boolean; subscriptionActive: boolean }): boolean {
  return a.whatsappConnected && a.kbHasContent && a.subscriptionActive;
}

/** Moves an ONBOARDING or PAUSED agency to LIVE once it is ready. Called from every step that can complete the
    last missing piece (connecting the number, adding knowledge base content, a payment recovering), so the
    order the owner does things in doesn't matter. Never moves a LIVE agency anywhere: pausing is the billing
    webhook's job (pauseWaAgencyByMembership). */
export async function syncAgencyLive(agencyId: string, client: Tx = db): Promise<boolean> {
  const agency = await client.waAgency.findUnique({
    where: { id: agencyId },
    select: {
      status: true,
      whatsapp: { select: { status: true } },
      subscription: { select: { status: true } },
      kbDocuments: { select: { _count: { select: { chunks: true } } } },
    },
  });
  if (!agency || (agency.status !== "ONBOARDING" && agency.status !== "PAUSED")) return false;
  const ready = isReadyToGoLive({
    whatsappConnected: agency.whatsapp?.status === "CONNECTED",
    kbHasContent: agency.kbDocuments.some((d) => d._count.chunks > 0),
    subscriptionActive: agency.subscription?.status === "ACTIVE",
  });
  if (!ready) return false;
  await client.waAgency.update({ where: { id: agencyId }, data: { status: "LIVE" } });
  return true;
}
