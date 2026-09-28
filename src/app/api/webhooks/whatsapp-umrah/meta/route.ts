import type { NextRequest } from "next/server";
import { verifyMetaSignature, extractInboundTextMessages, extractEchoedStaffMessages } from "@/lib/whatsapp-umrah/webhook";
import { processInboundMessage, processEchoedStaffMessage } from "@/lib/whatsapp-umrah/inbound";

/* Meta's WhatsApp Cloud API webhook - verification handshake (GET) and
   inbound events (POST). Shapes confirmed against developers.facebook.com/
   documentation/business-messaging/whatsapp/webhooks/create-webhook-
   endpoint (2026-09-28), see CLAUDE.md.

   Processes inline before responding rather than a queue/waitUntil - the
   spec's own "respond 200 fast" aspiration isn't literally met (a few
   seconds for the LLM round trip, not milliseconds), but this matches
   every other webhook in this codebase (SignalWire's voice/sms webhooks
   do the same), and at this traffic scale a few seconds is fine.
   Revisit with a queue if/when volume makes that not true. */

export async function GET(request: NextRequest): Promise<Response> {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

export async function POST(request: NextRequest): Promise<Response> {
  const rawBody = await request.text();
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("[whatsapp-umrah webhook] META_APP_SECRET is not set");
    return new Response("server not configured", { status: 500 });
  }
  if (!verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"), appSecret)) {
    return new Response("invalid signature", { status: 403 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("invalid json", { status: 200 }); // 200 either way - a malformed payload isn't something retrying helps with
  }

  const messages = extractInboundTextMessages(payload);
  for (const msg of messages) {
    try {
      await processInboundMessage(msg);
    } catch (err) {
      // One bad message must never take down the rest of the batch or make
      // Meta think the whole POST failed and retry it (re-processing
      // messages that already succeeded) - log and move on.
      console.error("[whatsapp-umrah webhook] failed to process message", msg.waMessageId, err);
    }
  }

  // A staff reply sent from the agency's own WhatsApp Business app, not
  // our dashboard - see inbound.ts's processEchoedStaffMessage.
  const echoes = extractEchoedStaffMessages(payload);
  for (const echo of echoes) {
    try {
      await processEchoedStaffMessage(echo);
    } catch (err) {
      console.error("[whatsapp-umrah webhook] failed to process staff echo", echo.waMessageId, err);
    }
  }

  return new Response("ok", { status: 200 });
}
