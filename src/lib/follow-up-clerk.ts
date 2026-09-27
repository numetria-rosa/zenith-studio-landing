import { db } from "@/lib/db";
import { sendSms, isTextBackConfig } from "@/lib/signalwire-text-back";
import { sendAdminAlert } from "@/lib/outreach-mail";
import { recordUsageCost, ESTIMATED_COST_CENTS } from "@/lib/usage-costs";
import { readSettings, followUpGaps, followUpMessage } from "@/lib/agent-settings";

/* The AI Follow-Up Clerk role (law-firms vertical), works leads that
   didn't retain on first contact until they book, reply, or the sequence
   runs out. v1 is SMS-only (see the Lead model's schema comment for why).
   Driven by a daily cron (/api/cron/follow-up), same shape as the existing
   outreach cron. Stops the moment a lead replies, see the sms webhook,
   since a real reply means a human should take the conversation from
   there, matching this vertical's "you approve every entry" pattern. */

// Schedule and wording come from the client's own settings (agent-settings.ts);
// the defaults are the original 1/3/7-day sequence, word for word.

function daysSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

export async function processFollowUps(): Promise<{ processed: number; lost: number; sent: number }> {
  const leads = await db.lead.findMany({
    where: { status: { in: ["NEW", "IN_SEQUENCE"] }, sequenceStoppedAt: null, project: { stage: { not: "PAUSED" } } },
    include: { project: { include: { integrations: { where: { provider: "signalwire" } }, textingRegistration: { select: { status: true, activatedAt: true } } } } },
  });

  let sent = 0;
  let lost = 0;

  for (const lead of leads) {
    if (!lead.phone) continue; // v1 is SMS-only, nothing to do without a phone number
    // No texting until carriers approve the number, and no follow-ups to
    // calls from before approval (they'd arrive days late, out of context).
    const reg = lead.project.textingRegistration;
    if (reg?.status !== "ACTIVE" || !reg.activatedAt || lead.createdAt < reg.activatedAt) continue;
    const settings = readSettings(lead.project.agentSettings);
    const gaps = followUpGaps(settings);
    if (gaps.length === 0) continue; // client turned follow-ups off
    if (lead.sequenceStep >= gaps.length) {
      // Client shortened the schedule mid-sequence: this lead is already done.
      await db.lead.update({
        where: { id: lead.id },
        data: { status: "LOST", sequenceStoppedAt: new Date(), sequenceStopReason: "follow-up schedule finished" },
      });
      lost++;
      continue;
    }

    const dueDate = lead.lastOutreachAt ?? lead.createdAt;
    if (daysSince(dueDate) < gaps[lead.sequenceStep]) continue;

    const integration = lead.project.integrations[0];
    if (!integration || !isTextBackConfig(integration.config)) continue;
    const { businessName } = integration.config;

    const body = followUpMessage(settings, businessName, lead.sequenceStep, gaps.length);
    const result = await sendSms({ to: lead.phone, from: integration.externalRef ?? "", body });
    const isLastStep = lead.sequenceStep === gaps.length - 1;

    await db.lead.update({
      where: { id: lead.id },
      data: {
        status: isLastStep ? "LOST" : "IN_SEQUENCE",
        sequenceStep: lead.sequenceStep + 1,
        lastOutreachAt: new Date(),
        ...(isLastStep ? { sequenceStoppedAt: new Date(), sequenceStopReason: "no response after final follow-up" } : {}),
      },
    });

    if (result.ok) {
      sent++;
      await recordUsageCost(lead.projectId, ESTIMATED_COST_CENTS.SIGNALWIRE_SMS, "follow-up clerk sms");
    }
    if (isLastStep) lost++;
  }

  return { processed: leads.length, lost, sent };
}

/** Called from the inbound SMS webhook when a lead replies, hands the
    conversation to a human instead of continuing the sequence. */
export async function stopSequenceOnReply(leadId: string, replyBody: string, businessName: string): Promise<void> {
  await db.lead.update({
    where: { id: leadId },
    data: { sequenceStoppedAt: new Date(), sequenceStopReason: "replied" },
  });
  await sendAdminAlert(
    `Lead replied for ${businessName}`,
    `A lead replied: "${replyBody}". Their follow-up sequence has been stopped, please respond directly.`
  );
}
