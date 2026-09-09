import twilio from "twilio";

/* AI Missed Call Text-Back runtime — the scaled-down, config-driven slice
   of the Law Firm AI Team's original "AI Coordinator" role. Deliberately
   NOT routed through Vapi's voice layer: a missed call has no conversation
   to bill AI minutes for, so a plain Twilio number handles it. The firm's
   existing number stays theirs — they set up forward-on-no-answer to the
   Twilio number this file's onboarding automation provisions per client
   (see Integration provider "twilio"). */

export type TextBackConfig = {
  businessName: string;
};

function isTextBackConfig(value: unknown): value is TextBackConfig {
  if (!value || typeof value !== "object") return false;
  return typeof (value as Record<string, unknown>).businessName === "string";
}

export { isTextBackConfig };

/** One message, used both spoken (TwiML) and texted — kept short enough to
    work as a voice announcement, warm enough to work as a text. */
export function buildMissedCallSpokenMessage(businessName: string): string {
  return `Thank you for calling ${businessName}. We're unable to take your call right now, but we'll text you shortly to find out how we can help, and get a call scheduled for tomorrow.`;
}

export function buildMissedCallSmsBody(businessName: string): string {
  return `Hi, this is ${businessName}. Sorry we missed your call. Reply and let us know what you need, we'll book a call for tomorrow so there's no delay.`;
}

function twilioAuthToken(): string {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) throw new Error("TWILIO_AUTH_TOKEN is not set");
  return token;
}

function twilioClient(): twilio.Twilio {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  if (!accountSid) throw new Error("TWILIO_ACCOUNT_SID is not set");
  return twilio(accountSid, twilioAuthToken());
}

/** Verifies Twilio's X-Twilio-Signature using the official SDK helper
    rather than hand-rolling HMAC — Twilio's own docs warn against
    reimplementing this. `url` must be the exact public URL Twilio called
    (the one configured on the phone number), not whatever host header a
    proxy in front of this app might report. */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;
  return twilio.validateRequest(twilioAuthToken(), signatureHeader, url, params);
}

export type PurchaseNumberResult =
  | { ok: true; phoneNumber: string; voiceUrl: string }
  | { ok: false; error: string };

/** Buys one US local Twilio number and points its Voice webhook at our
    missed-call route — the one-time onboarding step per law-firm client.
    Costs a real, small monthly fee (unlike the receptionist's free Vapi
    numbers), which is negligible against the $1,200/mo package price. */
export async function purchaseTwilioNumber(input: { areaCode: string; voiceUrl: string }): Promise<PurchaseNumberResult> {
  try {
    const client = twilioClient();
    const available = await client
      .availablePhoneNumbers("US")
      .local.list({ areaCode: Number(input.areaCode), limit: 1 });
    const candidate = available[0];
    if (!candidate) return { ok: false, error: `no numbers available for area code ${input.areaCode}` };

    const purchased = await client.incomingPhoneNumbers.create({
      phoneNumber: candidate.phoneNumber,
      voiceUrl: input.voiceUrl,
      voiceMethod: "POST",
    });
    return { ok: true, phoneNumber: purchased.phoneNumber, voiceUrl: input.voiceUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown Twilio error" };
  }
}

export type SendSmsResult = { ok: true; sid: string } | { ok: false; error: string };

export async function sendSms(input: { to: string; from: string; body: string }): Promise<SendSmsResult> {
  try {
    const message = await twilioClient().messages.create({ to: input.to, from: input.from, body: input.body });
    return { ok: true, sid: message.sid };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown Twilio error" };
  }
}
