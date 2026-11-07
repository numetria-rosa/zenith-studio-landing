import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/secrets";
import { sendPlainEmail } from "@/lib/outreach-mail";
import { runAgentPipeline } from "./agent/pipeline";
import { leadSummaryLine, loadKnownLeadFields, mergeLeadFields, upsertLeadFromDraft, notifyOwnerOfHotLead } from "./leads";
import { BOOKING_READY_REASON } from "./agent/reasons";
import { MetaCloudWhatsAppProvider } from "./provider/meta";
import { withinCap, recordAiReply } from "./entitlements";
import { isWithinBusinessHours } from "./hours";
import { trackSend, noteSendFailure } from "./send-failure";
import { alertHandoff, alertWaitingCustomer } from "./handoff-alerts";
import { resumeIfIdle } from "./handoff";
import { containsSensitiveData, isOptInMessage, isOptOutMessage } from "./agent/pre-guards";
import { guessLanguage } from "./agent/language";
import { HOLDING_MESSAGES, OPT_IN_REPLIES, OPT_OUT_REPLIES, SENSITIVE_DATA_REPLIES, VOICE_NOTE_REPLIES } from "./agent/fixed-replies";
import type { WhatsAppProvider } from "./provider/types";
import type { EchoedStaffMessage, FailedDelivery, InboundMediaMessage, InboundTextMessage } from "./webhook";
import type { Language } from "./agent/types";

export const META_TOKEN_ENV = "META_ACCESS_TOKEN_ENCRYPTION_KEY";

// Every agency is UK-based today (see CLAUDE.md - UK-only launch). One
// timezone assumption, not a per-agency setting yet: add
// WaAgentSettings.timezone if/when agencies outside UK time are onboarded.
const DEFAULT_TIMEZONE = "Europe/London";
const DEFAULT_AWAY_MESSAGE = "Thanks for your message. We're outside our usual hours right now, but we'll reply as soon as we're back.";

type Delivery = { agencyId: string; conversationId: string; phoneNumberId: string; to: string; encryptedAccessToken: string | null; lastError: string | null };

/** Sends one text to the customer, stores it, meters it (every send is a message Meta bills the agency for, so
    all of them count toward the agency's limit) and reports a failed send. Returns whether it went out. */
async function deliver(d: Delivery, text: string, providerOverride?: WhatsAppProvider): Promise<boolean> {
  const accessToken = d.encryptedAccessToken ? decryptSecret(d.encryptedAccessToken, META_TOKEN_ENV) : null;
  const provider = providerOverride ?? (accessToken ? new MetaCloudWhatsAppProvider(accessToken) : null);
  if (!provider) return false;
  const sendResult = await provider.sendText({ phoneNumberId: d.phoneNumberId, to: d.to, body: text });
  await db.waMessage.create({
    data: {
      conversationId: d.conversationId,
      agencyId: d.agencyId,
      direction: "OUT",
      sender: "AI",
      type: "TEXT",
      waMessageId: sendResult.ok ? sendResult.waMessageId : null,
      body: text,
      metaBillable: sendResult.ok, // billable service-message send from 1 Oct 2026, see CLAUDE.md
    },
  });
  if (sendResult.ok) await recordAiReply(d.agencyId);
  await trackSend(d.agencyId, d.lastError, sendResult);
  return sendResult.ok;
}

/** Everything both text and media messages need before anything is said: dedupe, the connected number, the
    agency (LIVE only) and the contact. null means "nothing to do". */
