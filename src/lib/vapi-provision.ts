// One-time provisioning calls to Vapi's API, creating a phone number for a
// new receptionist client. Separate from vapi.ts (the inbound call-time
// runtime): this file only runs once per client, at onboarding, not on
// every call.
//
// ponytail: field names below (numberDesiredAreaCode, the nested server
// object) are Vapi's documented shape as of this writing but weren't fully
// verifiable from their docs pages at build time, verify against
// https://docs.vapi.ai/api-reference/phone-numbers/create before relying on
// this against a real client, and read the returned error text on any
// failure rather than assuming success.

const VAPI_API_BASE = "https://api.vapi.ai";

function vapiApiKey(): string {
  const key = process.env.VAPI_API_KEY;
  if (!key) throw new Error("VAPI_API_KEY is not set");
  return key;
}

export type CreatePhoneNumberResult =
  | { ok: true; phoneNumberId: string; number: string }
  | { ok: false; error: string };

/** Normalizes a client-typed US number to the E.164 shape Vapi's
    fallbackDestination requires (e.g. "(213) 451-4165" -> "+12134514165").
    Assumes US/Canada (matches the rest of this file's US-only scope) -
    returns null if it doesn't look like a valid 10 or 11-digit number,
    since sending Vapi a malformed fallback is worse than sending none. */
export function toE164UsNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function createFreePhoneNumber(input: {
  areaCode: string;
  serverUrl: string;
  serverSecret: string;
  fallbackNumber?: string | null;
}): Promise<CreatePhoneNumberResult> {
  const fallbackDestination = input.fallbackNumber
    ? { type: "number" as const, number: input.fallbackNumber, numberE164CheckEnabled: true }
    : undefined;

  const res = await fetch(`${VAPI_API_BASE}/phone-number`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vapiApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider: "vapi",
      numberDesiredAreaCode: input.areaCode,
      server: {
        url: input.serverUrl,
        headers: { "x-vapi-secret": input.serverSecret },
      },
      ...(fallbackDestination ? { fallbackDestination } : {}),
    }),
  });

  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  const body = (await res.json()) as { id?: string; number?: string };
  if (!body.id || !body.number) return { ok: false, error: "phone number created but response was incomplete" };
  return { ok: true, phoneNumberId: body.id, number: body.number };
}

/** For a client who wants to keep their own number instead of getting a new
    one: imports a number they already host on Twilio into Vapi, same
    ponytail caveat as createFreePhoneNumber above - verify the "twilio"
    provider shape against
    https://docs.vapi.ai/api-reference/phone-numbers/create before relying
    on this against a real client. The client's Twilio credentials are only
    ever passed through this one call, never persisted by this app. */
export async function importTwilioPhoneNumber(input: {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  serverUrl: string;
  serverSecret: string;
  fallbackNumber?: string | null;
}): Promise<CreatePhoneNumberResult> {
  const fallbackDestination = input.fallbackNumber
    ? { type: "number" as const, number: input.fallbackNumber, numberE164CheckEnabled: true }
    : undefined;

  const res = await fetch(`${VAPI_API_BASE}/phone-number`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vapiApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider: "twilio",
      number: input.twilioPhoneNumber,
      twilioAccountSid: input.twilioAccountSid,
      twilioAuthToken: input.twilioAuthToken,
      server: {
        url: input.serverUrl,
        headers: { "x-vapi-secret": input.serverSecret },
      },
      ...(fallbackDestination ? { fallbackDestination } : {}),
    }),
  });

  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  const body = (await res.json()) as { id?: string; number?: string };
  if (!body.id || !body.number) return { ok: false, error: "phone number imported but response was incomplete" };
  return { ok: true, phoneNumberId: body.id, number: body.number };
}
