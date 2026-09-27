import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  verifySignalwireSignature,
  sendSms,
  isTextBackConfig,
} from "@/lib/signalwire-text-back";
import { readSettings, missedCallSms, missedCallSpoken } from "@/lib/agent-settings";
import { recordUsageCost, ESTIMATED_COST_CENTS } from "@/lib/usage-costs";
import { isProjectPaused } from "@/lib/project-pause";
import { textingApproved, withOptOut } from "@/lib/texting-registration";
import { sendPlainEmail } from "@/lib/outreach-mail";

/* SignalWire Voice webhook for one client's AI Missed Call Text-Back number.
   The firm's own carrier has already forwarded-on-no-answer to this number
   by the time this fires, so there is nothing to "answer", this route's
   only jobs are: identify which client owns the dialed number, text the
   caller back immediately, and speak one short line before the call ends.
   No AI voice conversation, no Vapi involvement, no per-minute AI cost for
   a call nobody was going to have anyway. */

function xmlEscape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function twiml(sayText: string): Response {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${xmlEscape(sayText)}</Say></Response>`;
  return new Response(body, { status: 200, headers: { "Content-Type": "text/xml" } });
}

export async function POST(request: NextRequest): Promise<Response> {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) params[key] = String(value);

  // SignalWire requires validation against the exact public URL it called,
  // request.url is correct for a directly-hosted Vercel deployment (no
  // reverse proxy rewriting the host in front of this app).
  if (!verifySignalwireSignature(request.url, params, request.headers.get("x-signalwire-signature"))) {
    return new Response("invalid signature", { status: 400 });
  }

  const toNumber = params.To;
  // Forwarded calls carry the original caller's number in From; SignalWire
  // adds ForwardedFrom for genuinely forwarded legs (Twilio-compatible
  // field name), which takes precedence when present since From can
  // sometimes be the forwarding carrier's own number.
  const callerNumber = params.ForwardedFrom || params.From;
  if (!toNumber || !callerNumber) return new Response("missing To/From", { status: 400 });

  const integration = await db.integration.findFirst({
    where: { provider: "signalwire", externalRef: toNumber },
    select: { projectId: true, config: true },
  });
  if (!integration || !isTextBackConfig(integration.config)) {
    console.error(`[text-back voice webhook] no client configured for number ${toNumber}`);
    return twiml("We are unable to take your call right now. Please try again later.");
  }
  if (await isProjectPaused(integration.projectId)) {
    return twiml("We are unable to take your call right now. Please try again later.");
  }

  const { businessName } = integration.config;
  const project = await db.serviceProject.findUnique({ where: { id: integration.projectId }, select: { agentSettings: true, user: { select: { email: true } } } });
  const settings = readSettings(project?.agentSettings);

  // Until US carriers approve this number, texts would be blocked: alert the
  // owner instead so they can call back themselves.
  const approved = await textingApproved(integration.projectId);
  const smsResult = approved
    ? await sendSms({ to: callerNumber, from: toNumber, body: withOptOut(missedCallSms(settings, businessName)) })
    : ({ ok: false, error: "texting not approved yet" } as const);
  if (!approved && project?.user.email) {
    await sendPlainEmail(
      project.user.email,
      `Missed call from ${callerNumber}`,
      `You missed a call from ${callerNumber}. Call them back as soon as you can.\n\nAutomatic text replies start as soon as US carriers approve your texting number. You can see the status in your dashboard.`
    );
  } else if (!smsResult.ok) {
    console.error(`[text-back voice webhook] SMS send failed for ${toNumber}:`, smsResult.error);
  }

  await db.serviceMetric.create({
    data: {
      projectId: integration.projectId,
      key: smsResult.ok ? "missed_calls_texted" : approved ? "missed_calls_text_failed" : "missed_calls_owner_alerted",
      value: 1,
    },
  });

  await recordUsageCost(
    integration.projectId,
    ESTIMATED_COST_CENTS.SIGNALWIRE_VOICE_TRIGGER + (smsResult.ok ? ESTIMATED_COST_CENTS.SIGNALWIRE_SMS : 0),
    "missed-call text-back"
  );

  // Feeds the Follow-Up Clerk: every missed call that isn't already being
  // worked becomes a lead. Don't duplicate one still in progress.
  const existingLead = await db.lead.findFirst({
    where: { projectId: integration.projectId, phone: callerNumber, status: { in: ["NEW", "IN_SEQUENCE"] } },
  });
  if (!existingLead) {
    await db.lead.create({
      data: { projectId: integration.projectId, phone: callerNumber, source: "missed-call-text-back" },
    });
  }

  return twiml(missedCallSpoken(settings, businessName));
}
