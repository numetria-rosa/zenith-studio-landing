"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWhopClient } from "@/lib/whop";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { ingestDocument } from "@/lib/whatsapp-umrah/kb/ingest";
import { takeOverConversation, resumeAi } from "@/lib/whatsapp-umrah/handoff";
import { runAgentPipeline } from "@/lib/whatsapp-umrah/agent/pipeline";
import { decryptSecret } from "@/lib/secrets";
import { META_TOKEN_ENV } from "@/lib/whatsapp-umrah/inbound";
import { MetaCloudWhatsAppProvider } from "@/lib/whatsapp-umrah/provider/meta";
import { deleteContactData } from "@/lib/whatsapp-umrah/gdpr";
import type { BusinessHours } from "@/lib/whatsapp-umrah/hours";
import { Prisma } from "@prisma/client";
import { logWaAuditEvent } from "@/lib/whatsapp-umrah/audit";

const HOURS_DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** Reads the settings form's per-day checkbox+time-pair fields into the
    BusinessHours JSON shape hours.ts reads back (see its own header
    comment). No day checked at all -> null, so an agency that never
    touches this stays exactly "always open", same as before this
    feature existed. */
function parseBusinessHoursForm(formData: FormData): BusinessHours | null {
  const hours: BusinessHours = {};
  let anyOpen = false;
  for (const day of HOURS_DAY_KEYS) {
    if (formData.get(`hours_${day}_open`) === "on") {
      const open = String(formData.get(`hours_${day}_start`) || "09:00");
      const close = String(formData.get(`hours_${day}_end`) || "17:00");
      hours[day] = { open, close };
      anyOpen = true;
    }
  }
  return anyOpen ? hours : null;
}

const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

/* Server actions for the WhatsApp Umrah dashboard - same "re-scope
   ownership independently in every action, never trust the page already
   checked it" rule as service-workspace.ts, since a signed-in client
   could otherwise post a form with a different agencyId in the URL. */

async function requireOwnedAgency(agencyId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) throw new Error("not_found");
  return { userId: session.user.id, agency };
}

export async function addKbDocumentAction(agencyId: string, formData: FormData): Promise<void> {
  const { agency } = await requireOwnedAgency(agencyId);
  const title = String(formData.get("title") || "").trim();
  const rawText = String(formData.get("rawText") || "").trim();
  if (!title || !rawText) throw new Error("Title and content are required.");

  const doc = await db.waKbDocument.create({ data: { agencyId: agency.id, kind: "TEXT", title, rawText } });
  const result = await ingestDocument(doc.id);
  if (!result.ok) throw new Error(result.error);
  revalidatePath(`/whatsapp-umrah/${agencyId}`);
}

export async function deleteKbDocumentAction(agencyId: string, documentId: string): Promise<void> {
  const { agency } = await requireOwnedAgency(agencyId);
  await db.waKbDocument.deleteMany({ where: { id: documentId, agencyId: agency.id } }); // cascades chunks
  revalidatePath(`/whatsapp-umrah/${agencyId}`);
}

export async function takeOverConversationAction(agencyId: string, conversationId: string): Promise<void> {
  const { agency, userId } = await requireOwnedAgency(agencyId);
  const result = await takeOverConversation(agency.id, conversationId, userId);
  if (!result.ok) throw new Error(result.error);
  revalidatePath(`/whatsapp-umrah/${agencyId}/inbox`);
}

export async function resumeAiAction(agencyId: string, conversationId: string): Promise<void> {
  const { agency } = await requireOwnedAgency(agencyId);
  const result = await resumeAi(agency.id, conversationId);
  if (!result.ok) throw new Error(result.error);
  revalidatePath(`/whatsapp-umrah/${agencyId}/inbox`);
}

/** Sends the owner's typed reply for real, same MetaCloudWhatsAppProvider
    path as inbound.ts's AI replies, and the same 24h customer-service-
    window rule from CLAUDE.md §2 - a template is required outside that
    window, and since templates aren't built yet, this fails loudly with a
    clear error instead of silently storing a message the customer never
    receives. */
