import { cache } from "react";
import { planActivityFeed, type ConsoleProject } from "@/lib/client-console-data";
import { listServiceProjectsForHq, listServiceCatalogForHq, listServiceRequestsForHq } from "./queries";
import { toHqClient } from "./map";
import type { HqClient } from "./types";

export type HqActivityItem = { clientName: string; text: string; meta: string; tone: "run" | "need" | "done" | "dim"; at: Date };

/* Joins the 3 real tables a "client" is built from (ServiceProject,
   ServiceRequest, ServiceCatalog) into Zenith HQ's view model. cache()'d
   like the queries it calls - every page that needs the client list gets
   the same one join, computed once per request. */
export const getHqClients = cache(async function getHqClients(): Promise<HqClient[]> {
  const [projects, catalog, requests] = await Promise.all([listServiceProjectsForHq(), listServiceCatalogForHq(), listServiceRequestsForHq()]);
  const catalogBySlug = new Map(catalog.map((c) => [c.slug, c]));
  const requestByKey = new Map(requests.map((r) => [`${r.userId}:${r.serviceId}`, r]));
  const now = new Date();

  return projects.map((p) =>
    toHqClient(p, p.sourceServiceId ? (requestByKey.get(`${p.userId}:${p.sourceServiceId}`) ?? null) : null, p.sourceServiceId ? (catalogBySlug.get(p.sourceServiceId) ?? null) : null, now)
  );
});

export async function getHqClient(id: string): Promise<HqClient | null> {
  const clients = await getHqClients();
  return clients.find((c) => c.id === id) ?? null;
}

/* "Live across clients" feed: reuses client-console-data.ts's own
   planActivityFeed per project (the exact same real events the client's
   own dashboard shows them) and merges every client's feed into one
   newest-first list - never a fabricated event. */
export type HqMrrMonth = { label: string; bySlug: Record<string, number>; totalCents: number };

/* MRR history chart data. Past months come from MrrSnapshot (written by
   scripts/snapshot-mrr.mjs, run monthly) - this is a brand-new table with
   no backfillable history (there's no way to know last March's real MRR
   after the fact), so on a fresh deploy this correctly returns just the
   live current month and grows one bar at a time as the snapshot job
   actually runs, rather than padding out 5 fabricated zero months. The
   current month is NEVER read from the snapshot table, always recomputed
   live so it can't go stale mid-month (DESIGN.md 4.1). */
export const getMrrHistory = cache(async function getMrrHistory(): Promise<HqMrrMonth[]> {
  const { db } = await import("@/lib/db");
  const { SERVICE_ORDER } = await import("./types");
  const { mrrByService } = await import("./derive");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [snapshots, clients] = await Promise.all([
    db.mrrSnapshot.findMany({ where: { month: { gte: sixMonthsAgo, lt: monthStart } }, orderBy: { month: "asc" } }),
    getHqClients(),
  ]);

  const byMonth = new Map<string, Record<string, number>>();
  for (const s of snapshots) {
    const key = s.month.toISOString().slice(0, 7);
    const row = byMonth.get(key) ?? {};
    row[s.serviceSlug] = s.mrrCents;
    byMonth.set(key, row);
  }

  const months: HqMrrMonth[] = [];
  for (const [key, bySlug] of byMonth) {
    const label = new Date(key + "-01").toLocaleDateString("en-US", { month: "short" });
    months.push({ label, bySlug, totalCents: Object.values(bySlug).reduce((a, b) => a + b, 0) });
  }

  const liveBySlug: Record<string, number> = {};
  for (const slug of SERVICE_ORDER) liveBySlug[slug] = mrrByService(clients, slug);
  months.push({
    label: monthStart.toLocaleDateString("en-US", { month: "short" }),
    bySlug: liveBySlug,
    totalCents: Object.values(liveBySlug).reduce((a, b) => a + b, 0),
  });

  return months;
});

export const getHqActivityFeed = cache(async function getHqActivityFeed(limit = 8): Promise<HqActivityItem[]> {
  const projects = await listServiceProjectsForHq();
  const items: HqActivityItem[] = [];
  for (const p of projects) {
    if (!p.sourceServiceId) continue;
    const feed = planActivityFeed(p as unknown as ConsoleProject);
    for (const e of feed) items.push({ clientName: p.title, text: e.text, meta: e.meta, tone: e.tone, at: e.at });
  }
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
});