async function resolveInbound(msg: { phoneNumberId: string; from: string; waMessageId: string; contactName: string | null }) {
  const existingMessage = await db.waMessage.findUnique({ where: { waMessageId: msg.waMessageId }, select: { id: true } });
  if (existingMessage) return null; // Meta retries failed/slow-acked webhooks for up to 7 days - dedupe, don't reprocess

  const account = await db.waWhatsAppAccount.findFirst({
    where: { phoneNumberId: msg.phoneNumberId, status: "CONNECTED" },
    select: { agencyId: true, encryptedAccessToken: true, lastError: true },
  });
  if (!account) return null; // number not connected to any agency (or disconnected) - nothing to route this to

  const agency = await db.waAgency.findUnique({
    where: { id: account.agencyId },
    select: {
      id: true,
      name: true,
      status: true,
      memberships: { where: { role: "OWNER" }, take: 1, select: { user: { select: { email: true } } } },
      agentSettings: { select: { businessHours: true, awayMode: true, awayMessage: true, autoResumeIdleMinutes: true } },
    },
  });
  if (!agency || agency.status !== "LIVE") return null; // onboarding/paused agencies don't get live replies yet

  const contact = await db.waContact.upsert({
    where: { agencyId_phone: { agencyId: agency.id, phone: msg.from } },
    update: msg.contactName ? { name: msg.contactName } : {},
    create: { agencyId: agency.id, phone: msg.from, name: msg.contactName },
    select: { id: true, optOut: true },
  });
  return { account, agency, contact, ownerEmail: agency.memberships[0]?.user.email };
}

