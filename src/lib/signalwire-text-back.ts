import { RestClient } from "@signalwire/compatibility-api";

/* AI Missed Call Text-Back runtime — the scaled-down, config-driven slice
   of the Law Firm AI Team's original "AI Coordinator" role. Deliberately
   NOT routed through Vapi's voice layer: a missed call has no conversation
   to bill AI minutes for, so a plain phone number handles it. The firm's
   existing number stays theirs — they set up forward-on-no-answer to the
   number this file's onboarding automation provisions per client (see
   Integration provider "signalwire").

   Runs on SignalWire, not Twilio — switched 2026-09-10 after Twilio's
   account-signup 2FA got stuck rate-limiting. SignalWire's Compatibility
   API is a documented drop-in for Twilio's REST API/TwiML (same method
   names, same webhook payload field names), so this is a near-identical
   port; only the client constructor, signature verification (a separate
   signing key, not the API token), and the webhook signature header name
   actually differ. */

export type TextBackConfig = {
  businessName: string;
};

function isTextBackConfig(value: unknown): value is TextBackConfig {
  if (!value || typeof value !== "object") return false;
  return typeof (value as Record<string, unknown>).businessName === "string";
}

export { isTextBackConfig };

/** One message, used both spoken (cXML) and texted — kept short enough to
    work as a voice announcement, warm enough to work as a text. */
export function buildMissedCallSpokenMessage(businessName: string): string {
  return `Thank you for calling ${businessName}. We're unable to take your call right now, but we'll text you shortly to find out how we can help, and get a call scheduled for tomorrow.`;
}

export function buildMissedCallSmsBody(businessName: string): string {
  return `Hi, this is ${businessName}. Sorry we missed your call. Reply and let us know what you need, we'll book a call for tomorrow so there's no delay.`;
}

function signalwireSpaceUrl(): string {
  const url = process.env.SIGNALWIRE_SPACE_URL;
  if (!url) throw new Error("SIGNALWIRE_SPACE_URL is not set");
  return url;
}

function signalwireClient() {
  const projectId = process.env.SIGNALWIRE_PROJECT_ID;
  const apiToken = process.env.SIGNALWIRE_API_TOKEN;
  if (!projectId) throw new Error("SIGNALWIRE_PROJECT_ID is not set");
  if (!apiToken) throw new Error("SIGNALWIRE_API_TOKEN is not set");
  return RestClient(projectId, apiToken, { signalwireSpaceUrl: signalwireSpaceUrl() });
}

/** Verifies SignalWire's X-SignalWire-Signature using the official SDK
    helper rather than hand-rolling HMAC. Unlike Twilio, this uses a
    separate "signing key" from the credentials page, not the API token.
    `url` must be the exact public URL SignalWire called (the one
    configured on the phone number). */
export function verifySignalwireSignature(
  url: string,
  params: Record<string, string>,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;
  const signingKey = process.env.SIGNALWIRE_SIGNING_KEY;
  if (!signingKey) throw new Error("SIGNALWIRE_SIGNING_KEY is not set");
  return RestClient.validateRequest(signingKey, signatureHeader, url, params);
}

export type PurchaseNumberResult =
  | { ok: true; phoneNumber: string }
  | { ok: false; error: string };

/** Buys one US local number and points its Voice and SMS webhooks at our
    routes — the one-time onboarding step per law-firm client. The same
    number serves both roles that share it: Missed Call Text-Back (voice)
    and the Follow-Up Clerk's reply detection (sms). Costs a real, small
    monthly fee (unlike the receptionist's free Vapi numbers), negligible
    against the $1,200/mo package price.
    ponytail: availablePhoneNumbers/incomingPhoneNumbers method shapes are
    SignalWire's documented Twilio-compatible surface, not independently
    verified against a live account — read the real error text on first
    failure rather than assuming success. */
export async function purchaseSignalwireNumber(input: {
  areaCode: string;
  voiceUrl: string;
  smsUrl: string;
}): Promise<PurchaseNumberResult> {
  try {
    const client = signalwireClient();
    const available = await client
      .availablePhoneNumbers("US")
      .local.list({ areaCode: Number(input.areaCode), limit: 1 });
    const candidate = available[0];
    if (!candidate) return { ok: false, error: `no numbers available for area code ${input.areaCode}` };

    const purchased = await client.incomingPhoneNumbers.create({
      phoneNumber: candidate.phoneNumber,
      voiceUrl: input.voiceUrl,
      voiceMethod: "POST",
      smsUrl: input.smsUrl,
      smsMethod: "POST",
    });
    return { ok: true, phoneNumber: purchased.phoneNumber };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown SignalWire error" };
  }
}

export type SendSmsResult = { ok: true; sid: string } | { ok: false; error: string };

export async function sendSms(input: { to: string; from: string; body: string }): Promise<SendSmsResult> {
  try {
    const message = await signalwireClient().messages.create({ to: input.to, from: input.from, body: input.body });
    return { ok: true, sid: message.sid };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown SignalWire error" };
  }
}
