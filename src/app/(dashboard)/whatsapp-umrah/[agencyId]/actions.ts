"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { ingestDocument } from "@/lib/whatsapp-umrah/kb/ingest";
import { takeOverConversation, resumeAi } from "@/lib/whatsapp-umrah/handoff";
import { runAgentPipeline } from "@/lib/whatsapp-umrah/agent/pipeline";

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

export async function sendHumanReplyAction(agencyId: string, conversationId: string, formData: FormData): Promise<void> {
  const { agency } = await requireOwnedAgency(agencyId);
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  const conversation = await db.waConversation.findFirst({ where: { id: conversationId, agencyId: agency.id }, select: { id: true } });
  if (!conversation) throw new Error("not_found");
  await db.waMessage.create({ data: { conversationId: conversation.id, agencyId: agency.id, direction: "OUT", sender: "HUMAN", type: "TEXT", body } });
  // Sending here doesn't call the real WhatsApp provider yet - that needs
  // the conversation's contact number + the agency's decrypted access
  // token wired the same way inbound.ts does it. Recorded in the thread
  // either way so the dashboard reflects what was said; real delivery is
  // the next piece once a real WABA exists to test against.
  revalidatePath(`/whatsapp-umrah/${agencyId}/inbox`);
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
    autoResumeIdleMinutes: (() => {
      const raw = Number(formData.get("autoResumeIdleMinutes"));
      return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null;
    })(),
  };
  await db.waAgentSettings.upsert({ where: { agencyId: agency.id }, create: { agencyId: agency.id, ...data }, update: data });
  revalidatePath(`/whatsapp-umrah/${agencyId}/settings`);
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
