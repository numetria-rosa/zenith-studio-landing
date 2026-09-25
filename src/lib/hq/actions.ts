import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { getWhopClient } from "@/lib/whop";

/* Zenith HQ's one data-access module (writes). Every action here re-checks
   requireAdmin() itself - defense in depth on top of the calling page's own
   check, matching this repo's "never trust that reaching the action means
   the page's own check already passed" convention (see e.g.
   admin/tasks/page.tsx's own comment). Throws on auth failure rather than
   silently no-op'ing, since a thrown error surfaces in the calling page's
   error boundary instead of a mutation that looks like it worked. */
async function assertAdmin() {
  const session = await requireAdmin();
  if (!session) throw new Error("not authorized");
}

export async function convertTrial(projectId: string) {
  await assertAdmin();
  await db.serviceProject.update({ where: { id: projectId }, data: { trialEndsAt: null } });
}

export async function extendTrial(projectId: string, hours = 24) {
  await assertAdmin();
  const project = await db.serviceProject.findUniqueOrThrow({ where: { id: projectId }, select: { trialEndsAt: true } });
  const base = project.trialEndsAt && project.trialEndsAt.getTime() > Date.now() ? project.trialEndsAt : new Date();
  await db.serviceProject.update({ where: { id: projectId }, data: { trialEndsAt: new Date(base.getTime() + hours * 3600_000) } });
}

/* Whop's Payments API genuinely supports retrying a failed/pending charge
   with the original payment method (client.payments.retry) - confirmed
   against the installed @whop/sdk before writing this, not guessed. No
   "send a payment link" fallback needed. */
export async function retryCharge(projectId: string) {
  await assertAdmin();
  const project = await db.serviceProject.findUniqueOrThrow({ where: { id: projectId }, select: { userId: true, sourceServiceId: true } });
  if (!project.sourceServiceId) throw new Error("project has no service");
  const request = await db.serviceRequest.findUnique({ where: { userId_serviceId: { userId: project.userId, serviceId: project.sourceServiceId } } });
  if (!request?.lastFailedPaymentId) throw new Error("no failed payment on file to retry");

  const whop = getWhopClient();
  await whop.payments.retry(request.lastFailedPaymentId);
  // The retry itself is async on Whop's side (per the SDK's own docs) - the
  // real success/failure lands as another payment.succeeded/payment.failed
  // webhook, which is what actually clears lastFailedPaymentId and resumes
  // the project. This just kicks it off.
}

/* No per-agent retry hook exists across every plan (see client-console-data
   .ts) - the one real, universal lever an admin has is the project's own
   pause state, enforced by every runtime webhook via isProjectPaused().
   "Fix and retry" on an agent that needs attention, and the per-agent /
   pause-all toggles, all resolve to the same underlying action: resume (or
   pause) the whole project. This is an honest simplification, not a fake
   per-agent control - see the HQ build summary for why. */
export async function setProjectPaused(projectId: string, paused: boolean) {
  await assertAdmin();
  await db.serviceProject.update({ where: { id: projectId }, data: { stage: paused ? "PAUSED" : "LIVE" } });
}

/* Advances the pre-LIVE checklist one step (see ServiceProject
   .setupStepsCompleted's own comment). The final step ("Ready") isn't a
   stored step value - it moves the project to LIVE and, if the service
   offers a trial, starts the real 72h clock. */
export async function advanceSetup(projectId: string) {
  await assertAdmin();
  const project = await db.serviceProject.findUniqueOrThrow({ where: { id: projectId }, select: { setupStepsCompleted: true, sourceServiceId: true } });
  if (project.setupStepsCompleted < 2) {
    await db.serviceProject.update({ where: { id: projectId }, data: { setupStepsCompleted: project.setupStepsCompleted + 1 } });
    return;
  }
  const catalog = project.sourceServiceId ? await db.serviceCatalog.findUnique({ where: { slug: project.sourceServiceId }, select: { trialEnabled: true } }) : null;
  await db.serviceProject.update({
    where: { id: projectId },
    data: { stage: "LIVE", trialEndsAt: catalog?.trialEnabled ? new Date(Date.now() + 72 * 3600_000) : null },
  });
}

