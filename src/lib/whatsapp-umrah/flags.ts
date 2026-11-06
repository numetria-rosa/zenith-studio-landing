import { db } from "@/lib/db";

/** The owner marks an AI reply as wrong (or clears the mark). Scoped by agencyId like every other query, and only
    AI replies can be flagged. Returns whether a message was changed. */
export async function setReplyFlag(agencyId: string, messageId: string, flagged: boolean): Promise<boolean> {
  const { count } = await db.waMessage.updateMany({
    where: { id: messageId, agencyId, direction: "OUT", sender: "AI" },
    data: { flaggedAt: flagged ? new Date() : null },
  });
  return count > 0;
}

/** Flagged replies with the customer message each answered, newest first: the raw material for the test suite. */
export async function listFlaggedReplies(agencyId: string, take = 50): Promise<{ id: string; reply: string; customerMessage: string; flaggedAt: Date }[]> {
  const flagged = await db.waMessage.findMany({ where: { agencyId, flaggedAt: { not: null } }, orderBy: { flaggedAt: "desc" }, take, select: { id: true, body: true, conversationId: true, createdAt: true, flaggedAt: true } });
  return Promise.all(
    flagged.map(async (m) => {
      const asked = await db.waMessage.findFirst({ where: { agencyId, conversationId: m.conversationId, direction: "IN", createdAt: { lt: m.createdAt } }, orderBy: { createdAt: "desc" }, select: { body: true } });
      return { id: m.id, reply: m.body ?? "", customerMessage: asked?.body ?? "", flaggedAt: m.flaggedAt! };
    }),
  );
}
