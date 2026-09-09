import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";
import { sendAdminAlert } from "@/lib/outreach-mail";
import { createFreePhoneNumber } from "@/lib/vapi-provision";
import { createEventType } from "@/lib/cal-booking";
import { RECEPTIONIST_REQUIREMENTS } from "@/lib/service-projects";

/* Onboarding automation for the AI Receptionist service — the piece that
   turns "admin marks project LIVE" into a fully working client with zero
   dashboard clicking. Called from updateProjectStage in
   service-projects-admin.ts, same pattern as ensureSplitMonthlyCheckoutForProject:
   runs BEFORE the stage write so a failure leaves the project retryable
   instead of stuck LIVE-but-broken. No-ops for every non-receptionist
   project and once a vapi Integration already exists (idempotent). */

type Result = { ok: true; skipped?: boolean } | { ok: false; error: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function provisionReceptionistIfNeeded(projectId: string): Promise<Result> {
  const project = await db.serviceProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      sourceServiceId: true,
      catalogService: { select: { slug: true } },
      requirements: { select: { label: true, detail: true, status: true } },
      integrations: { select: { provider: true } },
    },
  });
  if (!project) return { ok: false, error: "not_found" };

  const isReceptionist =
    project.sourceServiceId === "ai-receptionist" || project.catalogService?.slug === "ai-receptionist";
  if (!isReceptionist) return { ok: true, skipped: true };

  if (project.integrations.some((i) => i.provider === "vapi")) return { ok: true, skipped: true };

  const labels = RECEPTIONIST_REQUIREMENTS.map((r) => r.label);
  const answers = new Map(project.requirements.map((r) => [r.label, r]));

  const missing = labels.filter((label) => {
    const req = answers.get(label);
    return !req || req.status !== "APPROVED" || !req.detail?.trim();
  });
  if (missing.length > 0) {
    return {
      ok: false,
      error: `waiting on approved answers for: ${missing.join(", ")}`,
    };
  }

  const businessName = answers.get(labels[0])!.detail!.trim();
  const hours = answers.get(labels[1])!.detail!.trim();
  const faqText = answers.get(labels[2])!.detail!.trim();

  const serverSecret = process.env.VAPI_SERVER_SECRET;
  if (!serverSecret) return { ok: false, error: "VAPI_SERVER_SECRET is not set" };
  const serverUrl = `${getSiteUrl()}/api/webhooks/vapi`;

  const phoneResult = await createFreePhoneNumber({ areaCode: "213", serverUrl, serverSecret });
  if (!phoneResult.ok) return { ok: false, error: `Vapi phone number: ${phoneResult.error}` };

  const eventTypeResult = await createEventType({
    title: `${businessName} — Consultation`,
    slug: `${slugify(businessName)}-${project.id.slice(-6)}`,
    lengthMinutes: 30,
  });
  if (!eventTypeResult.ok) return { ok: false, error: `Cal.com event type: ${eventTypeResult.error}` };

  await db.integration.create({
    data: {
      projectId: project.id,
      provider: "vapi",
      externalRef: phoneResult.phoneNumberId,
      status: "CONNECTED",
      connectedAt: new Date(),
      config: {
        businessName,
        hours,
        faqText,
        calEventTypeId: eventTypeResult.eventTypeId,
      },
    },
  });

  await sendAdminAlert(
    `Receptionist live — ${businessName}`,
    `Phone number ${phoneResult.number} is live for ${businessName}. Cal.com event type ${eventTypeResult.eventTypeId} created.`
  );

  return { ok: true };
}
