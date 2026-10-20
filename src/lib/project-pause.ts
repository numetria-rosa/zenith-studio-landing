import { db } from "@/lib/db";

/* The one check every runtime webhook (Vapi, SignalWire voice/sms, lead
   capture) runs before doing anything AI-driven. ProjectStage.PAUSED
   existed as a real enum value with nothing enforcing it, an admin could
   set a project to PAUSED and the client's phone/SMS system would keep
   right on running. This is what makes the Pause button on the admin page
   actually stop something, not just change a label. */
export async function isProjectPaused(projectId: string): Promise<boolean> {
  const project = await db.serviceProject.findUnique({ where: { id: projectId }, select: { stage: true, usageHoldUntil: true } });
  return project?.stage === "PAUSED" || (!!project?.usageHoldUntil && project.usageHoldUntil > new Date());
}

/** Same rule as isProjectPaused, as a Prisma filter for the cron queries: not paused, and not on a usage hold. */
export function runnableProject() {
  return { stage: { not: "PAUSED" as const }, OR: [{ usageHoldUntil: null }, { usageHoldUntil: { lte: new Date() } }] };
}
