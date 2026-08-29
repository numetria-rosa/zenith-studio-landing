import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { recordOutreachEvent, stopSequence, suppressEmail } from "@/lib/outreach-admin";

/** Resend / Svix webhook. Requires RESEND_WEBHOOK_SECRET (whsec_...). */
function verifySvix(rawBody: string, headers: Headers, secret: string): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signature = headers.get("svix-signature");
  if (!id || !timestamp || !signature) return false;
  const key = secret.startsWith("whsec_") ? Buffer.from(secret.slice(6), "base64") : Buffer.from(secret, "base64");
  const toSign = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", key).update(toSign).digest("base64");
  const incoming = signature.split(" ").map((part) => part.replace(/^v1,/, "").replace(/^v1=/, ""));
  return incoming.some((sig) => {
    try {
      const a = Buffer.from(expected);
      const b = Buffer.from(sig);
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const rawBody = await request.text();
  if (secret && !verifySvix(rawBody, request.headers, secret)) {
    return new Response("invalid signature", { status: 400 });
  }
  if (!secret) {
    console.warn("[resend webhook] RESEND_WEBHOOK_SECRET is not set — accepting only in development");
    if (process.env.NODE_ENV === "production") return new Response("misconfigured", { status: 500 });
  }

  let event: { type?: string; data?: { email_id?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const emailId = event.data?.email_id;
  if (!emailId) return new Response("OK", { status: 200 });

  const message = await db.outreachMessage.findUnique({
    where: { resendEmailId: emailId },
    select: { id: true, prospectId: true, prospect: { select: { email: true } } },
  });
  if (!message) return new Response("OK", { status: 200 });

  const type = event.type || "";
  const now = new Date();
  if (type === "email.delivered") {
    await db.outreachMessage.update({ where: { id: message.id }, data: { deliveredAt: now, status: "DELIVERED" } });
    await recordOutreachEvent(message.prospectId, "email_delivered", { emailId });
  } else if (type === "email.bounced" || type === "email.failed") {
    await db.outreachMessage.update({
      where: { id: message.id },
      data: { bouncedAt: now, status: "BOUNCED" },
    });
    if (message.prospect.email) await suppressEmail(message.prospect.email, "bounce");
    await stopSequence(message.prospectId, "bounce", "BOUNCED");
  } else if (type === "email.complained") {
    if (message.prospect.email) await suppressEmail(message.prospect.email, "complaint");
    await stopSequence(message.prospectId, "complaint", "UNSUBSCRIBED");
  } else if (type === "email.opened") {
    await db.outreachMessage.update({
      where: { id: message.id },
      data: { openedAt: now },
    });
    await recordOutreachEvent(message.prospectId, "email_opened", { emailId });
  } else if (type === "email.clicked") {
    await db.outreachMessage.update({
      where: { id: message.id },
      data: { clickedAt: now },
    });
  }

  return new Response("OK", { status: 200 });
}
