import { db } from "@/lib/db";
import { getService, SERVICES } from "@/lib/services";

/* Read-only aggregate queries backing the /admin dashboard (Slice 2 of the
   service-platform build, 2026-08-28). No writes happen here. Every number
   traces back to a real Prisma query — see the revenue methodology notes
   inline below, which match the business brief's explicit rule against
   inventing/estimating revenue that isn't backed by a real payment. */

const ACTIVE_PROJECT_STAGES_EXCLUDED = ["COMPLETED", "CANCELLED"] as const;

/** "$150/mo" / "$2,000/mo" / "$190" / "" -> cents. Empty string (a
    monthly-only vertical's setupPriceDisplay) parses to 0, which is
    correct — those services never contribute setup revenue. */
export function parsePriceDisplayToCents(display: string | undefined): number {
  if (!display) return 0;
  const numeric = display.replace(/[^0-9.]/g, "");
  if (!numeric) return 0;
  const dollars = Number(numeric);
  if (!Number.isFinite(dollars)) return 0;
  return Math.round(dollars * 100);
}

export type RevenueByService = {
  serviceId: string;
  activeCount: number;
  mrrCents: number;
  setupCount: number;
  setupCents: number;
};

/** Groups active-monthly and setup-paid ServiceRequest rows by serviceId,
    multiplying real per-service prices from services.ts. This is reliable
    for all 5 services since the webhook writes a ServiceRequest row for
    every one of them (see webhook route.ts comments). */
