import type { Prisma } from "@prisma/client";

/* Shared ServiceProject creation helper (Slice 6 of the service-platform
   build, 2026-08-28). Used by exactly two triggers:
     1. src/lib/proposals-public.ts's recordClientResponse, when a client
        approves a proposal via the token-secured public view.
     2. src/app/api/webhooks/whop/route.ts's handlePaymentSucceeded, for
        the "law-firms"/"brokerages" vertical-offer purchases only.
   Both callers pass their own already-open Prisma transaction client, so
   project + seeded milestones/requirements are created atomically with
   whatever triggered them (the ClientApproval write, or the ServiceRequest
   upsert) — never as a separate, unguarded write. */

type Tx = Prisma.TransactionClient;

export const DEFAULT_MILESTONE_TITLES = [
  "Onboarding",
  "Requirements gathered",
  "Build started",
  "QA",
  "Live",
];

export const DEFAULT_REQUIREMENTS: { label: string; detail: string }[] = [
  { label: "Business information", detail: "Company name, industry, and primary point of contact." },
  { label: "Access requirements", detail: "Logins/API keys for the systems this build needs to connect to." },
  { label: "Brand assets", detail: "Logo, brand colors, and any existing voice/tone guidelines." },
  { label: "Workflow questionnaire", detail: "A short questionnaire covering how the current process works today." },
  { label: "Kickoff call", detail: "A short call to confirm scope and timeline before build starts." },
];

export const KICKOFF_MESSAGE_BODY = `Welcome — your project workspace is ready.

Please work through the Requirements checklist on this page (upload or confirm each item). Once those are in, we'll move into build.

Questions? Reply here anytime and we'll get back to you.`;

export type CreateServiceProjectParams = {
  userId: string;
  title: string;
  catalogServiceId?: string | null;
  proposalId?: string | null;
  sourceServiceId?: string | null;
  whopMonthlyMembershipId?: string | null;
};

/** Creates a ServiceProject at stage NEW plus the standard default
    milestones/requirements and an in-app kickoff message (from the oldest
    ADMIN user, if one exists). Caller wraps this in their transaction. */
export async function createServiceProjectWithDefaults(tx: Tx, params: CreateServiceProjectParams) {
  const project = await tx.serviceProject.create({
    data: {
      userId: params.userId,
      title: params.title,
      catalogServiceId: params.catalogServiceId ?? null,
      proposalId: params.proposalId ?? null,
      sourceServiceId: params.sourceServiceId ?? null,
      whopMonthlyMembershipId: params.whopMonthlyMembershipId ?? null,
    },
  });

  await tx.projectMilestone.createMany({
    data: DEFAULT_MILESTONE_TITLES.map((title, i) => ({
      projectId: project.id,
      title,
      order: i,
    })),
  });

  await tx.clientRequirement.createMany({
    data: DEFAULT_REQUIREMENTS.map((r, i) => ({
      projectId: project.id,
      label: r.label,
      detail: r.detail,
      order: i,
    })),
  });

  const adminSender = await tx.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (adminSender) {
    await tx.serviceMessage.create({
      data: {
        projectId: project.id,
        senderUserId: adminSender.id,
        senderRole: "ADMIN",
        body: KICKOFF_MESSAGE_BODY,
      },
    });
  }

  return project;
}