export async function adjustReadyBy(projectId: string, deltaHours: number) {
  await assertAdmin();
  const project = await db.serviceProject.findUniqueOrThrow({ where: { id: projectId }, select: { setupReadyBy: true, sourceServiceId: true } });
  const catalog = project.sourceServiceId ? await db.serviceCatalog.findUnique({ where: { slug: project.sourceServiceId }, select: { slaHours: true } }) : null;
  const base = project.setupReadyBy ?? new Date(Date.now() + (catalog?.slaHours ?? 24) * 3600_000);
  const next = new Date(base.getTime() + deltaHours * 3600_000);
  if (next.getTime() < Date.now()) return; // never set a ready-by in the past
  await db.serviceProject.update({ where: { id: projectId }, data: { setupReadyBy: next } });
}

export async function switchBillingCycle(projectId: string, cycle: "monthly" | "quarterly") {
  await assertAdmin();
  const project = await db.serviceProject.findUniqueOrThrow({ where: { id: projectId }, select: { userId: true, sourceServiceId: true } });
  if (!project.sourceServiceId) throw new Error("project has no service");
  await db.serviceRequest.update({ where: { userId_serviceId: { userId: project.userId, serviceId: project.sourceServiceId } }, data: { billingCycle: cycle } });
  // Note: this updates Zenith HQ's own billing-cycle record and MRR math
  // only. The real Whop subscription keeps renewing on whatever plan it's
  // actually attached to until you also switch it on Whop's side (or send
  // the client a new checkout link for the other cycle's plan) - see the
  // Services page's own note on why price/cycle edits here don't reach Whop.
}

export async function saveAdminNote(projectId: string, note: string) {
  await assertAdmin();
  await db.serviceProject.update({ where: { id: projectId }, data: { adminNote: note } });
}

export async function saveServicePrice(
  slug: string,
  fields: { listPriceCents?: number | null; monthlyPriceCents?: number | null; quarterlyPriceCentsPerMonth?: number | null; setupPriceCents?: number | null }
) {
  await assertAdmin();
  await db.serviceCatalog.update({ where: { slug }, data: fields });
}

export async function toggleServiceFlag(slug: string, flag: "freeSetup" | "trialEnabled" | "acceptingNewClients") {
  await assertAdmin();
  const current = await db.serviceCatalog.findUniqueOrThrow({ where: { slug }, select: { [flag]: true } as { [k in typeof flag]: true } });
  await db.serviceCatalog.update({ where: { slug }, data: { [flag]: !current[flag] } });
}

export async function changeSupportRequestStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "WAITING_CLIENT" | "RESOLVED" | "CLOSED") {
  await assertAdmin();
  await db.supportRequest.update({ where: { id }, data: { status } });
}

/* Replying moves an open request to in-progress, matching the prototype's
   rule exactly (DESIGN.md 4.8) - written as a real ServiceMessage on the
   linked project's thread, the same one the client dashboard's "Ask your
   team" reads. */
export async function replyToRequest(supportRequestId: string, adminUserId: string, body: string) {
  const session = await requireAdmin();
  if (!session) throw new Error("not authorized");
  const trimmed = body.trim();
  if (!trimmed) return;
  const request = await db.supportRequest.findUniqueOrThrow({ where: { id: supportRequestId }, select: { projectId: true, status: true } });
  if (!request.projectId) throw new Error("this request has no linked project to message");
  await db.$transaction([
    db.serviceMessage.create({ data: { projectId: request.projectId, senderUserId: adminUserId, senderRole: "ADMIN", body: trimmed } }),
    ...(request.status === "OPEN" ? [db.supportRequest.update({ where: { id: supportRequestId }, data: { status: "IN_PROGRESS" as const } })] : []),
  ]);
}

export async function createClient(input: { businessName: string; contactEmail: string; contactName: string; serviceSlug: string; billingCycle: "monthly" | "quarterly" }) {
  await assertAdmin();
  const email = input.contactEmail.trim().toLowerCase();
  if (!email) throw new Error("contact email is required");

  const catalog = await db.serviceCatalog.findUniqueOrThrow({ where: { slug: input.serviceSlug } });
  const user = await db.user.upsert({
    where: { email },
    update: input.contactName ? { name: input.contactName } : {},
    create: { email, name: input.contactName || undefined },
  });

  const project = await db.serviceProject.create({
    data: { userId: user.id, title: input.businessName, sourceServiceId: input.serviceSlug, stage: "NEW", setupReadyBy: new Date(Date.now() + catalog.slaHours * 3600_000) },
  });
  await db.serviceRequest.upsert({
    where: { userId_serviceId: { userId: user.id, serviceId: input.serviceSlug } },
    create: { userId: user.id, serviceId: input.serviceSlug, status: "new", billingCycle: input.billingCycle },
    update: { billingCycle: input.billingCycle },
  });
  return project.id;
}
