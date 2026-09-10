import { db } from "@/lib/db";
import { sendAdminAlert } from "@/lib/outreach-mail";
import { isInternalMetricKey } from "@/lib/metric-labels";

/* Silent-failure detection ("dead man's switch"): nothing else in this
   codebase catches a live integration that just stops producing real
   activity — a webhook silently breaking, a token quietly expiring in a
   way that doesn't throw, a provider-side outage. Compares a client's own
   recent activity against their own baseline rather than an absolute
   threshold, so a genuinely low-volume client (one call a week) never
   false-positives just for being small: only a client who WAS active and
   suddenly went to zero gets flagged.

   Runs from /api/cron/dead-man-switch, once daily. Only LIVE/MAINTENANCE
   projects are checked — earlier stages haven't gone live yet, and this
   isn't the readiness check that belongs there. */

const RECENT_WINDOW_MS = 48 * 60 * 60 * 1000; // the window that should show fresh activity
const BASELINE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // how far back to look for "were they ever active"

function currentDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** One real activity row (any non-internal ServiceMetric key) is enough to
    count a window as "active" — this isn't measuring volume, just whether
    anything happened at all. */
async function hasActivityInWindow(projectId: string, sinceMs: number, untilMs: number): Promise<boolean> {
  const rows = await db.serviceMetric.findMany({
    where: { projectId, recordedAt: { gte: new Date(sinceMs), lt: new Date(untilMs) } },
    select: { key: true },
    take: 50, // only need to know "any", not "how many"
  });
  return rows.some((r) => !isInternalMetricKey(r.key));
}

export async function checkForSilentIntegrations(): Promise<{ projectsChecked: number; alertsFired: number }> {
  const projects = await db.serviceProject.findMany({
    where: { stage: { in: ["LIVE", "MAINTENANCE"] } },
    select: { id: true, title: true },
  });

  const now = Date.now();
  let alertsFired = 0;

  for (const project of projects) {
    const recentActive = await hasActivityInWindow(project.id, now - RECENT_WINDOW_MS, now);
    if (recentActive) continue; // still producing activity, nothing to flag

    const wasEverActive = await hasActivityInWindow(project.id, now - BASELINE_WINDOW_MS, now - RECENT_WINDOW_MS);
    if (!wasEverActive) continue; // never had activity to begin with, not a silent failure, just quiet

    const markerKey = `dead_man_alert_${currentDayKey()}`;
    const existing = await db.serviceMetric.findFirst({ where: { projectId: project.id, key: markerKey } });
    if (existing) continue; // already alerted today for this project, don't repeat every run

    await db.serviceMetric.create({ data: { projectId: project.id, key: markerKey, value: 1 } });
    await sendAdminAlert(
      `Silent integration: ${project.title}`,
      `This project had real activity in the last 14 days but nothing in the last 48 hours. Could be a genuinely quiet stretch, or a webhook/token silently broken — worth a manual check.`
    );
    alertsFired++;
  }

  return { projectsChecked: projects.length, alertsFired };
}
