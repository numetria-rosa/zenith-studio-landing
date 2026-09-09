import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyTwilioSignature, isTextBackConfig } from "@/lib/twilio-text-back";
import { stopSequenceOnReply } from "@/lib/follow-up-clerk";

/* Twilio inbound SMS webhook, shared by the same number Missed Call
   Text-Back provisions. Its only job is detecting a reply so the Follow-Up
   Clerk's sequence stops and a human takes over — no AI conversation here
   (that's a separate, not-yet-built layer). */

function emptyTwiml(): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) params[key] = String(value);

  if (!verifyTwilioSignature(request.url, params, request.headers.get("x-twilio-signature"))) {
    return new Response("invalid signature", { status: 400 });
  }

  const toNumber = params.To;
  const fromNumber = params.From;
  const body = params.Body ?? "";
  if (!toNumber || !fromNumber) return new Response("missing To/From", { status: 400 });

  const integration = await db.integration.findFirst({
    where: { provider: "twilio", externalRef: toNumber },
    select: { projectId: true, config: true },
  });
  if (!integration || !isTextBackConfig(integration.config)) return emptyTwiml();

  const lead = await db.lead.findFirst({
    where: { projectId: integration.projectId, phone: fromNumber, sequenceStoppedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (lead) {
    await stopSequenceOnReply(lead.id, body, integration.config.businessName);
  }

  return emptyTwiml();
}
