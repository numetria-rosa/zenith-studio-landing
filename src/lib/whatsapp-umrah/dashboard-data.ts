import { cache } from "react";
import { db } from "@/lib/db";

/* Client-facing dashboard data access. Same IDOR-safe pattern as
   src/lib/service-workspace.ts's getOwnedServiceProject: every query is
   scoped to {agencyId, userId} in one query (via the membership relation,
   since WaAgency has no direct userId column - a client can staff several
   agencies), never "fetch by id, then check ownership after". A mismatch
   always resolves to the same not-found outcome the caller 404s on. */

export const getOwnedAgency = cache(async function getOwnedAgency(agencyId: string, userId: string) {
  return db.waAgency.findFirst({
    where: { id: agencyId, memberships: { some: { userId } } },
    include: {
      whatsapp: true,
      agentSettings: true,
      subscription: true,
      kbDocuments: { orderBy: { createdAt: "desc" }, include: { _count: { select: { chunks: true } } } },
    },
  });
});

export type OwnedAgency = NonNullable<Awaited<ReturnType<typeof getOwnedAgency>>>;

/** This period's reply usage against the plan cap, plus how many overage
    packs (see src/lib/whatsapp-umrah/overage.ts) are already bought - used
    by the Overview page's usage card and its "buy more" CTA. */
export async function getUsageSummary(agencyId: string) {
  const { withinCap, currentBillingPeriodStart } = await import("./entitlements");
  const [cap, usage] = await Promise.all([
    withinCap(agencyId),
    db.waUsageCounter.findUnique({
      where: { agencyId_periodStart: { agencyId, periodStart: currentBillingPeriodStart() } },
      select: { overagePacks: true },
    }),
  ]);
  return { ...cap, overagePacks: usage?.overagePacks ?? 0 };
}

export async function listConversations(agencyId: string) {
  return db.waConversation.findMany({
    where: { agencyId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { contact: { select: { name: true, phone: true } }, _count: { select: { messages: true } } },
  });
}

export async function getConversationThread(agencyId: string, conversationId: string) {
  return db.waConversation.findFirst({
    where: { id: conversationId, agencyId },
    include: {
      contact: true,
      messages: { orderBy: { createdAt: "asc" } },
      handoffs: { orderBy: { startedAt: "desc" }, take: 1 },
    },
  });
}

export async function listLeads(agencyId: string, status?: string) {
  return db.waLead.findMany({
    where: { agencyId, ...(status ? { status: status as never } : {}) },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { contact: { select: { name: true, phone: true } } },
  });
}

/** Everything the analytics page shows, in one pass over the last 30
    days - conversations, leads, hot leads, handoff rate, average time to
    first AI reply, and this month's usage against the plan cap. */
export async function getAnalyticsSummary(agencyId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [conversationCount, leadCounts, handoffCount, totalConversations, capData] = await Promise.all([
    db.waConversation.count({ where: { agencyId, createdAt: { gte: since } } }),
    db.waLead.groupBy({ by: ["status"], where: { agencyId, createdAt: { gte: since } }, _count: true }),
    db.waHandoff.count({ where: { agencyId, startedAt: { gte: since } } }),
    db.waConversation.count({ where: { agencyId, createdAt: { gte: since } } }),
    (async () => {
      const { withinCap } = await import("./entitlements");
      return withinCap(agencyId);
    })(),
  ]);

  const firstReplyGaps = await db.$queryRaw<{ avg_seconds: number | null }[]>`
    SELECT AVG(EXTRACT(EPOCH FROM (first_out."createdAt" - c."createdAt"))) AS avg_seconds
    FROM "WaConversation" c
    JOIN LATERAL (
      SELECT m."createdAt" FROM "WaMessage" m
      WHERE m."conversationId" = c.id AND m.direction = 'OUT'
      ORDER BY m."createdAt" ASC LIMIT 1
    ) first_out ON true
    WHERE c."agencyId" = ${agencyId} AND c."createdAt" >= ${since}
  `;

  return {
    conversations: conversationCount,
    leadsByStatus: Object.fromEntries(leadCounts.map((l) => [l.status, l._count])),
    hotLeads: leadCounts.find((l) => l.status === "HOT")?._count ?? 0,
    handoffRate: totalConversations > 0 ? handoffCount / totalConversations : 0,
    avgFirstReplySeconds: firstReplyGaps[0]?.avg_seconds ?? null,
    usage: capData,
  };
}
