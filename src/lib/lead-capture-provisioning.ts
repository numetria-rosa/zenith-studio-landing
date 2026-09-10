import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";
import { sendAdminAlert } from "@/lib/outreach-mail";
import { purchaseSignalwireNumber } from "@/lib/signalwire-text-back";
import { LEAD_CAPTURE_REQUIREMENTS } from "@/lib/service-projects";

/* Onboarding automation for AI Lead Capture & Follow-Up. Same trigger point
   and clean-retry-before-stage-write pattern as the other two provisioning
   functions: runs inside updateProjectStage when a project is marked LIVE.
   Provisions the same kind of SignalWire number as Missed Call Text-Back
   (needed here for the SMS confirmation + follow-up sequence), just with
   this service's own config shape and no voice webhook — a lead-capture
   number never receives calls, only sends outbound SMS. */

type Result = { ok: true; skipped?: boolean } | { ok: false; error: string };

export async function provisionLeadCaptureIfNeeded(projectId: string): Promise<Result> {
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

  if (project.sourceServiceId !== "ai-lead-capture") return { ok: true, skipped: true };
  if (project.integrations.some((i) => i.provider === "signalwire")) return { ok: true, skipped: true };

  const labels = LEAD_CAPTURE_REQUIREMENTS.map((r) => r.label);
  const answers = new Map(project.requirements.map((r) => [r.label, r]));
  const missing = labels.filter((label) => {
    const req = answers.get(label);
    return !req || req.status !== "APPROVED" || !req.detail?.trim();
  });
  if (missing.length > 0) return { ok: false, error: `waiting on approved answers for: ${missing.join(", ")}` };

  const businessName = answers.get(labels[0])!.detail!.trim();
  const qualificationRules = answers.get(labels[1])!.detail!.trim();
  const notifyEmail = answers.get(labels[2])!.detail!.trim();

  // No voiceUrl — this number is outbound-SMS-only, unlike Missed Call
  // Text-Back's number, which needs a voice webhook to detect the call.
  const smsUrl = `${getSiteUrl()}/api/webhooks/text-back/sms`;
  const purchaseResult = await purchaseSignalwireNumber({ areaCode: "213", smsUrl });
  if (!purchaseResult.ok) return { ok: false, error: `SignalWire number purchase: ${purchaseResult.error}` };

  await db.integration.create({
    data: {
      projectId: project.id,
      provider: "signalwire",
      externalRef: purchaseResult.phoneNumber,
      status: "CONNECTED",
      connectedAt: new Date(),
      config: { businessName, qualificationRules, notifyEmail },
    },
  });

  await sendAdminAlert(
    `Lead Capture live for ${businessName}`,
    `SignalWire number ${purchaseResult.phoneNumber} is live for ${businessName}. Capture endpoint: ${getSiteUrl()}/api/leads/capture/${project.id}`
  );

  return { ok: true };
}
