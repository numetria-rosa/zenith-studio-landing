import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";
import { sendAdminAlert } from "@/lib/outreach-mail";
import { purchaseSignalwireNumber } from "@/lib/signalwire-text-back";
import { TEXT_BACK_REQUIREMENTS } from "@/lib/service-projects";

/* Onboarding automation for AI Missed Call Text-Back — one role within the
   law-firms vertical package. Same trigger point and clean-retry-before-
   stage-write pattern as provisionReceptionistIfNeeded and the SPLIT
   monthly checkout: runs inside updateProjectStage when a project is
   marked LIVE. No-ops for every non-law-firms project and once a
   signalwire Integration already exists. */

type Result = { ok: true; skipped?: boolean } | { ok: false; error: string };

export async function provisionTextBackIfNeeded(projectId: string): Promise<Result> {
  const project = await db.serviceProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      sourceServiceId: true,
      requirements: { select: { label: true, detail: true, status: true } },
      integrations: { select: { provider: true } },
    },
  });
  if (!project) return { ok: false, error: "not_found" };

  if (project.sourceServiceId !== "law-firms") return { ok: true, skipped: true };
  if (project.integrations.some((i) => i.provider === "signalwire")) return { ok: true, skipped: true };

  const label = TEXT_BACK_REQUIREMENTS[0].label;
  const requirement = project.requirements.find((r) => r.label === label);
  if (!requirement || requirement.status !== "APPROVED" || !requirement.detail?.trim()) {
    return { ok: false, error: `waiting on an approved answer for: ${label}` };
  }
  const businessName = requirement.detail.trim();

  const voiceUrl = `${getSiteUrl()}/api/webhooks/text-back/voice`;
  const smsUrl = `${getSiteUrl()}/api/webhooks/text-back/sms`;
  const purchaseResult = await purchaseSignalwireNumber({ areaCode: "213", voiceUrl, smsUrl });
  if (!purchaseResult.ok) return { ok: false, error: `SignalWire number purchase: ${purchaseResult.error}` };

  await db.integration.create({
    data: {
      projectId: project.id,
      provider: "signalwire",
      externalRef: purchaseResult.phoneNumber,
      status: "CONNECTED",
      connectedAt: new Date(),
      config: { businessName },
    },
  });

  await sendAdminAlert(
    `Missed Call Text-Back live — ${businessName}`,
    `SignalWire number ${purchaseResult.phoneNumber} is live for ${businessName}. Tell them to forward-on-no-answer to this number.`
  );

  return { ok: true };
}
