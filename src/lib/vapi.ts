import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { getAvailableSlots, createBooking } from "@/lib/cal-booking";

/* AI Receptionist & Booking runtime engine.
   One Vapi assistant "template" for every client — behavior comes entirely
   from the client's Integration row (provider "vapi", externalRef = the
   Vapi phone number id they were assigned, config = their business data).
   Vapi hits a single server URL for every event during a call
   (assistant-request, tool-calls, end-of-call-report); see route.ts. */

export type ReceptionistConfig = {
  businessName: string;
  faqText: string;
  hours: string;
  escalationEmail?: string;
  calEventTypeId: number;
};

function isReceptionistConfig(value: unknown): value is ReceptionistConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.businessName === "string" &&
    typeof v.faqText === "string" &&
    typeof v.hours === "string" &&
    typeof v.calEventTypeId === "number"
  );
}

export function verifyVapiSecret(headerValue: string | null): boolean {
  const expected = process.env.VAPI_SERVER_SECRET;
  if (!expected || !headerValue) return false;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(headerValue, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** The one master prompt template — never edited per client. Every client's
    voice is entirely a function of the config values interpolated in. */
export function buildSystemPrompt(config: ReceptionistConfig): string {
  return [
    `You are the AI receptionist for ${config.businessName}.`,
    `Business hours: ${config.hours}.`,
    `Answer caller questions using only this information about the business:`,
    config.faqText,
    `If a caller wants to book an appointment, use the book_appointment tool — ask for their name, email, and a preferred date/time first.`,
    `If a question is outside what you were given, or the caller is upset or asks for a human, say a team member will follow up and end the call politely — do not guess.`,
  ].join("\n\n");
}

export function buildAssistantPayload(projectId: string, config: ReceptionistConfig) {
  return {
    name: `Receptionist — ${config.businessName}`,
    firstMessage: `Thanks for calling ${config.businessName}, how can I help?`,
    model: {
      provider: "openai",
      model: "gpt-4o",
      systemPrompt: buildSystemPrompt(config),
      tools: [
        {
          type: "function",
          function: {
            name: "book_appointment",
            description: "Book an appointment on the business's calendar.",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                preferredStartISO: { type: "string", description: "Requested start time, ISO 8601, UTC" },
                timeZone: { type: "string" },
              },
              required: ["name", "email", "preferredStartISO", "timeZone"],
            },
          },
        },
      ],
    },
    metadata: { projectId },
  };
}

type ReceptionistIntegration = { projectId: string; config: ReceptionistConfig };

/** Looks up which client this dialed-in number belongs to. Returns null for
    an unknown/unconfigured number — the caller must decide how to fail. */
export async function lookupReceptionistByPhoneNumberId(
  phoneNumberId: string
): Promise<ReceptionistIntegration | null> {
  const integration = await db.integration.findFirst({
    where: { provider: "vapi", externalRef: phoneNumberId },
    select: { projectId: true, config: true },
  });
  if (!integration || !isReceptionistConfig(integration.config)) return null;
  return { projectId: integration.projectId, config: integration.config };
}

export type BookAppointmentArgs = {
  name: string;
  email: string;
  preferredStartISO: string;
  timeZone: string;
};

function isBookAppointmentArgs(value: unknown): value is BookAppointmentArgs {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.email === "string" &&
    typeof v.preferredStartISO === "string" &&
    typeof v.timeZone === "string"
  );
}

/** Runs the book_appointment tool for one call. Falls back to the nearest
    available slot on the same day if the exact requested time is taken. */
export async function runBookAppointment(
  projectId: string,
  rawArgs: unknown
): Promise<{ ok: boolean; message: string }> {
  if (!isBookAppointmentArgs(rawArgs)) {
    return { ok: false, message: "I didn't get complete booking details — could you repeat those?" };
  }

  const integration = await db.integration.findFirst({
    where: { projectId, provider: "vapi" },
    select: { config: true },
  });
  if (!integration || !isReceptionistConfig(integration.config)) {
    return { ok: false, message: "Booking isn't set up for this business yet." };
  }
  const { calEventTypeId } = integration.config;

  const requested = new Date(rawArgs.preferredStartISO);
  if (Number.isNaN(requested.getTime())) {
    return { ok: false, message: "That date and time didn't parse — could you say it again?" };
  }

  const dayStart = new Date(requested);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const slots = await getAvailableSlots(calEventTypeId, dayStart.toISOString(), dayEnd.toISOString());
  const exact = slots.find((s) => s.start === requested.toISOString());
  const chosen = exact ?? slots.find((s) => new Date(s.start) >= requested) ?? slots[0];

  if (!chosen) {
    return { ok: false, message: "There's nothing open that day — want to try another day?" };
  }

  const result = await createBooking({
    eventTypeId: calEventTypeId,
    startISO: chosen.start,
    attendeeName: rawArgs.name,
    attendeeEmail: rawArgs.email,
    attendeeTimeZone: rawArgs.timeZone,
  });

  if (!result.ok) {
    return { ok: false, message: "Something went wrong booking that — a team member will follow up to confirm." };
  }

  await recordBookingMetric(projectId);

  const when = exact ? "at that exact time" : "at the closest available time to what you asked for";
  return { ok: true, message: `Booked ${when}. A confirmation is on its way to ${rawArgs.email}.` };
}

/** Written the moment a booking succeeds mid-call (runBookAppointment), not
    at end-of-call, so it doesn't depend on carrying state between webhook
    requests for the same call. */
export async function recordBookingMetric(projectId: string): Promise<void> {
  await db.serviceMetric.create({ data: { projectId, key: "calls_booked", value: 1 } });
}

export async function recordCallEndMetrics(
  projectId: string,
  durationSeconds: number,
  escalated: boolean
): Promise<void> {
  await db.serviceMetric.createMany({
    data: [
      { projectId, key: "calls_received", value: 1 },
      { projectId, key: "call_duration_seconds", value: durationSeconds },
      ...(escalated ? [{ projectId, key: "calls_escalated", value: 1 }] : []),
    ],
  });
}
