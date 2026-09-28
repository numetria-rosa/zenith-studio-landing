import { retrieveKbChunks, type RetrievedChunk } from "../kb/retrieve";
import { containsSensitiveData, isOptOutMessage } from "./pre-guards";
import { draftReply } from "./draft";
import { escalateDraft } from "./escalate";
import { runGuards } from "./guards";
import type { AgentDraft, GuardFailure, Language, PipelineResult } from "./types";

/* Orchestrates one inbound message: pre-guards -> retrieval -> Groq draft
   -> post-guards -> Claude escalation on failure -> handoff if still
   failing. See CLAUDE.md and the spec's pipeline section. Callers (the
   webhook, the simulator) own everything DB-specific - conversation
   history lookup, usage metering, sending the result, logging
   WaPromptRun - this module is pure orchestration over already-fetched
   inputs, so the simulator can call it with zero WhatsApp involvement. */

const HOLDING_MESSAGES: Record<Language, string> = {
  en: "Thanks for your message. Someone from our team will get back to you shortly.",
  ar: "شكرًا لرسالتك. سيتواصل معك أحد أفراد فريقنا قريبًا.",
  tr: "Mesajınız için teşekkürler. Ekibimizden biri kısa süre içinde size dönecek.",
  ur: "آپ کے پیغام کا شکریہ۔ ہماری ٹیم کا کوئی رکن جلد آپ سے رابطہ کرے گا۔",
};

const SENSITIVE_DATA_REPLIES: Record<Language, string> = {
  en: "For your security, please don't send documents or card details here. Our team will collect anything needed securely.",
  ar: "لأمانك، يرجى عدم إرسال المستندات أو تفاصيل البطاقة هنا. سيقوم فريقنا بجمع أي شيء مطلوب بشكل آمن.",
  tr: "Güvenliğiniz için lütfen buraya belge veya kart bilgisi göndermeyin. Ekibimiz gerekenleri güvenli şekilde toplayacaktır.",
  ur: "آپ کی حفاظت کے لیے، براہ کرم دستاویزات یا کارڈ کی تفصیلات یہاں نہ بھیجیں۔ ہماری ٹیم محفوظ طریقے سے ضرورت کی چیزیں جمع کرے گی۔",
};

function formatKbContext(chunks: RetrievedChunk[]): string {
  return chunks.map((c) => `[${c.id}] ${c.content}`).join("\n\n");
}

export type PipelineInput = {
  agencyId: string;
  customerMessage: string;
  conversationHistory?: string; // caller-formatted, e.g. "Customer: ...\nAI: ..."
  detectedLanguage?: Language; // fallback if a guard fires before the model reports one
};

export async function runAgentPipeline(input: PipelineInput): Promise<PipelineResult> {
  const fallbackLanguage: Language = input.detectedLanguage ?? "en";

  // Pre-guards: cheap, no LLM.
  if (isOptOutMessage(input.customerMessage)) {
    return { action: "handoff", reason: "customer opted out", holdingMessage: "", language: fallbackLanguage, guardsTriggered: ["opt_out"] };
  }
  if (containsSensitiveData(input.customerMessage)) {
    return {
      action: "reply",
      text: SENSITIVE_DATA_REPLIES[fallbackLanguage],
      language: fallbackLanguage,
      leadFields: null,
      model: "pre-guard",
      guardsTriggered: ["sensitive_data"],
    };
  }

  const retrieval = await retrieveKbChunks(input.agencyId, input.customerMessage);
  const kbContext = retrieval.ok ? formatKbContext(retrieval.chunks) : "";
  const draftInput = { customerMessage: input.customerMessage, kbContext, conversationHistory: input.conversationHistory ?? "" };

  const first = await draftReply(draftInput);
  if (!first.ok) {
    return handoffResult("draft failed: " + first.error, fallbackLanguage, ["draft_error"]);
  }
  const firstFailures = runGuards(first.draft, kbContext);
  if (firstFailures.length === 0) {
    return replyResult(first.draft, "groq:" + (process.env.GROQ_MODEL || "openai/gpt-oss-20b"), []);
  }

  const escalated = await escalateDraft(draftInput, firstFailures);
  if (!escalated.ok) {
    return handoffResult("escalation failed: " + escalated.error, first.draft.language, guardNames(firstFailures));
  }
  const secondFailures = runGuards(escalated.draft, kbContext);
  if (secondFailures.length === 0) {
    return replyResult(escalated.draft, "claude:" + (process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001"), guardNames(firstFailures));
  }

  return handoffResult(
    escalated.draft.handoffReason || secondFailures.map((f) => f.detail).join("; "),
    escalated.draft.language,
    [...guardNames(firstFailures), ...guardNames(secondFailures)]
  );
}

function guardNames(failures: GuardFailure[]): string[] {
  return failures.map((f) => f.guard);
}

function replyResult(draft: AgentDraft, model: string, guardsTriggered: string[]): PipelineResult {
  return { action: "reply", text: draft.reply, language: draft.language, leadFields: draft.leadFields, model, guardsTriggered };
}

function handoffResult(reason: string, language: Language, guardsTriggered: string[]): PipelineResult {
  return { action: "handoff", reason, holdingMessage: HOLDING_MESSAGES[language], language, guardsTriggered };
}
