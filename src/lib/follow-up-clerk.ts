import { db } from "@/lib/db";
import { sendSms, isTextBackConfig } from "@/lib/signalwire-text-back";
import { sendAdminAlert } from "@/lib/outreach-mail";
import { recordUsageCost, ESTIMATED_COST_CENTS } from "@/lib/usage-costs";

/* The AI Follow-Up Clerk role (law-firms vertical), works leads that
   didn't retain on first contact until they book, reply, or the sequence
   runs out. v1 is SMS-only (see the Lead model's schema comment for why).
   Driven by a daily cron (/api/cron/follow-up), same shape as the existing
   outreach cron. Stops the moment a lead replies, see the sms webhook,
   since a real reply means a human should take the conversation from
   there, matching this vertical's "you approve every entry" pattern. */

const FOLLOW_UP_STEPS: { afterDays: number; message: (businessName: string) => string }[] = [
  {
    afterDays: 1,
    message: (b) => `Hi, this is ${b} again. Just checking in after your call, would you like us to schedule a consult?`,
  },
  {
    afterDays: 3,
    message: (b) => `Following up from ${b}. We'd still love to help, reply here or call us back when you get a chance.`,
  },
  {
    afterDays: 7,
    message: (b) =>
      `This is ${b}'s last check-in. If you still need help, reply and we'll get you booked. Otherwise we won't reach out again.`,
  },
];

function daysSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

export async function processFollowUps(): Promise<{ processed: number; lost: number; sent: number }> {
  const leads = await db.lead.findMany({
    where: { status: { in: ["NEW", "IN_SEQUENCE"] }, sequenceStoppedAt: null, project: { stage: { not: "PAUSED" } } },
    include: { project: { include: { integrations: { where: { provider: "signalwire" } } } } },
  });

  let sent = 0;
  let lost = 0;

  for (const lead of leads) {
    if (!lead.phone) continue; // v1 is SMS-only, nothing to do without a phone number
    const step = FOLLOW_UP_STEPS[lead.sequenceStep];
    if (!step) continue; // already past the last step, waiting to be marked LOST below

    const dueDate = lead.lastOutreachAt ?? lead.createdAt;
    if (daysSince(dueDate) < step.afterDays) continue;

    const integration = lead.project.integrations[0];
    if (!integration || !isTextBackConfig(integration.config)) continue;
    const { businessName } = integration.config;

    const result = await sendSms({ to: lead.phone, from: integration.externalRef ?? "", body: step.message(businessName) });
    const isLastStep = lead.sequenceStep === FOLLOW_UP_STEPS.length - 1;

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
