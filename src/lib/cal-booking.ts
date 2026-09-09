// Minimal Cal.com API v2 client for booking appointments server-side, under
// Zenith's own Cal.com account (same account already used for the paid
// audit — see paid-audit.ts). Each receptionist client gets their own Cal.com
// event type created once at onboarding; its id lives in
// Integration.config.calEventTypeId (not a secret, just a number), so no
// client ever needs their own Cal.com API key or OAuth connection.

const CAL_API_BASE = "https://api.cal.com/v2";

function calApiKey(): string {
  const key = process.env.CAL_API_KEY;
  if (!key) throw new Error("CAL_API_KEY is not set");
  return key;
}

export type CalSlot = { start: string };

/** Available start times for one event type within a date range (UTC ISO in, UTC ISO out). */
export async function getAvailableSlots(
  eventTypeId: number,
  fromISO: string,
  toISO: string
): Promise<CalSlot[]> {
  const url = new URL(`${CAL_API_BASE}/slots`);
  url.searchParams.set("eventTypeId", String(eventTypeId));
  url.searchParams.set("start", fromISO);
  url.searchParams.set("end", toISO);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${calApiKey()}`,
      "cal-api-version": "2024-09-04",
    },
  });
  if (!res.ok) throw new Error(`Cal.com slots lookup failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { data?: Record<string, Array<{ start: string }>> };
  const slotsByDay = body.data ?? {};
  return Object.values(slotsByDay)
    .flat()
    .map((s) => ({ start: s.start }));
}

export type CreateBookingInput = {
  eventTypeId: number;
  startISO: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeTimeZone: string;
};

export type CreateBookingResult =
  | { ok: true; bookingUid: string }
  | { ok: false; error: string };

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const res = await fetch(`${CAL_API_BASE}/bookings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${calApiKey()}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-08-13",
    },
    body: JSON.stringify({
      eventTypeId: input.eventTypeId,
      start: input.startISO,
      attendee: {
        name: input.attendeeName,
        email: input.attendeeEmail,
        timeZone: input.attendeeTimeZone,
      },
    }),
  });

  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  const body = (await res.json()) as { data?: { uid?: string } };
  const uid = body.data?.uid;
  if (!uid) return { ok: false, error: "booking created but no uid in response" };
  return { ok: true, bookingUid: uid };
}

export type CreateEventTypeResult =
  | { ok: true; eventTypeId: number }
  | { ok: false; error: string };

/** Creates one Cal.com event type under Zenith's own account for a new
    receptionist client — this is what onboarding provisions automatically
    so no admin ever clicks through the Cal.com dashboard per client. */
export async function createEventType(input: {
  title: string;
  slug: string;
  lengthMinutes: number;
}): Promise<CreateEventTypeResult> {
  const res = await fetch(`${CAL_API_BASE}/event-types`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${calApiKey()}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-06-14",
    },
    body: JSON.stringify({
      title: input.title,
      slug: input.slug,
      lengthInMinutes: input.lengthMinutes,
    }),
  });

  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  const body = (await res.json()) as { data?: { id?: number } };
  const id = body.data?.id;
  if (typeof id !== "number") return { ok: false, error: "event type created but no id in response" };
  return { ok: true, eventTypeId: id };
}