export async function sendHumanReplyAction(agencyId: string, conversationId: string, formData: FormData): Promise<void> {
  const { agency } = await requireOwnedAgency(agencyId);
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  const conversation = await db.waConversation.findFirst({
    where: { id: conversationId, agencyId: agency.id },
    select: { id: true, lastCustomerMessageAt: true, contact: { select: { phone: true } } },
  });
  if (!conversation) throw new Error("not_found");

  if (!conversation.lastCustomerMessageAt || Date.now() - conversation.lastCustomerMessageAt.getTime() > SERVICE_WINDOW_MS) {
    throw new Error(
      "It's been more than 24 hours since this customer last messaged. WhatsApp requires a template message outside that window, and templates aren't set up yet - ask the customer to message you again first."
    );
  }
  if (!agency.whatsapp?.phoneNumberId || agency.whatsapp.status !== "CONNECTED" || !agency.whatsapp.encryptedAccessToken) {
    throw new Error("Your WhatsApp number isn't connected yet.");
  }

  const accessToken = decryptSecret(agency.whatsapp.encryptedAccessToken, META_TOKEN_ENV);
  const provider = new MetaCloudWhatsAppProvider(accessToken);
  const sendResult = await provider.sendText({ phoneNumberId: agency.whatsapp.phoneNumberId, to: conversation.contact.phone, body });
  if (!sendResult.ok) throw new Error(sendResult.error || "Sending failed.");

  await db.waMessage.create({
    data: {
      conversationId: conversation.id,
      agencyId: agency.id,
      direction: "OUT",
      sender: "HUMAN",
      type: "TEXT",
      waMessageId: sendResult.waMessageId,
      body,
      metaBillable: true, // billable service-message send from 1 Oct 2026, see CLAUDE.md
    },
  });
  revalidatePath(`/whatsapp-umrah/${agencyId}/inbox`);
}

/** UK GDPR right to erasure (CLAUDE.md §7). Cascades to every conversation,
    message, handoff, lead and lead event for this contact - see
    deleteContactData's own comment. */
export async function deleteContactAction(agencyId: string, contactId: string): Promise<void> {
  const { agency } = await requireOwnedAgency(agencyId);
  const deleted = await deleteContactData(agency.id, contactId);
  if (!deleted) throw new Error("not_found");
  revalidatePath(`/whatsapp-umrah/${agencyId}/inbox`);
  redirect(`/whatsapp-umrah/${agencyId}/inbox`);
}

export async function updateLeadStatusAction(agencyId: string, leadId: string, formData: FormData): Promise<void> {
  const { agency } = await requireOwnedAgency(agencyId);
  const status = String(formData.get("status") || "");
  const lead = await db.waLead.findFirst({ where: { id: leadId, agencyId: agency.id }, select: { id: true } });
  if (!lead) throw new Error("not_found");
  await db.$transaction([
    db.waLead.update({ where: { id: lead.id }, data: { status: status as never } }),
    db.waLeadEvent.create({ data: { leadId: lead.id, type: "status_changed", detail: `manually set to ${status}` } }),
  ]);
  revalidatePath(`/whatsapp-umrah/${agencyId}/leads`);
}

