import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { projectServiceLabel } from "@/lib/service-projects-admin";

/* Global admin search (Slice 7 of the business command center, 2026-08-28).
   A lighter-weight, purpose-built search across the handful of entity types
   an admin actually needs to jump to — deliberately NOT a call into
   client-directory.ts's full merge-by-email logic, which builds a much
   richer (and much more expensive) per-identity profile than a live-search
   dropdown needs. This file only ever reads; it never writes.

   Security: independently calls requireAdmin() itself, exactly like every
   other admin write/read path in this codebase — search is a new entry
   point into client emails, proposal amounts, and task details, and must
   not be reachable just because "it's just search." Returns an empty result
   set (not an error) for a non-admin caller, matching the rest of this
   app's "admin routes are undiscoverable" convention. */

export type SearchResultGroup =
  | "CLIENTS"
  | "AUDITS"
  | "PROPOSALS"
  | "PROJECTS"
  | "SERVICE_CATALOG"
  | "TASKS";

export type SearchResult = {
  group: SearchResultGroup;
  id: string;
  label: string;
  sublabel: string | null;
  href: string;
};

export const SEARCH_GROUP_LABELS: Record<SearchResultGroup, string> = {
  CLIENTS: "Clients",
  AUDITS: "Audits",
  PROPOSALS: "Proposals",
  PROJECTS: "Projects",
  SERVICE_CATALOG: "Service catalog",
  TASKS: "Tasks",
};

const RESULTS_PER_GROUP = 8;

/** Searches across User/client identities, AuditRequest, Proposal,
    ServiceProject, ServiceCatalog, and Task. Case-insensitive substring
    matching via Prisma's `contains`/`mode: "insensitive"` — cleaner than
    hand-rolled JS filtering for these single-table queries (unlike
    client-directory.ts's cross-table merge, nothing here needs to be
    fetched in full and joined in memory). Returns [] for any non-admin
    caller and for an empty/whitespace-only query. */
export async function searchAdmin(queryRaw: string): Promise<SearchResult[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const q = queryRaw.trim();
  if (!q) return [];

  const [users, audits, proposals, projects, catalog, tasks] = await Promise.all([
    db.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: RESULTS_PER_GROUP,
    }),
    db.auditRequest.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { companyName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true, companyName: true },
      orderBy: { createdAt: "desc" },
      take: RESULTS_PER_GROUP,
    }),
    db.proposal.findMany({
      where: {
        OR: [
          { clientEmail: { contains: q, mode: "insensitive" } },
          { clientName: { contains: q, mode: "insensitive" } },
          { companyName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, clientEmail: true, clientName: true, companyName: true },
      orderBy: { createdAt: "desc" },
      take: RESULTS_PER_GROUP,
    }),
    db.serviceProject.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        title: true,
        sourceServiceId: true,
        catalogService: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: RESULTS_PER_GROUP,
    }),
    db.serviceCatalog.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { id: true, title: true, slug: true },
      take: RESULTS_PER_GROUP,
    }),
    db.task.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: {
        id: true,
        title: true,
        projectId: true,
        project: { select: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: RESULTS_PER_GROUP,
    }),
  ]);

  const results: SearchResult[] = [];

  for (const u of users) {
    results.push({
      group: "CLIENTS",
      id: u.id,
      label: u.name || u.email,
      sublabel: u.name ? u.email : null,
      href: `/admin/clients/${encodeURIComponent(u.email.toLowerCase())}`,
    });
  }

  for (const a of audits) {
    results.push({
      group: "AUDITS",
      id: a.id,
      label: a.companyName || a.name || a.email,
      sublabel: a.email,
      href: `/admin/audits/${a.id}`,
    });
  }

  for (const p of proposals) {
    results.push({
      group: "PROPOSALS",
      id: p.id,
      label: p.companyName || p.clientName || p.clientEmail,
      sublabel: p.clientEmail,
      href: `/admin/proposals/${p.id}`,
    });
  }

  for (const p of projects) {
    results.push({
      group: "PROJECTS",
      id: p.id,
      label: projectServiceLabel(p),
      sublabel: p.user.name || p.user.email,
      href: `/admin/projects/${p.id}`,
    });
  }

  for (const c of catalog) {
    results.push({
      group: "SERVICE_CATALOG",
      id: c.id,
      label: c.title,
      sublabel: c.slug,
      href: `/admin/service-catalog`,
    });
  }

  for (const t of tasks) {
    results.push({
      group: "TASKS",
      id: t.id,
      label: t.title,
      sublabel: t.project ? t.project.user.name || t.project.user.email : null,
      href: t.projectId ? `/admin/projects/${t.projectId}` : "/admin/tasks",
    });
  }

  return results;
}
