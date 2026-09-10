import { db } from "@/lib/db";
import { groqChatCompletion } from "@/lib/groq";
import { sendSms } from "@/lib/signalwire-text-back";
import { sendPlainEmail } from "@/lib/outreach-mail";
import { recordUsageCost, ESTIMATED_COST_CENTS } from "@/lib/usage-costs";

/* AI Lead Capture & Follow-Up runtime. Reuses the same Lead model and the
   same day-1/3/7 SMS sequence engine (follow-up-clerk.ts's processFollowUps
   already queries every Lead regardless of which service its project
   belongs to), this file only adds the capture + qualify + instant-reply
   step that's unique to this service. Also reuses the same "signalwire"
   Integration/number infrastructure as Missed Call Text-Back, just with a
   different config shape (see LeadCaptureConfig vs TextBackConfig). */

export type LeadCaptureConfig = {
  businessName: string;
  qualificationRules: string;
  notifyEmail: string;
};

export function isLeadCaptureConfig(value: unknown): value is LeadCaptureConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.businessName === "string" &&
    typeof v.qualificationRules === "string" &&
    typeof v.notifyEmail === "string"
  );
}

const QUALIFY_SYSTEM_PROMPT = `You screen incoming enquiries against a business's own stated rules. Respond ONLY with JSON: {"qualified": boolean, "reason": string}. "reason" is one short sentence explaining the call. This is visibility for the business, not an auto-reject, when in doubt, qualify it.`;

async function qualifyLead(rules: string, input: CaptureInput): Promise<{ qualified: boolean; reason: string }> {
  const userPrompt = `Business's qualification rules: ${rules}\n\nEnquiry:\nName: ${input.name ?? "(not given)"}\nEmail: ${input.email ?? "(not given)"}\nPhone: ${input.phone ?? "(not given)"}\nMessage: ${input.message ?? "(not given)"}`;
  const result = await groqChatCompletion({ systemPrompt: QUALIFY_SYSTEM_PROMPT, userPrompt, jsonMode: true });
  if (!result.ok) return { qualified: true, reason: "Qualification check unavailable, review manually." };
  try {
    const parsed = JSON.parse(result.content) as Partial<{ qualified: boolean; reason: string }>;
    return {
      qualified: typeof parsed.qualified === "boolean" ? parsed.qualified : true,
      reason: typeof parsed.reason === "string" && parsed.reason.trim() ? parsed.reason.trim() : "No reason given.",
    };
  } catch {
    return { qualified: true, reason: "Qualification check unavailable, review manually." };
  }
}

export type CaptureInput = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
};

export type CaptureResult = { ok: true; leadId: string } | { ok: false; error: string };

export async function captureLead(projectId: string, input: CaptureInput): Promise<CaptureResult> {
  if (!input.email && !input.phone) return { ok: false, error: "an email or phone number is required" };

  const integration = await db.integration.findFirst({
    where: { projectId, provider: "signalwire" },
    select: { externalRef: true, config: true },
  });
  if (!integration || !isLeadCaptureConfig(integration.config)) {
    return { ok: false, error: "lead capture is not set up for this business yet" };
  }
  const { businessName, qualificationRules, notifyEmail } = integration.config;

  const qualification = await qualifyLead(qualificationRules, input);
  await recordUsageCost(projectId, ESTIMATED_COST_CENTS.GROQ_CALL, "lead capture qualification");

  const lead = await db.lead.create({
    data: {
      projectId,
      name: input.name?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      message: input.message?.trim() || null,
      source: "web-form",
      qualified: qualification.qualified,
      qualificationNote: qualification.reason,
    },
  });

  // Every enquiry gets an immediate reply, the follow-up sequence
  // (processFollowUps, day 1/3/7) picks up automatically from here if they
  // don't respond or book.
  if (input.phone && integration.externalRef) {
    await sendSms({
      to: input.phone,
      from: integration.externalRef,
      body: `Thanks for reaching out to ${businessName}! We received your message and will be in touch shortly.`,
    });
    await recordUsageCost(projectId, ESTIMATED_COST_CENTS.SIGNALWIRE_SMS, "lead capture confirmation sms");
  } else if (input.email) {
    await sendPlainEmail(
      input.email,
      `Thanks for reaching out to ${businessName}`,
      `Hi${input.name ? ` ${input.name}` : ""},\n\nWe received your message and will be in touch shortly.\n\n${businessName}`
    );
  }

  await sendPlainEmail(
    notifyEmail,
    `New enquiry from ${input.name || input.email || input.phone}`,
    `${qualification.qualified ? "Qualified" : "Not qualified"}: ${qualification.reason}\n\nName: ${input.name ?? "-"}\nEmail: ${input.email ?? "-"}\nPhone: ${input.phone ?? "-"}\nMessage: ${input.message ?? "-"}`
  );

  return { ok: true, leadId: lead.id };
}
