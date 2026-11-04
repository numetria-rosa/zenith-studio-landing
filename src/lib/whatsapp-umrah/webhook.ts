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

export type EchoedStaffMessage = {
  phoneNumberId: string;
  to: string; // the customer's WhatsApp number this staff reply went to
  waMessageId: string;
  timestamp: string;
  body: string;
};

/** Pulls every TEXT message a staff member sent from the agency's own
    WhatsApp Business app (or a linked device) out of one webhook POST -
    the smb_message_echoes field, confirmed against developers.facebook.com/
    documentation/business-messaging/whatsapp/webhooks/reference/
    smb_message_echoes (2026-09-28). This is what lets the agent
    auto-pause when a human replies outside our own dashboard - see
    handoff.ts. Revoke/edit echo types and non-text types are skipped,
    same "text only" MVP scope as extractInboundTextMessages. */
export function extractEchoedStaffMessages(payload: unknown): EchoedStaffMessage[] {
  const out: EchoedStaffMessage[] = [];
  const entries = (payload as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return out;

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> })?.value;
      if (!value || (change as { field?: string }).field !== "smb_message_echoes") continue;
      const phoneNumberId = (value.metadata as { phone_number_id?: string } | undefined)?.phone_number_id;
      const echoes = value.message_echoes as Record<string, unknown>[] | undefined;
      if (!phoneNumberId || !Array.isArray(echoes)) continue;

      for (const echo of echoes) {
        if (echo.type !== "text") continue;
        const body = (echo.text as { body?: string } | undefined)?.body;
        const to = echo.to as string | undefined;
        const id = echo.id as string | undefined;
        const timestamp = echo.timestamp as string | undefined;
        if (!body || !to || !id || !timestamp) continue;
        out.push({ phoneNumberId, to, waMessageId: id, timestamp, body });
      }
    }
  }
  return out;
}

export type FailedDelivery = { phoneNumberId: string; to: string; waMessageId: string; error: string };

/** Delivery receipts Meta sends back for messages we sent, keeping only the failed ones. A send can be accepted
    by the API and still fail afterwards (no payment method, undeliverable), and this is the only place that
    shows up. Shape per developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/
    messages/status (statuses[].status "failed" with errors[]): not re-read for this change, so check it against
    a real failed send. Never throws on a shape it doesn't recognise. */
export function extractFailedDeliveries(payload: unknown): FailedDelivery[] {
  const out: FailedDelivery[] = [];
  const entries = (payload as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return out;
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> })?.value;
      if (!value || (change as { field?: string }).field !== "messages") continue;
      const phoneNumberId = (value.metadata as { phone_number_id?: string } | undefined)?.phone_number_id;
      const statuses = value.statuses as Record<string, unknown>[] | undefined;
      if (!phoneNumberId || !Array.isArray(statuses)) continue;
      for (const st of statuses) {
        if (st.status !== "failed") continue;
        const errors = st.errors as { code?: number; title?: string; message?: string }[] | undefined;
        const first = errors?.[0];
        out.push({
          phoneNumberId,
          to: String(st.recipient_id ?? ""),
          waMessageId: String(st.id ?? ""),
          error: first ? `${first.code ?? ""} ${first.title ?? first.message ?? "message failed"}`.trim() : "message failed",
        });
      }
    }
  }
  return out;
}

export type InboundMediaMessage = {
  phoneNumberId: string;
  from: string;
  waMessageId: string;
  timestamp: string;
  contactName: string | null;
  /** WaMessageType to store: the content itself is never downloaded or kept. */
  type: "IMAGE" | "DOCUMENT" | "AUDIO" | "OTHER";
  /** Which fixed reply fits: "security" for anything that could be an ID or document, "voice" for audio,
      "team" for anything else a person should look at (a location, a shared contact). */
  reply: "security" | "voice" | "team";
};

const MEDIA_KINDS: Record<string, Pick<InboundMediaMessage, "type" | "reply">> = {
  image: { type: "IMAGE", reply: "security" },
  document: { type: "DOCUMENT", reply: "security" },
  video: { type: "OTHER", reply: "security" },
  audio: { type: "AUDIO", reply: "voice" },
  location: { type: "OTHER", reply: "team" },
  contacts: { type: "OTHER", reply: "team" },
};

/** Inbound messages that aren't plain text: photos, documents, videos, voice notes, a shared location or
    contact. Reactions, stickers, button replies and system messages are skipped on purpose (nothing to answer).
    A photo may well be a passport page, so these never go near the model or storage: they are logged as a
    typed message with no body, and the customer gets a fixed reply and a handoff. Message types from memory of
    Meta's webhook reference (messages[].type), not re-read for this change: check against a real photo and voice note. */
export function extractInboundMediaMessages(payload: unknown): InboundMediaMessage[] {
  const out: InboundMediaMessage[] = [];
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
        const kind = typeof msg.type === "string" ? MEDIA_KINDS[msg.type] : undefined;
        const from = msg.from as string | undefined;
        const id = msg.id as string | undefined;
        const timestamp = msg.timestamp as string | undefined;
        if (!kind || !from || !id || !timestamp) continue;
        const contact = contacts?.find((c) => c.wa_id === from);
        out.push({ phoneNumberId, from, waMessageId: id, timestamp, contactName: contact?.profile?.name ?? null, ...kind });
      }
    }
  }
  return out;
}
