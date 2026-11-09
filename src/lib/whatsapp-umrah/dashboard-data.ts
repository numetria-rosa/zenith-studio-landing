import { cache } from "react";
import { db } from "@/lib/db";
import { isWithinBusinessHours } from "./hours";
import { resolveTimezone } from "./timezone";
import { marketForWhopPlanId } from "./whop-plans";

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
      manualConnectRequests: { where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
});

export type OwnedAgency = NonNullable<Awaited<ReturnType<typeof getOwnedAgency>>>;

/** This period's reply usage against the agency's limit (its own, or the plan cap) - used by the Overview page's usage card. */
export async function getUsageSummary(agencyId: string) {
  const { withinCap } = await import("./entitlements");
  return withinCap(agencyId);
}

export async function listConversations(agencyId: string) {
  const conversations = await db.waConversation.findMany({
    where: { agencyId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      contact: { select: { name: true, phone: true, language: true } },
      _count: { select: { messages: true } },
      messages: { where: { direction: "OUT", sender: "HUMAN" }, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      leads: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
    },
  });
  // The newest message of each chat (either side), for the list preview.
  const latest = await db.waMessage.findMany({
    where: { agencyId, conversationId: { in: conversations.map((c) => c.id) } },
    orderBy: [{ conversationId: "asc" }, { createdAt: "desc" }],
    distinct: ["conversationId"],
    select: { conversationId: true, body: true, createdAt: true },
  });
  const byConversation = new Map(latest.map((m) => [m.conversationId, m]));
  return conversations.map((c) => ({ ...c, lastMessage: byConversation.get(c.id) ?? null }));
}

export async function getConversationThread(agencyId: string, conversationId: string) {
  return db.waConversation.findFirst({
    where: { id: conversationId, agencyId },
    include: {
      contact: true,
      messages: { orderBy: { createdAt: "asc" } },
      handoffs: { orderBy: { startedAt: "asc" } }, // all of them: each is a divider in the chat when control changes
      leads: { orderBy: { createdAt: "desc" }, take: 1 },
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

const DAY_MS = 24 * 60 * 60 * 1000;

/** Everything the analytics page shows for the last `days` days (and the same length before, for the "vs previous"
    figures). Handoff rate counts conversations that had at least one handoff, not handoff events, so it can never pass 100%. */
export async function getAnalyticsSummary(agencyId: string, days = 30) {
  const now = Date.now();
  const since = new Date(now - days * DAY_MS);
  const tzRow = await db.waAgency.findUnique({ where: { id: agencyId }, select: { agentSettings: { select: { timezone: true } }, subscription: { select: { whopPlanId: true } } } });
  const TZ = resolveTimezone(tzRow?.agentSettings?.timezone, marketForWhopPlanId(tzRow?.subscription?.whopPlanId)?.market);
  const prevSince = new Date(now - 2 * days * DAY_MS);

  const [conversations, prevConversations, leadCounts, prevHot, handedOff, capData, contacts] = await Promise.all([
    db.waConversation.findMany({ where: { agencyId, createdAt: { gte: since } }, select: { createdAt: true } }),
    db.waConversation.count({ where: { agencyId, createdAt: { gte: prevSince, lt: since } } }),
    db.waLead.groupBy({ by: ["status"], where: { agencyId, createdAt: { gte: since } }, _count: true }),
    db.waLead.count({ where: { agencyId, status: "HOT", createdAt: { gte: prevSince, lt: since } } }),
    db.waHandoff.findMany({ where: { agencyId, startedAt: { gte: since } }, distinct: ["conversationId"], select: { conversationId: true } }),
    (async () => {
      const { withinCap } = await import("./entitlements");
      return withinCap(agencyId);
    })(),
    db.waContact.groupBy({ by: ["language"], where: { agencyId, createdAt: { gte: since } }, _count: true }),
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
  const inbound = await db.waMessage.findMany({ where: { agencyId, direction: "IN", createdAt: { gte: since } }, select: { createdAt: true } });

  // Conversations per day, oldest first, zero-filled.
  const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });
  const perDayMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) perDayMap.set(dayKey(new Date(now - i * DAY_MS)), 0);
  for (const c of conversations) perDayMap.set(dayKey(c.createdAt), (perDayMap.get(dayKey(c.createdAt)) ?? 0) + 1);

  // Customer messages by hour of day, in agency time.
  const hourly = Array.from({ length: 24 }, () => 0);
  for (const m of inbound) hourly[Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(m.createdAt)) % 24]++;

  // Share of customer messages that arrived outside the agency's office hours (null when it is open 24/7).
  const hoursSettings = await db.waAgentSettings.findUnique({ where: { agencyId }, select: { businessHours: true } });
  const outsideHoursPct = hoursSettings?.businessHours && inbound.length > 0 ? Math.round((inbound.filter((m) => !isWithinBusinessHours(hoursSettings.businessHours, TZ, m.createdAt)).length / inbound.length) * 100) : null;

  const languageTotal = contacts.reduce((sum, c) => sum + c._count, 0);
  const languages = Object.fromEntries(["en", "ar", "tr", "ur"].map((code) => [code, languageTotal ? Math.round(((contacts.find((c) => (c.language ?? "en") === code)?._count ?? 0) / languageTotal) * 100) : 0]));

  const hot = leadCounts.find((l) => l.status === "HOT")?._count ?? 0;
  return {
    days,
    conversations: conversations.length,
    conversationsDelta: conversations.length - prevConversations,
    leadsByStatus: Object.fromEntries(leadCounts.map((l) => [l.status, l._count])) as Record<string, number>,
    hotLeads: hot,
    hotLeadsDelta: hot - prevHot,
    handoffRate: conversations.length > 0 ? Math.min(1, handedOff.length / conversations.length) : 0,
    avgFirstReplySeconds: firstReplyGaps[0]?.avg_seconds ?? null,
    perDay: [...perDayMap].map(([date, count]) => ({ date, count })),
    hourly,
    outsideHoursPct,
    languages,
    languageTotal,
    usage: capData,
  };
}
