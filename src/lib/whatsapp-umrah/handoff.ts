import { db } from "@/lib/db";

/* Human takeover/resume - spec 3.3. Auto-handoff (guard-triggered) is
   built in agent/pipeline.ts + inbound.ts; this is the manual side: the
   dashboard's "Take over"/"Resume AI" buttons, plus the idle auto-resume
   timer. Detecting a human reply sent from the agency's own WhatsApp
   Business app (rather than through our dashboard) and auto-pausing on
   that isn't built - Meta's message-echo webhook shape for this isn't
   confirmed against their current docs yet (see CLAUDE.md: never guess).
   Revisit once that's checked; "Take over" from the dashboard covers the
   same outcome in the meantime. */

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Agency staff clicking "Take over" in the inbox. Requires an open
    (non-CLOSED) conversation belonging to this agency - callers scope by
    agencyId, not just conversationId, so one agency can never take over
    another's chat by guessing an id (app-level tenant isolation, see
    CLAUDE.md's Stack section). */
export async function takeOverConversation(agencyId: string, conversationId: string, userId: string): Promise<ActionResult> {
  const conversation = await db.waConversation.findFirst({ where: { id: conversationId, agencyId, status: { not: "CLOSED" } }, select: { id: true, status: true } });
  if (!conversation) return { ok: false, error: "not_found" };
  if (conversation.status === "HUMAN") return { ok: true }; // already taken over, idempotent

  await db.$transaction([
    db.waConversation.update({ where: { id: conversation.id }, data: { status: "HUMAN" } }),
    db.waHandoff.create({ data: { agencyId, conversationId: conversation.id, reason: "manual takeover", triggeredBy: "MANUAL", takenByUserId: userId } }),
  ]);
  return { ok: true };
}

/** "Resume AI" - resolves the open handoff (if any) and lets the pipeline
    answer again from the next inbound message. */
export async function resumeAi(agencyId: string, conversationId: string): Promise<ActionResult> {
  const conversation = await db.waConversation.findFirst({ where: { id: conversationId, agencyId }, select: { id: true, status: true } });
  if (!conversation) return { ok: false, error: "not_found" };
  if (conversation.status !== "HUMAN") return { ok: true }; // already AI-driven, idempotent

  const openHandoff = await db.waHandoff.findFirst({ where: { conversationId: conversation.id, resolvedAt: null }, orderBy: { startedAt: "desc" }, select: { id: true } });
  await db.$transaction([
    db.waConversation.update({ where: { id: conversation.id }, data: { status: "AI" } }),
    ...(openHandoff ? [db.waHandoff.update({ where: { id: openHandoff.id }, data: { resolvedAt: new Date() } })] : []),
  ]);
  return { ok: true };
}

/** Idle auto-resume - off by default (spec 3.3: "auto-resume after a
    configurable idle period (default off)"). Called from a cron, same
    shape as this repo's other daily/periodic jobs. Idle is measured from
    the handoff's own startedAt, not the conversation's last activity -
    an agent actively working a handed-off chat (even without a new
    customer message) shouldn't get the AI silently reactivated under
    them. */
export async function autoResumeIdleConversations(): Promise<number> {
  const openHandoffs = await db.waHandoff.findMany({
    where: { resolvedAt: null },
    select: { id: true, conversationId: true, startedAt: true, agency: { select: { agentSettings: { select: { autoResumeIdleMinutes: true } } } } },
  });

  let resumed = 0;
  for (const handoff of openHandoffs) {
    const idleMinutes = handoff.agency.agentSettings?.autoResumeIdleMinutes;
    if (!idleMinutes) continue;
    const idleSince = Date.now() - handoff.startedAt.getTime();
    if (idleSince < idleMinutes * 60_000) continue;

    await db.$transaction([
      db.waConversation.update({ where: { id: handoff.conversationId }, data: { status: "AI" } }),
      db.waHandoff.update({ where: { id: handoff.id }, data: { resolvedAt: new Date() } }),
    ]);
    resumed++;
  }
  return resumed;
}