async function openConversation(agencyId: string, contactId: string) {
  let conversation = await db.waConversation.findFirst({
    where: { agencyId, contactId, status: { not: "CLOSED" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true },
  });
  if (!conversation) {
    conversation = await db.waConversation.create({ data: { agencyId, contactId, status: "AI", entryPoint: "ORGANIC" }, select: { id: true, status: true } });
  }
  await db.waConversation.update({ where: { id: conversation.id }, data: { lastCustomerMessageAt: new Date() } });
  return conversation;
}

/** The agency's reply limit: when it's used up the agent goes quiet (messages are still saved) and the owner is told. */
async function underReplyLimit(agency: { id: string; name: string }, ownerEmail: string | undefined): Promise<boolean> {
  const cap = await withinCap(agency.id);
  if (cap.withinCap) return true;
  if (ownerEmail) {
    const why = cap.limit === "budget"
      ? "has used this month's AI allowance for your plan (it was working through longer conversations than a typical month)"
      : `has used its ${cap.cap} AI replies for this month${cap.cap < cap.planCap ? " (the limit you set)" : ""}`;
    await sendPlainEmail(ownerEmail, `${agency.name}: monthly AI limit reached`, `Your WhatsApp agent ${why}, so it's paused until the new month starts. ${cap.limit === "budget" ? "If you regularly need more, reply to this email and we'll look at your plan." : "You can change your limit in Settings."} New messages are still saved to your dashboard.`);
  }
  return false;
}

/** Hands the chat to a person and tells the team by email (customerMessage null = not plain text). */
async function handOff(agencyId: string, conversationId: string, reason: string, customerMessage: string | null, summary?: string): Promise<void> {
  await db.waConversation.update({ where: { id: conversationId }, data: { status: "HUMAN" } });
  await db.waHandoff.create({ data: { agencyId, conversationId, reason, triggeredBy: "AUTO" } });
  await alertHandoff({ agencyId, conversationId, reason, message: customerMessage, summary });
}

/** One inbound text message, start to finish: dedupe, opt-out, load
    everything, run the pipeline if the AI should speak, send, store,
    meter, capture the lead. Separate from the webhook route so it's
    testable with a MockWhatsAppProvider and doesn't depend on Next.js
    request/response types - the route is a thin wrapper over this. */
export async function processInboundMessage(msg: InboundTextMessage, providerOverride?: WhatsAppProvider): Promise<void> {
  const ctx = await resolveInbound(msg);
  if (!ctx) return;
  const { account, agency, contact, ownerEmail } = ctx;
  const language = guessLanguage(msg.body);

  // STOP is honoured for good: nothing more is sent to an opted-out contact until they send START.
  if (contact.optOut) {
    if (!isOptInMessage(msg.body)) return;
    await db.waContact.update({ where: { id: contact.id }, data: { optOut: false } });
    const reopened = await openConversation(agency.id, contact.id);
    await db.waMessage.create({ data: { conversationId: reopened.id, agencyId: agency.id, direction: "IN", sender: "CUSTOMER", type: "TEXT", waMessageId: msg.waMessageId, body: msg.body } });
    await deliver({ conversationId: reopened.id, phoneNumberId: msg.phoneNumberId, to: msg.from, ...account }, OPT_IN_REPLIES[language], providerOverride);
    return;
  }

  const conversation = await openConversation(agency.id, contact.id);
  await db.waMessage.create({
    data: { conversationId: conversation.id, agencyId: agency.id, direction: "IN", sender: "CUSTOMER", type: "TEXT", waMessageId: msg.waMessageId, body: msg.body },
  });
  const delivery: Delivery = { conversationId: conversation.id, phoneNumberId: msg.phoneNumberId, to: msg.from, ...account };

  if (isOptOutMessage(msg.body)) {
    await db.waContact.update({ where: { id: contact.id }, data: { optOut: true } });
    await deliver(delivery, OPT_OUT_REPLIES[language], providerOverride);
    await db.waConversation.update({ where: { id: conversation.id }, data: { status: "CLOSED" } });
    return;
  }

  if (conversation.status === "HUMAN") {
    // A person took over. If the agency set "let the AI take over again after N quiet minutes" and the team has
    // been quiet that long, the agent answers this message. Otherwise it stays silent, per spec, and the team
    // hears that the customer is waiting.
    if (await resumeIfIdle(agency.id, conversation.id, agency.agentSettings?.autoResumeIdleMinutes)) {
      conversation.status = "AI";
    } else {
      await alertWaitingCustomer({ agencyId: agency.id, conversationId: conversation.id, message: msg.body });
      return;
    }
  }

  if (!(await underReplyLimit(agency, ownerEmail))) return;

  const settings = agency.agentSettings;
  const outsideHours = !isWithinBusinessHours(settings?.businessHours ?? null, DEFAULT_TIMEZONE);
  if (outsideHours && settings?.awayMode === "AWAY_MESSAGE_ONLY") {
    await deliver(delivery, settings.awayMessage?.trim() || DEFAULT_AWAY_MESSAGE, providerOverride);
    return; // away-message-only mode never runs the pipeline - saves the LLM call entirely, not just skips a reply
  }

  const history = await db.waMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 12, // enough of the chat for "yes, the second one"; the lead record below carries the facts further back
    select: { sender: true, body: true },
  });
  const conversationHistory = history
    .reverse()
    .map((m) => {
      // A passport or card number a customer sent earlier stays out of every later model call.
      const text = m.sender === "CUSTOMER" && m.body && containsSensitiveData(m.body) ? "[details withheld for security]" : (m.body ?? "");
      return `${m.sender === "CUSTOMER" ? "Customer" : "AI"}: ${text}`;
    })
    .join("\n");

  // What this customer has already told us (dates, travellers, airport...), kept on the lead, so it survives past the
  // last 12 messages and the agent never asks for it twice.
  const knownFields = await loadKnownLeadFields(conversation.id);
  const result = await runAgentPipeline({ agencyId: agency.id, customerMessage: msg.body, conversationHistory, knownDetails: leadSummaryLine(knownFields), knownFields });

  if (result.promptRuns.length > 0) {
    await db.waPromptRun.createMany({
      data: result.promptRuns.map((run) => ({
        agencyId: agency.id,
        conversationId: conversation.id,
        stage: run.stage,
        model: run.model,
        promptVersion: run.promptVersion,
        inputTokens: run.inputTokens,
        outputTokens: run.outputTokens,
        latencyMs: run.latencyMs,
        costEstimateCents: run.costEstimateCents,
        guardsTriggered: run.guardsTriggered,
      })),
    });
  }

  const outboundText = result.action === "reply" ? result.text : result.holdingMessage;
  if (outboundText) await deliver(delivery, outboundText, providerOverride);
  const summary = leadSummaryLine(mergeLeadFields(knownFields, result.leadFields));
  if (result.action === "handoff") await handOff(agency.id, conversation.id, result.reason, msg.body, summary);
  // The customer committed to booking: the agent has just confirmed the package, total, deposit and next step, and
  // now the team takes the chat to collect documents and payment, with the details above ready for them.
  else if (result.readyToBook) await handOff(agency.id, conversation.id, BOOKING_READY_REASON, msg.body, summary);

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

