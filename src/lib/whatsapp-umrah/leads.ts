import { db } from "@/lib/db";
import type { WaLeadStatus } from "@prisma/client";
import { sendPlainEmail } from "@/lib/outreach-mail";
import { MetaCloudWhatsAppProvider } from "./provider/meta";
import type { WhatsAppProvider } from "./provider/types";
import type { LeadFields, Intent } from "./agent/types";

/* Lead capture and the hot-lead rule - see spec section 3.2. Upserts the
   conversation's lead from whatever fields the agent's structured output
   captured this turn (fields accumulate across messages, never
   overwritten with null - a later turn that doesn't mention travellers
   shouldn't erase an earlier answer). */

/** "Hot" per spec 3.2's configurable default: dates + travellers + budget
    all captured, OR the customer directly asked to book/pay/speak to
    someone. Kept as a plain function (not agency-configurable yet) -
    WaAgentSettings.hotLeadRule exists in the schema for a future
    per-agency override, unused by this function until that UI exists. */
export function isHotLead(fields: LeadFields, intent: Intent): boolean {
  const hasCoreFields = Boolean(fields.travelDates && fields.travelers && fields.budgetGbp);
  const wantsToAct = intent === "booking_interest" || intent === "person_request";
  return hasCoreFields || wantsToAct;
}

function mergeLeadFields(existing: LeadFields, incoming: LeadFields | null): LeadFields {
  if (!incoming) return existing;
  return {
    travelDates: incoming.travelDates ?? existing.travelDates,
    travelers: incoming.travelers ?? existing.travelers,
    budgetGbp: incoming.budgetGbp ?? existing.budgetGbp,
    departureCity: incoming.departureCity ?? existing.departureCity,
    hotelTier: incoming.hotelTier ?? existing.hotelTier,
    packagePreference: incoming.packagePreference ?? existing.packagePreference,
  };
}

export type UpsertLeadResult = { lead: { id: string; status: string }; becameHot: boolean };

/** One lead per conversation (a customer asking about their trip across
    several messages is one lead, not one per message) - see WaLead's
    unique-enough-in-practice relation to WaConversation, though the
    schema doesn't enforce @@unique([conversationId]) since a closed
    conversation's lead can coexist with a later reopened one; this
    function itself enforces "reuse the latest lead for this
    conversation" as the intended behavior. */
export async function upsertLeadFromDraft(input: {
  agencyId: string;
  conversationId: string;
  contactId: string;
  leadFields: LeadFields | null;
  intent: Intent;
}): Promise<UpsertLeadResult | null> {
  if (!input.leadFields && input.intent !== "booking_interest" && input.intent !== "person_request") return null;

  const existing = await db.waLead.findFirst({
    where: { conversationId: input.conversationId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, travelDates: true, travelers: true, budgetGbp: true, departureCity: true, hotelTier: true, packagePreference: true },
  });

  const existingFields: LeadFields = existing
    ? {
        travelDates: existing.travelDates ?? undefined,
        travelers: existing.travelers ?? undefined,
        budgetGbp: existing.budgetGbp ?? undefined,
        departureCity: existing.departureCity ?? undefined,
        hotelTier: existing.hotelTier ?? undefined,
        packagePreference: existing.packagePreference ?? undefined,
      }
    : {};
  const merged = mergeLeadFields(existingFields, input.leadFields);
  const nowHot = isHotLead(merged, input.intent);
  const wasHot = existing?.status === "HOT";
  const nextStatus: WaLeadStatus = nowHot ? "HOT" : existing?.status === "HOT" ? "HOT" : merged.travelDates || merged.travelers || merged.budgetGbp ? "QUALIFIED" : "NEW";

  const data = {
    travelDates: merged.travelDates ?? null,
    travelers: merged.travelers ?? null,
    budgetGbp: merged.budgetGbp ?? null,
    departureCity: merged.departureCity ?? null,
    hotelTier: merged.hotelTier ?? null,
    packagePreference: merged.packagePreference ?? null,
    status: nextStatus,
  };

  const lead = existing
    ? await db.waLead.update({ where: { id: existing.id }, data, select: { id: true, status: true } })
    : await db.waLead.create({ data: { agencyId: input.agencyId, conversationId: input.conversationId, contactId: input.contactId, ...data }, select: { id: true, status: true } });

  await db.waLeadEvent.create({ data: { leadId: lead.id, type: "status_changed", detail: `status is now ${lead.status}` } });

  return { lead, becameHot: nowHot && !wasHot };
}

const HOT_LEAD_TEMPLATE_NAME = "hot_lead_alert"; // must exist as an approved template on the agency's WABA before this can send - see CLAUDE.md onboarding notes
const HOT_LEAD_TEMPLATE_LANGUAGE = "en_GB";

/** Both channels per spec 3.2: a WhatsApp template to the owner's own
    number (requires their opt-in during onboarding, and an approved
    template - fails soft, logged, if either isn't set up yet, since a
    missing template is expected during early onboarding) and email via
    Resend, which needs neither. */
export async function notifyOwnerOfHotLead(input: {
  agencyName: string;
  ownerEmail: string;
  ownerWhatsAppNumber: string | null;
  ownerPhoneNumberId: string | null;
  accessToken: string | null;
  customerName: string | null;
  customerPhone: string;
  leadSummary: string;
  provider?: WhatsAppProvider;
}): Promise<void> {
  await sendPlainEmail(
    input.ownerEmail,
    `Hot lead: ${input.customerName || input.customerPhone}`,
    `A new hot lead came in on WhatsApp for ${input.agencyName}.\n\nCustomer: ${input.customerName || "(no name given)"} - ${input.customerPhone}\n${input.leadSummary}\n\nOpen your dashboard to see the full conversation.`
  );

  if (!input.ownerWhatsAppNumber || !input.ownerPhoneNumberId || !input.accessToken) return;
  const provider = input.provider ?? new MetaCloudWhatsAppProvider(input.accessToken);
  await provider.sendTemplate({
    phoneNumberId: input.ownerPhoneNumberId,
    to: input.ownerWhatsAppNumber,
    templateName: HOT_LEAD_TEMPLATE_NAME,
    languageCode: HOT_LEAD_TEMPLATE_LANGUAGE,
    params: [input.customerName || input.customerPhone],
  });
}
