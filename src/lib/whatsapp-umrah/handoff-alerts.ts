import { db } from "@/lib/db";
import { sendPlainEmail } from "@/lib/outreach-mail";
import { containsSensitiveData } from "./agent/pre-guards";

/* When the agent hands a chat to a person, the customer is told "someone will get back to you". Nothing told
   the person. This emails the agency's team when a chat needs them, and again (at most every 15 minutes, and
   only while nobody has replied) if the customer keeps writing. A WhatsApp alert would need an approved
   template and the owner's opt-in, which aren't built, so email is the channel. */

const SITE_URL = "https://zenith-studio.site";
export const REPEAT_ALERT_MINUTES = 15;

/** Whether a customer who is still waiting on a person should trigger another email: never if someone from the
    team has replied since the last alert, otherwise once the quiet period has passed. */
export function shouldAlertAgain(input: { alertedAt: Date | null; lastHumanReplyAt: Date | null; now?: Date }): boolean {
  const { alertedAt, lastHumanReplyAt, now = new Date() } = input;
  if (!alertedAt) return true;
  if (lastHumanReplyAt && lastHumanReplyAt > alertedAt) return false;
  return now.getTime() - alertedAt.getTime() >= REPEAT_ALERT_MINUTES * 60_000;
}

/** The customer's words for the email, or a note instead when they might be a passport or card number or when
    the message wasn't text, so those never travel by email. */
export function describeCustomerMessage(message: string | null): string {
  if (message === null) return "(a photo, document, voice note or other non-text message)";
  if (containsSensitiveData(message)) return "(a message that looks like it contains a passport or card number, so it is not shown here)";
  const text = message.replace(/\s+/g, " ").trim();
  return text.length > 300 ? `${text.slice(0, 297)}...` : text;
}

export function handoffEmail(input: { agencyName: string; agencyId: string; conversationId: string; customer: string; reason: string | null; message: string | null; repeat: boolean }) {
  const link = `${SITE_URL}/whatsapp-umrah/${input.agencyId}/inbox?c=${input.conversationId}`;
  const subject = input.repeat ? `${input.agencyName}: ${input.customer} is still waiting for a reply` : `${input.agencyName}: ${input.customer} needs a person`;
  const lines = [
    input.repeat ? `${input.customer} has written again and nobody has replied yet. The agent stays quiet in this chat until you take over or resume it.` : `The agent has handed a WhatsApp chat to your team. The customer was told someone will get back to them.`,
    "",
    ...(input.reason && !input.repeat ? [`Why: ${input.reason}`] : []),
    `Customer: ${input.customer}`,
    `Their message: ${describeCustomerMessage(input.message)}`,
    "",
    `Open the chat and reply: ${link}`,
  ];
  return { subject, text: lines.join("\n") };
}

async function teamEmails(agencyId: string): Promise<{ agencyName: string; emails: string[] } | null> {
  const agency = await db.waAgency.findUnique({
    where: { id: agencyId },
    select: { name: true, memberships: { select: { user: { select: { email: true } } } } },
  });
  if (!agency) return null;
  return { agencyName: agency.name, emails: agency.memberships.map((m) => m.user.email).filter((e): e is string => !!e) };
}

async function sendAlert(args: { agencyId: string; conversationId: string; reason: string | null; message: string | null; repeat: boolean }): Promise<void> {
  const team = await teamEmails(args.agencyId);
  if (!team || team.emails.length === 0) return;
  const conversation = await db.waConversation.findUnique({ where: { id: args.conversationId }, select: { contact: { select: { name: true, phone: true } } } });
  const customer = conversation?.contact.name || (conversation?.contact.phone ? `+${conversation.contact.phone}` : "A customer");
  const { subject, text } = handoffEmail({ agencyName: team.agencyName, agencyId: args.agencyId, conversationId: args.conversationId, customer, reason: args.reason, message: args.message, repeat: args.repeat });
  await db.waConversation.update({ where: { id: args.conversationId }, data: { humanAlertedAt: new Date() } });
  await Promise.all(team.emails.map((to) => sendPlainEmail(to, subject, text).catch((err) => console.error("[whatsapp-umrah] handoff alert email failed", err))));
}

/** A chat was just handed to a person by the agent. Never throws: an alert that fails must not break the reply path. */
export async function alertHandoff(args: { agencyId: string; conversationId: string; reason: string; message: string | null }): Promise<void> {
  try {
    await sendAlert({ ...args, repeat: false });
  } catch (err) {
    console.error("[whatsapp-umrah] handoff alert failed", err);
  }
}

/** The customer wrote again in a chat that is waiting on a person. Emails again only if nobody has replied and
    the last alert was long enough ago. Never throws. */
export async function alertWaitingCustomer(args: { agencyId: string; conversationId: string; message: string | null }): Promise<void> {
  try {
    const conversation = await db.waConversation.findUnique({ where: { id: args.conversationId }, select: { humanAlertedAt: true } });
    if (!conversation) return;
    const lastReply = await db.waMessage.findFirst({ where: { conversationId: args.conversationId, direction: "OUT", sender: "HUMAN" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
    if (!shouldAlertAgain({ alertedAt: conversation.humanAlertedAt, lastHumanReplyAt: lastReply?.createdAt ?? null })) return;
    await sendAlert({ ...args, reason: null, repeat: true });
  } catch (err) {
    console.error("[whatsapp-umrah] waiting-customer alert failed", err);
  }
}

/** How many chats are waiting on a person right now: handed over, and the customer spoke last. For the dashboard. */
export async function countWaitingConversations(agencyId: string): Promise<number> {
  const chats = await db.waConversation.findMany({
    where: { agencyId, status: "HUMAN" },
    take: 100,
    select: { messages: { orderBy: { createdAt: "desc" }, take: 1, select: { direction: true } } },
  });
  return chats.filter((c) => c.messages[0]?.direction === "IN").length;
}
