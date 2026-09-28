import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/secrets";
import { sendPlainEmail } from "@/lib/outreach-mail";
import { runAgentPipeline } from "./agent/pipeline";
import { upsertLeadFromDraft, notifyOwnerOfHotLead } from "./leads";
import { MetaCloudWhatsAppProvider } from "./provider/meta";
import type { WhatsAppProvider } from "./provider/types";
import type { InboundTextMessage } from "./webhook";
import type { Language } from "./agent/types";

const META_TOKEN_ENV = "META_ACCESS_TOKEN_ENCRYPTION_KEY";

/* Only Starter is launched (see CLAUDE.md) - Growth/Pro are waitlist-only,
   so there's no real cap to look up for them yet. Revisit as a per-plan
   map once WaSubscription.plan can actually be GROWTH/PRO in practice. */
const STARTER_MONTHLY_CAP = 1000;

function billingPeriodStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** One inbound text message, start to finish: dedupe, opt-out, load
    everything, run the pipeline if the AI should speak, send, store,
    meter, capture the lead. Separate from the webhook route so it's
    testable with a MockWhatsAppProvider and doesn't depend on Next.js
    request/response types - the route is a thin wrapper over this. */
export async function processInboundMessage(msg: InboundTextMessage, providerOverride?: WhatsAppProvider): Promise<void> {
  const existingMessage = await db.waMessage.findUnique({ where: { waMessageId: msg.waMessageId }, select: { id: true } });
  if (existingMessage) return; // Meta retries failed/slow-acked webhooks for up to 7 days - dedupe, don't reprocess

  const account = await db.waWhatsAppAccount.findFirst({
    where: { phoneNumberId: msg.phoneNumberId, status: "CONNECTED" },
    select: { agencyId: true, encryptedAccessToken: true },
  });
  if (!account) return; // number not connected to any agency (or disconnected) - nothing to route this to

  const agency = await db.waAgency.findUnique({
    where: { id: account.agencyId },
    select: { id: true, name: true, status: true, memberships: { where: { role: "OWNER" }, take: 1, select: { user: { select: { email: true } } } } },
  });
  if (!agency || agency.status !== "LIVE") return; // onboarding/paused agencies don't get live replies yet

  const contact = await db.waContact.upsert({
    where: { agencyId_phone: { agencyId: agency.id, phone: msg.from } },
    update: msg.contactName ? { name: msg.contactName } : {},
    create: { agencyId: agency.id, phone: msg.from, name: msg.contactName },
    select: { id: true, optOut: true },
  });
  if (contact.optOut) return; // never message an opted-out contact, not even a handoff holding message

  let conversation = await db.waConversation.findFirst({
    where: { agencyId: agency.id, contactId: contact.id, status: { not: "CLOSED" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true },
  });
  if (!conversation) {
    conversation = await db.waConversation.create({
      data: { agencyId: agency.id, contactId: contact.id, status: "AI", entryPoint: "ORGANIC" },
      select: { id: true, status: true },
    });
  }
  await db.waConversation.update({ where: { id: conversation.id }, data: { lastCustomerMessageAt: new Date() } });

  await db.waMessage.create({
    data: { conversationId: conversation.id, agencyId: agency.id, direction: "IN", sender: "CUSTOMER", type: "TEXT", waMessageId: msg.waMessageId, body: msg.body },
  });

  if (conversation.status === "HUMAN") return; // a person already took over - AI stays silent, per spec

  const periodStart = billingPeriodStart();
  const usage = await db.waUsageCounter.findUnique({ where: { agencyId_periodStart: { agencyId: agency.id, periodStart } }, select: { aiReplies: true } });
  const ownerEmail = agency.memberships[0]?.user.email;
  if ((usage?.aiReplies ?? 0) >= STARTER_MONTHLY_CAP) {
    if (ownerEmail) {
      await sendPlainEmail(ownerEmail, `${agency.name}: monthly AI reply limit reached`, `Your WhatsApp agent has used its ${STARTER_MONTHLY_CAP} AI replies for this month, so it's paused until the new month starts. New messages are still saved to your dashboard.`);
    }
    return;
  }

  const history = await db.waMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { sender: true, body: true },
  });
  const conversationHistory = history
    .reverse()
    .map((m) => `${m.sender === "CUSTOMER" ? "Customer" : "AI"}: ${m.body ?? ""}`)
    .join("\n");

  const result = await runAgentPipeline({ agencyId: agency.id, customerMessage: msg.body, conversationHistory });

  const accessToken = account.encryptedAccessToken ? decryptSecret(account.encryptedAccessToken, META_TOKEN_ENV) : null;
  const provider = providerOverride ?? (accessToken ? new MetaCloudWhatsAppProvider(accessToken) : null);
  const outboundText = result.action === "reply" ? result.text : result.holdingMessage;

  if (outboundText && provider) {
    const sendResult = await provider.sendText({ phoneNumberId: msg.phoneNumberId, to: msg.from, body: outboundText });
    await db.waMessage.create({
      data: {
        conversationId: conversation.id,
        agencyId: agency.id,
        direction: "OUT",
        sender: "AI",
        type: "TEXT",
        waMessageId: sendResult.ok ? sendResult.waMessageId : null,
        body: outboundText,
        metaBillable: sendResult.ok, // billable service-message send from 1 Oct 2026, see CLAUDE.md
      },
    });
    if (sendResult.ok) {
      await db.waUsageCounter.upsert({
        where: { agencyId_periodStart: { agencyId: agency.id, periodStart } },
        create: { agencyId: agency.id, periodStart, periodEnd: new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 0)), aiReplies: 1 },
        update: { aiReplies: { increment: 1 } },
      });
    }
  }

  if (result.action === "handoff") {
    await db.waConversation.update({ where: { id: conversation.id }, data: { status: "HUMAN" } });
    await db.waHandoff.create({ data: { agencyId: agency.id, conversationId: conversation.id, reason: result.reason, triggeredBy: "AUTO" } });
  }

  // Lead capture runs on a handoff too, not only a normal reply - a
  // customer who states their budget/dates/travellers and then gets
  // handed off (e.g. because they asked to book) still needs that
  // information to reach the lead list. See leads.ts and the pipeline
  // commit for why this was originally missed.
  const leadResult = result.intent
    ? await upsertLeadFromDraft({ agencyId: agency.id, conversationId: conversation.id, contactId: contact.id, leadFields: result.leadFields, intent: result.intent })
    : null;

  if (leadResult?.becameHot && ownerEmail) {
    await notifyOwnerOfHotLead({
      agencyName: agency.name,
      ownerEmail,
      ownerWhatsAppNumber: null, // owner WhatsApp opt-in during onboarding isn't built yet - email-only for now
      ownerPhoneNumberId: null,
      accessToken: null,
      customerName: msg.contactName,
      customerPhone: msg.from,
      leadSummary: `Language: ${result.language as Language}`,
    });
  }
}
