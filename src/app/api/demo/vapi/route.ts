import type { NextRequest } from "next/server";
import { sendAdminAlert } from "@/lib/outreach-mail";
import { getAvailableSlots, createBooking } from "@/lib/cal-booking";
import { getDemoCalEventTypeId } from "@/lib/demo-config";

/* Server URL for the /demo web-call assistant only, see
   buildDemoAssistantPayload in lib/vapi.ts. This config is sent to the
   browser for the Vapi Web SDK to use directly, so unlike
   /api/webhooks/vapi it CANNOT require a shared secret (nowhere safe to
   hide one in a browser-visible payload). Books a REAL appointment on the
   shared demo Cal.com event type (see demo-config.ts), on purpose, a
   prospect needs to actually see their booking land on a real calendar to
   believe the receptionist works, a canned "nothing was really booked"
   response defeats the whole point of the demo.
   ponytail: no rate limiting, fine while traffic is a handful of demo
   calls, the worst case is a handful of junk demo bookings on our own
   demo calendar, not a security issue; add limiting if that changes. */

type VapiToolCall = { id: string; function: { name: string; arguments: unknown } };
type VapiMessage = {
  type: string;
  call?: { metadata?: { prospectId?: string } };
  toolCallList?: VapiToolCall[];
  toolCalls?: VapiToolCall[];
};

function parseArguments(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

type BookArgs = { name: string; email: string; preferredStartISO: string; timeZone: string };

function isBookArgs(value: unknown): value is BookArgs {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.email === "string" &&
    typeof v.preferredStartISO === "string" &&
    typeof v.timeZone === "string"
  );
}

async function bookDemoAppointment(rawArgs: unknown): Promise<string> {
  if (!isBookArgs(rawArgs)) return "I didn't get complete booking details, could you repeat those?";

  const eventTypeId = await getDemoCalEventTypeId();
  if (!eventTypeId) return "Booking isn't set up for the demo right now, please try again shortly.";

  const requested = new Date(rawArgs.preferredStartISO);
  if (Number.isNaN(requested.getTime())) return "That date and time didn't parse, could you say it again?";

  const dayStart = new Date(requested);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const slots = await getAvailableSlots(eventTypeId, dayStart.toISOString(), dayEnd.toISOString());
  const exact = slots.find((s) => s.start === requested.toISOString());
  const chosen = exact ?? slots.find((s) => new Date(s.start) >= requested) ?? slots[0];
  if (!chosen) return "There's nothing open that day on the demo calendar, want to try another day?";

  const result = await createBooking({
    eventTypeId,
    startISO: chosen.start,
    attendeeName: rawArgs.name,
    attendeeEmail: rawArgs.email,
    attendeeTimeZone: rawArgs.timeZone,
  });
  if (!result.ok) return "Something went wrong booking that, mind trying again?";

  const when = exact ? "at that exact time" : "at the closest available time to what you asked for";
  return `Booked ${when}. Check the live bookings list on this page, you should see it appear.`;
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: { message?: VapiMessage };
  try {
    body = (await request.json()) as { message?: VapiMessage };
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const message = body.message;
  if (!message || typeof message.type !== "string") {
    return new Response("missing message.type", { status: 400 });
  }

  if (message.type === "tool-calls") {
    const toolCalls = message.toolCallList ?? message.toolCalls ?? [];
    const results = await Promise.all(
      toolCalls.map(async (call) => ({
        toolCallId: call.id,
        result:
          call.function.name === "book_appointment"
            ? await bookDemoAppointment(parseArguments(call.function.arguments))
            : "Unknown tool.",
      }))
    );
    return Response.json({ results });
  }

  if (message.type === "end-of-call-report") {
    const prospectId = message.call?.metadata?.prospectId;
    await sendAdminAlert(
      "Someone tried the AI receptionist demo",
      prospectId ? `Prospect ${prospectId} just finished a demo call.` : "A demo call just finished (no prospect id)."
    );
    return new Response("OK", { status: 200 });
  }

  return new Response("OK", { status: 200 });
}
