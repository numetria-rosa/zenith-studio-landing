import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { upsertPaidAuditFromCalWebhook, type CalBookingWebhookPayload } from "@/lib/paid-audit";

/* Cal.com → Zenith webhook.
   Subscriber URL: https://zenith-studio.site/api/webhooks/cal
   Verify X-Cal-Signature-256 (HMAC-SHA256 hex of the raw body) with
   CAL_WEBHOOK_SECRET. Payload version: prefer 2021-10-20 (stable nested
   { triggerEvent, payload } shape). Filters to the paid-audit event only
   inside upsertPaidAuditFromCalWebhook — user-level Cal webhooks fire for
   every event type on the account. */

function verifyCalSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[cal webhook] CAL_WEBHOOK_SECRET is not set");
    return new Response("misconfigured", { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-cal-signature-256");
  if (!verifyCalSignature(rawBody, signature, secret)) {
    console.error("[cal webhook] rejected — signature verification failed");
    return new Response("invalid signature", { status: 400 });
  }

  let body: {
    triggerEvent?: string;
    createdAt?: string;
    payload?: CalBookingWebhookPayload;
  };
  try {
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const triggerEvent = body.triggerEvent;
  if (!triggerEvent || typeof triggerEvent !== "string") {
    return new Response("missing triggerEvent", { status: 400 });
  }

  // Nested booking events put fields under `payload`. MEETING_STARTED /
  // MEETING_ENDED are flat at the root — we ignore those trigger types in
  // upsertPaidAuditFromCalWebhook anyway, but still need a payload object.
  const payload: CalBookingWebhookPayload = body.payload ?? {};

  // Idempotency key: same booking + same trigger must not re-run (Cal can
  // retry). BOOKING_CREATED and BOOKING_PAID for the same uid are distinct
  // keys — both are safe; the PaidAudit upsert is itself idempotent on uid.
  const uid = typeof payload.uid === "string" ? payload.uid.trim() : "";
  const eventId = uid
    ? `cal:${uid}:${triggerEvent}`
    : `cal:body:${createHmac("sha256", secret).update(rawBody).digest("hex").slice(0, 40)}`;

  try {
    await db.$transaction(async (tx) => {
      await tx.webhookEvent.create({
        data: {
          id: eventId,
          type: `cal.${triggerEvent}`,
          payload: body as unknown as Prisma.InputJsonValue,
        },
      });

      const result = await upsertPaidAuditFromCalWebhook(triggerEvent, payload, tx);
      if (!result.ok) {
        // Roll back the WebhookEvent row so Cal's retry can reprocess.
        throw new Error(result.error);
      }
      if (result.action !== "ignored") {
        console.log(`[cal webhook] ${triggerEvent} → PaidAudit ${result.action} ${result.id}`);
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return new Response("OK", { status: 200 });
    }
    console.error("[cal webhook] processing failed, will let Cal retry:", err);
    return new Response("processing failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
