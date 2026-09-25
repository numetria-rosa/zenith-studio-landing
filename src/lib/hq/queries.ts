import { cache } from "react";
import { db } from "@/lib/db";
import { isSupportedPlan } from "@/lib/client-console-data";

/* Zenith HQ's one data-access module (reads). Every HQ page/action imports
   from here (or ./actions, ./derive), never touches Prisma directly - so
   swapping how a number is computed only ever means editing this folder.

   listServiceProjectsForHq mirrors getOwnedServiceProject's exact include
   shape (service-workspace.ts) - same relations the client dashboard's
   client-console-data.ts dispatcher (planAgents/planAgentStatus/etc.) reads
   - but admin-wide (no userId scope) and filtered to the 6 real sellable
   plans, so an HQ "client" and a client-dashboard "project" are always
   built from identical data. */
export const HQ_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  catalogService: { select: { title: true, slug: true } },
  milestones: { orderBy: { order: "asc" as const } },
  requirements: { orderBy: { order: "asc" as const } },
  integrations: { orderBy: { createdAt: "asc" as const } },
  metrics: { orderBy: { recordedAt: "desc" as const } },
  documents: { orderBy: { createdAt: "desc" as const } },
  messages: { orderBy: { createdAt: "asc" as const } },
  supportRequests: { orderBy: { createdAt: "desc" as const } },
  oauthConnections: { orderBy: { createdAt: "asc" as const } },
  timeEntries: { orderBy: { entryDate: "desc" as const } },
  leads: { orderBy: { createdAt: "desc" as const } },
  mailConnections: { orderBy: { createdAt: "asc" as const } },
  inboxDrafts: { orderBy: { createdAt: "desc" as const } },
  insurancePolicies: { orderBy: { renewalDate: "asc" as const } },
} as const;

export type HqProjectRow = NonNullable<Awaited<ReturnType<typeof listServiceProjectsForHq>>>[number];

// cache()'d so the layout (badges) and a page's own fetch within the same
// request dedupe to one query, same pattern as service-workspace.ts's
// getOwnedServiceProject.
export const listServiceProjectsForHq = cache(async function listServiceProjectsForHq() {
  const rows = await db.serviceProject.findMany({
    where: { sourceServiceId: { not: null }, stage: { notIn: ["CANCELLED"] } },
    include: HQ_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  // sourceServiceId is a free string column - only the 6 real catalog plans
  // belong in Zenith HQ (a legacy/experimental project with an unrecognized
  // id should never silently show up as a "client").
  return rows.filter((r) => isSupportedPlan(r.sourceServiceId));
});

export async function getServiceProjectForHq(id: string) {
  const row = await db.serviceProject.findUnique({ where: { id }, include: HQ_INCLUDE });
  if (!row || !isSupportedPlan(row.sourceServiceId)) return null;
  return row;
}

export async function getServiceRequestFor(userId: string, serviceId: string) {
  return db.serviceRequest.findUnique({ where: { userId_serviceId: { userId, serviceId } } });
}

export const listServiceCatalogForHq = cache(async function listServiceCatalogForHq() {
  return db.serviceCatalog.findMany({ orderBy: { createdAt: "asc" } });
});

export async function getServiceCatalogBySlug(slug: string) {
  return db.serviceCatalog.findUnique({ where: { slug } });
}

/* Requests page: every SupportRequest (with its project + real
   ServiceMessage thread since that ticket's project was created) across
   every client, newest first. */
export const listSupportRequestsForHq = cache(async function listSupportRequestsForHq() {
  return db.supportRequest.findMany({
    include: {
      user: { select: { name: true, email: true } },
      project: { select: { id: true, title: true, sourceServiceId: true } },
    },
    orderBy: { createdAt: "desc" },
  });
});

export async function getSupportRequestThread(supportRequestId: string) {
  const req = await db.supportRequest.findUnique({
    where: { id: supportRequestId },
    include: { user: { select: { name: true, email: true } }, project: { select: { id: true, title: true } } },
  });
  if (!req?.projectId) return { request: req, thread: [] };
  const thread = await db.serviceMessage.findMany({
    where: { projectId: req.projectId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { name: true, email: true } } },
  });
  return { request: req, thread };
}

/* Leads page: three real funnels, one consolidated read. Cold-outreach
   Prospects that reached a real conversation (not just "sent, no reply"),
   free AuditRequests, and paid $35 audit-call bookings - see PaidAudit's
   own status enum for Booked/Showed-equivalent stages. */
export async function listLeadSourcesForHq() {
  const [prospects, audits, paidAudits] = await Promise.all([
    db.prospect.findMany({
      where: { status: { in: ["REPLIED", "HOT", "AUDIT_REQUESTED", "CUSTOMER"] } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    db.auditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.paidAudit.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return { prospects, audits, paidAudits };
}

export const listServiceRequestsForHq = cache(async function listServiceRequestsForHq() {
  return db.serviceRequest.findMany();
});

export async function listTasksForHq() {
  const { listTasksForAdmin } = await import("@/lib/tasks-admin");
  return listTasksForAdmin();
}