export async function updateAgentSettingsAction(agencyId: string, formData: FormData): Promise<void> {
  const { agency } = await requireOwnedAgency(agencyId);
  const languages = formData.getAll("languages").map(String);
  const data = {
    agentName: String(formData.get("agentName") || "Assistant").trim() || "Assistant",
    tone: (formData.get("tone") === "FORMAL" ? "FORMAL" : "WARM") as "FORMAL" | "WARM",
    emojiEnabled: formData.get("emojiEnabled") === "on",
    signOff: String(formData.get("signOff") || "").trim() || null,
    languagesEnabled: languages.length > 0 ? languages : ["en"],
    awayMode: (formData.get("awayMode") === "AWAY_MESSAGE_ONLY" ? "AWAY_MESSAGE_ONLY" : "AI_REPLIES") as "AI_REPLIES" | "AWAY_MESSAGE_ONLY",
    awayMessage: String(formData.get("awayMessage") || "").trim() || null,
    businessHours: (parseBusinessHoursForm(formData) ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    autoResumeIdleMinutes: (() => {
      const raw = Number(formData.get("autoResumeIdleMinutes"));
      return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null;
    })(),
    // UK GDPR (CLAUDE.md §7): per-agency retention setting, default 12
    // months. Read by the monthly purge job, src/lib/whatsapp-umrah/gdpr.ts.
    retentionMonths: (() => {
      const raw = Number(formData.get("retentionMonths"));
      return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 12;
    })(),
  };
  await db.waAgentSettings.upsert({ where: { agencyId: agency.id }, create: { agencyId: agency.id, ...data }, update: data });
  revalidatePath(`/whatsapp-umrah/${agencyId}/settings`);
}

/** The £5/1,000-extra-replies add-on pack (see CLAUDE.md's overage add-on
    section) is off by default - "one-click enable" toggle, separate from
    the rest of updateAgentSettingsAction so it isn't accidentally flipped
    off by an unrelated settings save. */
export async function toggleOverageEnabledAction(agencyId: string, formData: FormData): Promise<void> {
  const { agency } = await requireOwnedAgency(agencyId);
  const enabled = formData.get("overageEnabled") === "on";
  await db.waAgentSettings.upsert({
    where: { agencyId: agency.id },
    create: { agencyId: agency.id, overageEnabled: enabled },
    update: { overageEnabled: enabled },
  });
  revalidatePath(`/whatsapp-umrah/${agencyId}/settings`);
}

/** Same "cancel at period end, let the membership.deactivated webhook
    actually pause things" shape as service-workspace.ts's
    cancelOwnedMembership - the webhook (see pauseWaAgencyByMembership in
    src/lib/whatsapp-umrah/whop-plans.ts) is the single place that flips
    agency.status, so a client closing the tab mid-request never leaves
    the agency paused without Whop agreeing the subscription actually ended. */
export async function cancelSubscriptionAction(agencyId: string): Promise<void> {
  const { agency } = await requireOwnedAgency(agencyId);
  const subscription = await db.waSubscription.findUnique({ where: { agencyId: agency.id }, select: { whopMembershipId: true } });
  if (!subscription?.whopMembershipId) throw new Error("No active subscription found to cancel.");
  await getWhopClient().memberships.cancel(subscription.whopMembershipId, { cancellation_mode: "at_period_end" });
  revalidatePath(`/whatsapp-umrah/${agencyId}/settings`);
}

/** Fallback path when Embedded Signup is off or its weekly cap is hit (see
    src/lib/whatsapp-umrah/embedded-signup.ts) - no email, this row IS the
    notification: the admin sees it in Zenith HQ's WhatsApp Umrah page and
    connects the number manually from there, same as every agency today. */
export async function requestManualConnectAction(agencyId: string, formData: FormData): Promise<void> {
  const { agency } = await requireOwnedAgency(agencyId);
  const businessName = String(formData.get("businessName") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim();
  const contactPhone = String(formData.get("contactPhone") || "").trim();
  if (!businessName || !contactEmail || !contactPhone) throw new Error("Business name, email and phone are required.");

  await db.waManualConnectRequest.create({
    data: {
      agencyId: agency.id,
      businessName,
      contactEmail,
      contactPhone,
      wabaId: String(formData.get("wabaId") || "").trim() || null,
      phoneNumberId: String(formData.get("phoneNumberId") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
    },
  });
  await logWaAuditEvent(agency.id, null, "manual_connect_requested", { businessName, contactEmail });
  revalidatePath(`/whatsapp-umrah/${agencyId}`);
}

export type SimulatorTurn = { role: "customer" | "ai"; text: string; language?: string; guardsTriggered?: string[] };

/** Simulator: calls the real pipeline against the real KB, with a real
    LLM call - the only thing "simulated" is that nothing ever touches
    WhatsApp. Per spec 3.4: simulator messages never count toward the
    reply cap or get metered/logged to WaPromptRun - a genuinely free,
    unlimited test surface. */
export async function simulateMessageAction(agencyId: string, customerMessage: string): Promise<{ text: string; language: string; guardsTriggered: string[]; action: "reply" | "handoff" }> {
  const { agency } = await requireOwnedAgency(agencyId);
  const result = await runAgentPipeline({ agencyId: agency.id, customerMessage });
  return {
    text: result.action === "reply" ? result.text : result.holdingMessage,
    language: result.language,
    guardsTriggered: result.guardsTriggered,
    action: result.action,
  };
}