/** A photo, document, video, voice note or shared location/contact. The content is never downloaded or kept
    (a photo may be a passport page): the message is logged by type only, the customer gets a fixed reply in
    the language of their last text message, and a person takes over. CLAUDE.md 3.1: "If a customer sends
    them anyway, the reply says the team will collect documents securely, and hands off." */
export async function processInboundMedia(msg: InboundMediaMessage, providerOverride?: WhatsAppProvider): Promise<void> {
  const ctx = await resolveInbound(msg);
  if (!ctx || ctx.contact.optOut) return;
  const { account, agency, contact, ownerEmail } = ctx;

  const conversation = await openConversation(agency.id, contact.id);
  await db.waMessage.create({
    data: { conversationId: conversation.id, agencyId: agency.id, direction: "IN", sender: "CUSTOMER", type: msg.type, waMessageId: msg.waMessageId, body: null },
  });
  if (conversation.status === "HUMAN") {
    await alertWaitingCustomer({ agencyId: agency.id, conversationId: conversation.id, message: null });
    return; // a person already has this chat
  }
  if (!(await underReplyLimit(agency, ownerEmail))) return;

  const lastText = await db.waMessage.findFirst({ where: { conversationId: conversation.id, direction: "IN", type: "TEXT" }, orderBy: { createdAt: "desc" }, select: { body: true } });
  const language = guessLanguage(lastText?.body ?? "");
  const replies = msg.reply === "security" ? SENSITIVE_DATA_REPLIES : msg.reply === "voice" ? VOICE_NOTE_REPLIES : HOLDING_MESSAGES;
  const reason = msg.reply === "security" ? "customer sent a photo, document or video" : msg.reply === "voice" ? "customer sent a voice note" : "customer shared a location or contact";

  await deliver({ conversationId: conversation.id, phoneNumberId: msg.phoneNumberId, to: msg.from, ...account }, replies[language], providerOverride);
  await handOff(agency.id, conversation.id, reason, null);
}

/** A staff member replied to a customer from the agency's own WhatsApp
    Business app (not our dashboard) - see webhook.ts's
    extractEchoedStaffMessages. Stores the message in the thread (Meta's
    own docs require digesting these into the conversation history) and
    auto-pauses the AI, same outcome as clicking "Take over" but without
    a userId, since Meta doesn't tell us which staff member sent it. */
export async function processEchoedStaffMessage(echo: EchoedStaffMessage): Promise<void> {
  const existing = await db.waMessage.findUnique({ where: { waMessageId: echo.waMessageId }, select: { id: true } });
  if (existing) return;

  const account = await db.waWhatsAppAccount.findFirst({ where: { phoneNumberId: echo.phoneNumberId, status: "CONNECTED" }, select: { agencyId: true } });
  if (!account) return;

  const contact = await db.waContact.findUnique({ where: { agencyId_phone: { agencyId: account.agencyId, phone: echo.to } }, select: { id: true } });
  if (!contact) return; // a staff-initiated message to someone with no existing conversation - nothing here to pause

  const conversation = await db.waConversation.findFirst({
    where: { agencyId: account.agencyId, contactId: contact.id, status: { not: "CLOSED" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true },
  });
  if (!conversation) return;

  await db.waMessage.create({
    data: { conversationId: conversation.id, agencyId: account.agencyId, direction: "OUT", sender: "HUMAN", type: "TEXT", waMessageId: echo.waMessageId, body: echo.body },
  });

  if (conversation.status === "AI") {
    await db.$transaction([
      db.waConversation.update({ where: { id: conversation.id }, data: { status: "HUMAN" } }),
      db.waHandoff.create({ data: { agencyId: account.agencyId, conversationId: conversation.id, reason: "staff replied via the WhatsApp Business app", triggeredBy: "AUTO" } }),
    ]);
  }
}

/** Meta reported one of our messages as failed after accepting it (see webhook.ts's extractFailedDeliveries):
    shows the reason on the agency's dashboard and tells the owner. */
export async function processFailedDelivery(failure: FailedDelivery): Promise<void> {
  const account = await db.waWhatsAppAccount.findFirst({ where: { phoneNumberId: failure.phoneNumberId, status: "CONNECTED" }, select: { agencyId: true } });
  if (!account) return;
  await noteSendFailure(account.agencyId, failure.error);
}
