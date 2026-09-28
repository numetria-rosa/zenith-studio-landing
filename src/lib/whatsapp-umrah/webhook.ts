import { createHmac, timingSafeEqual } from "node:crypto";

/* Signature verification and inbound payload types - confirmed against
   developers.facebook.com/documentation/business-messaging/whatsapp/
   webhooks/create-webhook-endpoint (2026-09-28), not guessed. */

/** X-Hub-Signature-256: sha256=<hex HMAC-SHA256 of the raw POST body,
    keyed with the app secret>. Must run against the RAW body bytes, not
    a re-serialized JSON.parse(...).toString() - re-serialization can
    change byte-for-byte formatting (key order, whitespace) and silently
    break every signature. */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const given = signatureHeader.slice("sha256=".length);
  const expectedBuf = Buffer.from(expected, "hex");
  const givenBuf = Buffer.from(given, "hex");
  return expectedBuf.length === givenBuf.length && timingSafeEqual(expectedBuf, givenBuf);
}

export type InboundTextMessage = {
  phoneNumberId: string;
  from: string; // customer's WhatsApp number, no leading +
  waMessageId: string;
  timestamp: string;
  body: string;
  contactName: string | null;
};

/** Pulls every inbound TEXT message out of one webhook POST body. A
    single POST can carry several entries/changes (Meta batches), and
    non-text message types (image, document, status updates) are
    deliberately skipped - v1 only handles text, per the spec's MVP
    scope. Never throws on a malformed/unexpected shape - a shape this
    doesn't recognise just yields no messages, so the caller still
    responds 200 fast rather than 500ing on a Meta payload variant it
    hasn't seen. */
export function extractInboundTextMessages(payload: unknown): InboundTextMessage[] {
  const out: InboundTextMessage[] = [];
  const entries = (payload as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return out;

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> })?.value;
      if (!value || (change as { field?: string }).field !== "messages") continue;
      const phoneNumberId = (value.metadata as { phone_number_id?: string } | undefined)?.phone_number_id;
      const contacts = value.contacts as { profile?: { name?: string }; wa_id?: string }[] | undefined;
      const messages = value.messages as Record<string, unknown>[] | undefined;
      if (!phoneNumberId || !Array.isArray(messages)) continue;

      for (const msg of messages) {
        if (msg.type !== "text") continue;
        const body = (msg.text as { body?: string } | undefined)?.body;
        const from = msg.from as string | undefined;
        const id = msg.id as string | undefined;
        const timestamp = msg.timestamp as string | undefined;
        if (!body || !from || !id || !timestamp) continue;
        const contact = contacts?.find((c) => c.wa_id === from);
        out.push({ phoneNumberId, from, waMessageId: id, timestamp, body, contactName: contact?.profile?.name ?? null });
      }
    }
  }
  return out;
}
