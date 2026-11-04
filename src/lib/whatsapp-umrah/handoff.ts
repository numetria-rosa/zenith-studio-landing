import { db } from "@/lib/db";

/* Human takeover/resume - spec 3.3. Auto-handoff (guard-triggered) is
   built in agent/pipeline.ts + inbound.ts; this is the manual side: the
   dashboard's "Take over"/"Resume AI" buttons, plus the idle auto-resume. Detecting a human reply sent from the agency's own WhatsApp
   Business app is also built, separately, in
   inbound.ts's processEchoedStaffMessage - confirmed against Meta's
   smb_message_echoes webhook reference (2026-09-28), see CLAUDE.md. */

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

/** Whether a chat the team took over has been quiet long enough for the AI to answer again: measured from the
    team's last activity (the handoff itself, or their latest reply), so an agent actively working a chat never
    has the AI reactivated under them. */
export function isIdleLongEnough(input: { lastTeamActivityAt: Date; idleMinutes: number; now?: Date }): boolean {
  const { lastTeamActivityAt, idleMinutes, now = new Date() } = input;
  return idleMinutes > 0 && now.getTime() - lastTeamActivityAt.getTime() >= idleMinutes * 60_000;
}

/** The "let the AI take over again after N minutes" setting (spec 3.3, off by default). It is checked when the
    customer next writes in a chat waiting on a person, not by a timer: the project's cron plan only runs
    daily, and the moment the AI would speak is the moment the customer writes. Returns whether it resumed. */
export async function resumeIfIdle(agencyId: string, conversationId: string, idleMinutes: number | null | undefined): Promise<boolean> {
  if (!idleMinutes) return false;
  const [handoff, lastReply] = await Promise.all([
    db.waHandoff.findFirst({ where: { conversationId, resolvedAt: null }, orderBy: { startedAt: "desc" }, select: { startedAt: true } }),
    db.waMessage.findFirst({ where: { conversationId, direction: "OUT", sender: "HUMAN" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);
  const times = [handoff?.startedAt, lastReply?.createdAt].filter((d): d is Date => !!d);
  if (times.length === 0) return false;
  const lastTeamActivityAt = new Date(Math.max(...times.map((d) => d.getTime())));
  if (!isIdleLongEnough({ lastTeamActivityAt, idleMinutes })) return false;
  return (await resumeAi(agencyId, conversationId)).ok;
}
