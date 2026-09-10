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

export async function createFreePhoneNumber(input: {
  areaCode: string;
  serverUrl: string;
  serverSecret: string;
}): Promise<CreatePhoneNumberResult> {
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
    }),
  });

  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  const body = (await res.json()) as { id?: string; number?: string };
  if (!body.id || !body.number) return { ok: false, error: "phone number created but response was incomplete" };
  return { ok: true, phoneNumberId: body.id, number: body.number };
}