export async function getRevenueByService(): Promise<RevenueByService[]> {
  const [activeGroups, setupGroups] = await Promise.all([
    db.serviceRequest.groupBy({
      by: ["serviceId"],
      where: { monthlyStatus: "active" },
      _count: { _all: true },
    }),
    db.serviceRequest.groupBy({
      by: ["serviceId"],
      where: { whopSetupPaymentId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const activeMap = new Map(activeGroups.map((g) => [g.serviceId, g._count._all]));
  const setupMap = new Map(setupGroups.map((g) => [g.serviceId, g._count._all]));

  const allServiceIds = new Set([...activeMap.keys(), ...setupMap.keys(), ...SERVICES.map((s) => s.id)]);

  return Array.from(allServiceIds).map((serviceId) => {
    const service = getService(serviceId);
    const activeCount = activeMap.get(serviceId) ?? 0;
    const setupCount = setupMap.get(serviceId) ?? 0;
    return {
      serviceId,
      activeCount,
      mrrCents: activeCount * parsePriceDisplayToCents(service?.monthlyPriceDisplay),
      setupCount,
      setupCents: setupCount * parsePriceDisplayToCents(service?.setupPriceDisplay),
    };
  });
}

export type RevenueTotals = {
  mrrCents: number;
  setupCents: number;
  activeRecurringCount: number;
};

export function summarizeRevenue(byService: RevenueByService[]): RevenueTotals {
  return byService.reduce(
    (acc, r) => ({
      mrrCents: acc.mrrCents + r.mrrCents,
      setupCents: acc.setupCents + r.setupCents,
      activeRecurringCount: acc.activeRecurringCount + r.activeCount,
    }),
    { mrrCents: 0, setupCents: 0, activeRecurringCount: 0 }
  );
}

/** Pending/pipeline value — ProposalItem.amountCents (excluding optional
    add-ons) across SENT/VIEWED proposals. Explicitly never blended into
    MRR: approval isn't payment, and even an unsent/undecided proposal's
    value is not confirmed revenue. */
export async function getPendingProposalValueCents(): Promise<number> {
  const items = await db.proposalItem.aggregate({
    where: {
      isOptionalAddOn: false,
      proposal: { status: { in: ["SENT", "VIEWED"] } },
    },
    _sum: { amountCents: true },
  });
  return items._sum.amountCents ?? 0;
}

export type TopMetrics = {
  totalClients: number;
  activeClients: number;
  activeServiceProjects: number;
  pendingProposals: number;
  openAudits: number;
  openSupportRequests: number;
};

export async function getTopMetrics(): Promise<TopMetrics> {
  const [
    srUserIds,
    spUserIds,
    proposalUserIds,
    auditEmails,
    activeSrUserIds,
    activeSpUserIds,
    activeServiceProjects,
    pendingProposals,
    openAudits,
    openSupportRequests,
  ] = await Promise.all([
    db.serviceRequest.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.serviceProject.findMany({ distinct: ["userId"], select: { userId: true } }),
    db.proposal.findMany({ where: { userId: { not: null } }, distinct: ["userId"], select: { userId: true } }),
    db.auditRequest.findMany({ distinct: ["email"], select: { email: true } }),
    db.serviceRequest.findMany({
      where: { monthlyStatus: "active" },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.serviceProject.findMany({
      where: { stage: { notIn: [...ACTIVE_PROJECT_STAGES_EXCLUDED] } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.serviceProject.count({ where: { stage: { notIn: [...ACTIVE_PROJECT_STAGES_EXCLUDED] } } }),
    db.proposal.count({ where: { status: { in: ["SENT", "VIEWED"] } } }),
    db.auditRequest.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
    db.supportRequest.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT"] } } }),
  ]);

  // AuditRequest has no userId FK — only best-effort email matching against
  // any User row that happens to share that email.
  const auditUserRows = auditEmails.length
    ? await db.user.findMany({
        where: { email: { in: auditEmails.map((a) => a.email) } },
        select: { id: true },
      })
    : [];

  const totalClientIds = new Set<string>([
    ...srUserIds.map((r) => r.userId),
    ...spUserIds.map((r) => r.userId),
    ...proposalUserIds.map((r) => r.userId as string),
    ...auditUserRows.map((r) => r.id),
  ]);

  const activeClientIds = new Set<string>([
    ...activeSrUserIds.map((r) => r.userId),
    ...activeSpUserIds.map((r) => r.userId),
  ]);

  return {
    totalClients: totalClientIds.size,
    activeClients: activeClientIds.size,
    activeServiceProjects,
    pendingProposals,
    openAudits,
    openSupportRequests,
  };
}

export type PipelineCounts = {
  openAudits: number;
  sentOrViewedProposals: number;
  approvedProposals: number;
  building: number;
  live: number;
  maintenance: number;
};

export async function getPipelineCounts(): Promise<PipelineCounts> {
  const [openAudits, sentOrViewedProposals, approvedProposals, building, live, maintenance] = await Promise.all([
    db.auditRequest.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
    db.proposal.count({ where: { status: { in: ["SENT", "VIEWED"] } } }),
    db.proposal.count({ where: { status: "APPROVED" } }),
    db.serviceProject.count({ where: { stage: "BUILDING" } }),
    db.serviceProject.count({ where: { stage: "LIVE" } }),
    db.serviceProject.count({ where: { stage: "MAINTENANCE" } }),
  ]);
  return { openAudits, sentOrViewedProposals, approvedProposals, building, live, maintenance };
}

/* ---------------------------------------------------------------------- */
/* Needs Attention                                                         */
/* ---------------------------------------------------------------------- */

export type AttentionItem = {
  id: string;
  kind:
    | "new_audit"
    | "stale_proposal"
    | "unstarted_approval"
    | "missing_requirement"
    | "open_support"
    | "overdue_task"
    | "urgent_task";
  label: string; // human-readable issue
  clientLabel: string; // name/email/company, best available
  service: string | null;
  ageMs: number;
  href: string;
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/** Real, bounded, ordered queries only — no fabricated urgency. Each item
    traces to a real row. Also surfaces overdue internal tasks and open
    HIGH/URGENT-priority tasks (Slice 6, 2026-08-28 — previously deferred
    since no Task model existed). Still deliberately skips "client messages
    needing a reply" since no "last admin reply" concept exists yet. */
export async function getNeedsAttention(): Promise<AttentionItem[]> {
  const now = Date.now();
  const staleThreshold = new Date(now - THREE_DAYS_MS);

  const [
    newAudits,
    staleProposals,
    unstartedApprovals,
    projectsMissingReqs,
    openSupport,
    overdueTasks,
    urgentTasks,
  ] = await Promise.all([
    db.auditRequest.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.proposal.findMany({
      where: {
        status: { in: ["SENT", "VIEWED"] },
        sentAt: { lt: staleThreshold },
        approvals: { none: {} },
      },
      orderBy: { sentAt: "asc" },
      take: 10,
    }),
    db.proposal.findMany({
      where: { status: "APPROVED", serviceProjects: { none: {} } },
      orderBy: { updatedAt: "asc" },
      take: 10,
    }),
    db.serviceProject.findMany({
      where: { requirements: { some: { status: "MISSING" } } },
      include: {
        user: { select: { name: true, email: true } },
        requirements: { where: { status: "MISSING" }, select: { id: true } },
      },
      orderBy: { updatedAt: "asc" },
      take: 10,
    }),
    db.supportRequest.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT"] } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
    db.task.findMany({
      where: { status: { not: "DONE" }, dueAt: { lt: new Date(now) } },
      include: { project: { select: { id: true, user: { select: { name: true, email: true } } } }, assignee: { select: { name: true, email: true } } },
      orderBy: { dueAt: "asc" },
      take: 10,
    }),
    db.task.findMany({
      where: { status: { not: "DONE" }, priority: { in: ["HIGH", "URGENT"] } },
      include: { project: { select: { id: true, user: { select: { name: true, email: true } } } }, assignee: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
  ]);

  const items: AttentionItem[] = [];

  for (const a of newAudits) {
    items.push({
      id: `audit-${a.id}`,
      kind: "new_audit",
      label: "New audit submission awaiting review",
      clientLabel: a.companyName || a.name || a.email,
      service: null,
      ageMs: now - a.createdAt.getTime(),
      href: `/admin/audits/${a.id}`,
    });
  }

  for (const p of staleProposals) {
    items.push({
      id: `proposal-stale-${p.id}`,
      kind: "stale_proposal",
      label: "Sent proposal has no client response after 3+ days",
      clientLabel: p.companyName || p.clientName || p.clientEmail,
      service: null,
      ageMs: p.sentAt ? now - p.sentAt.getTime() : 0,
      href: `/admin/proposals/${p.id}`,
    });
  }

  for (const p of unstartedApprovals) {
    items.push({
      id: `proposal-noproject-${p.id}`,
      kind: "unstarted_approval",
      label: "Approved proposal has no workspace yet — needs manual follow-up",
      clientLabel: p.companyName || p.clientName || p.clientEmail,
      service: null,
      ageMs: now - p.updatedAt.getTime(),
      href: `/admin/proposals/${p.id}`,
    });
  }

  for (const proj of projectsMissingReqs) {
    items.push({
      id: `project-missingreq-${proj.id}`,
      kind: "missing_requirement",
      label: `${proj.requirements.length} client requirement${proj.requirements.length === 1 ? "" : "s"} still missing`,
      clientLabel: proj.user.name || proj.user.email,
      service: proj.sourceServiceId ?? proj.title,
      ageMs: now - proj.updatedAt.getTime(),
      href: `/admin/service-requests`,
    });
  }

  for (const s of openSupport) {
    items.push({
      id: `support-${s.id}`,
      kind: "open_support",
      label: `Open support request: ${s.subject}`,
      clientLabel: s.user.name || s.user.email,
      service: null,
      ageMs: now - s.createdAt.getTime(),
      href: `/admin/service-requests`,
    });
  }

  const taskClientLabel = (t: { project: { user: { name: string | null; email: string } } | null; assignee: { name: string | null; email: string } | null }) =>
    t.project?.user.name || t.project?.user.email || (t.assignee ? `Assigned: ${t.assignee.name || t.assignee.email}` : "Internal task");

  for (const t of overdueTasks) {
    items.push({
      id: `task-overdue-${t.id}`,
      kind: "overdue_task",
      label: `Overdue task: ${t.title}`,
      clientLabel: taskClientLabel(t),
      service: null,
      ageMs: t.dueAt ? now - t.dueAt.getTime() : 0,
      href: t.project ? `/admin/projects/${t.project.id}` : "/admin/tasks",
    });
  }

  const overdueTaskIds = new Set(overdueTasks.map((t) => t.id));
  for (const t of urgentTasks) {
    if (overdueTaskIds.has(t.id)) continue; // already shown as overdue above
    items.push({
      id: `task-urgent-${t.id}`,
      kind: "urgent_task",
      label: `${t.priority === "URGENT" ? "Urgent" : "High-priority"} task: ${t.title}`,
      clientLabel: taskClientLabel(t),
      service: null,
      ageMs: now - t.createdAt.getTime(),
      href: t.project ? `/admin/projects/${t.project.id}` : "/admin/tasks",
    });
  }

  return items.sort((a, b) => b.ageMs - a.ageMs);
}

/* ---------------------------------------------------------------------- */
/* Recent activity feed                                                    */
/* ---------------------------------------------------------------------- */

export type ActivityEvent = {
  id: string;
  label: string;
  detail: string;
  at: Date;
  href: string;
};

/** Merges timestamps that already exist on real rows into one time-sorted
    feed. Deliberately does NOT create an ActivityLog model — per the
    brief's Phase D instruction, existing timestamps are enough for this
    slice. A future slice could add a real event log if richer activity
    (e.g. explicit stage-change history) is ever needed. */
export async function getRecentActivity(limit = 20): Promise<ActivityEvent[]> {
  const perSourceLimit = 8;

  const [audits, proposalsSent, approvals, projects, messages, supportRequests] = await Promise.all([
    db.auditRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: perSourceLimit,
      select: { id: true, createdAt: true, companyName: true, name: true, email: true },
    }),
    db.proposal.findMany({
      where: { sentAt: { not: null } },
      orderBy: { sentAt: "desc" },
      take: perSourceLimit,
      select: { id: true, sentAt: true, companyName: true, clientName: true, clientEmail: true },
    }),
    db.clientApproval.findMany({
      orderBy: { respondedAt: "desc" },
      take: perSourceLimit,
      include: { proposal: { select: { id: true, companyName: true, clientName: true, clientEmail: true } } },
    }),
    db.serviceProject.findMany({
      orderBy: { createdAt: "desc" },
      take: perSourceLimit,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.serviceMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: perSourceLimit,
      include: { project: { select: { id: true, user: { select: { name: true, email: true } } } } },
    }),
    db.supportRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: perSourceLimit,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const events: ActivityEvent[] = [];

  for (const a of audits) {
    events.push({
      id: `audit-${a.id}`,
      label: "New audit submitted",
      detail: a.companyName || a.name || a.email,
      at: a.createdAt,
      href: `/admin/audits/${a.id}`,
    });
  }

  for (const p of proposalsSent) {
    if (!p.sentAt) continue;
    events.push({
      id: `proposal-sent-${p.id}`,
      label: "Proposal sent",
      detail: p.companyName || p.clientName || p.clientEmail,
      at: p.sentAt,
      href: `/admin/proposals/${p.id}`,
    });
  }

  for (const c of approvals) {
    const actionLabel =
      c.action === "APPROVED"
        ? "Client approved proposal"
        : c.action === "CHANGES_REQUESTED"
          ? "Client requested changes"
          : "Client rejected proposal";
    events.push({
      id: `approval-${c.id}`,
      label: actionLabel,
      detail: c.proposal.companyName || c.proposal.clientName || c.proposal.clientEmail,
      at: c.respondedAt,
      href: `/admin/proposals/${c.proposal.id}`,
    });
  }

  for (const proj of projects) {
    events.push({
      id: `project-${proj.id}`,
      label: "New service project created",
      detail: `${proj.title} — ${proj.user.name || proj.user.email}`,
      at: proj.createdAt,
      href: `/admin/service-requests`,
    });
  }

  for (const m of messages) {
    events.push({
      id: `message-${m.id}`,
      label: m.senderRole === "CLIENT" ? "Client sent a message" : "Admin replied to client",
      detail: `${m.project.user.name || m.project.user.email}`,
      at: m.createdAt,
      href: `/admin/service-requests`,
    });
  }

  for (const s of supportRequests) {
    events.push({
      id: `support-${s.id}`,
      label: "New support request",
      detail: `${s.subject} — ${s.user.name || s.user.email}`,
      at: s.createdAt,
      href: `/admin/service-requests`,
    });
  }

  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

/* ---------------------------------------------------------------------- */
/* Service performance                                                     */
/* ---------------------------------------------------------------------- */

export type ServicePerformanceRow = {
  serviceId: string;
  title: string;
  activeClients: number;
  pendingProposals: number;
  activeProjects: number;
  mrrCents: number;
  setupCents: number;
};

/** One row per SERVICES entry. Pending-proposal traceability is
    best-effort: only ProposalItem rows explicitly linked to a
    ServiceCatalog row (via catalogServiceId) can be attributed to a
    specific service — not every proposal item carries that link, which is
    a real gap, disclosed in the dashboard UI rather than silently
    undercounted. */
export async function getServicePerformance(): Promise<ServicePerformanceRow[]> {
  const [revenueByService, catalogRows] = await Promise.all([
    getRevenueByService(),
    db.serviceCatalog.findMany({ select: { id: true, slug: true } }),
  ]);
  const revenueMap = new Map(revenueByService.map((r) => [r.serviceId, r]));
  const slugToCatalogId = new Map(catalogRows.map((c) => [c.slug, c.id]));

  const rows: ServicePerformanceRow[] = [];
  for (const service of SERVICES) {
    const revenue = revenueMap.get(service.id);
    const catalogId = slugToCatalogId.get(service.id);

    const [pendingProposals, activeProjects] = await Promise.all([
      catalogId
        ? db.proposalItem.count({
            where: { catalogServiceId: catalogId, proposal: { status: { in: ["SENT", "VIEWED"] } } },
          })
        : Promise.resolve(0),
      db.serviceProject.count({
        where: {
          stage: { notIn: [...ACTIVE_PROJECT_STAGES_EXCLUDED] },
          OR: [{ sourceServiceId: service.id }, ...(catalogId ? [{ catalogServiceId: catalogId }] : [])],
        },
      }),
    ]);

    rows.push({
      serviceId: service.id,
      title: service.title,
      activeClients: revenue?.activeCount ?? 0,
      pendingProposals,
      activeProjects,
      mrrCents: revenue?.mrrCents ?? 0,
      setupCents: revenue?.setupCents ?? 0,
    });
  }

  return rows;
}

/** True if there's essentially no traceable proposal/servicecatalog link
    for pending-proposal attribution — used by the UI to disclose the gap
    honestly rather than implying every proposal item is attributable. */
export async function hasUnlinkedProposalItems(): Promise<boolean> {
  const count = await db.proposalItem.count({
    where: { catalogServiceId: null, proposal: { status: { in: ["SENT", "VIEWED"] } } },
  });
  return count > 0;
}
