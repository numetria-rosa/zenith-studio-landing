import { db } from "@/lib/db";
import { getService } from "@/lib/services";
import { parsePriceDisplayToCents } from "@/lib/dashboard-metrics";
import type {
  User,
  AuditRequest,
  Proposal,
  ServiceRequest,
  ServiceProject,
  ServiceMessage,
  SupportRequest,
} from "@prisma/client";

/* Unified client directory (Slice 3 of the business command center,
   2026-08-28). There is no single stable "client" id in the schema — a real
   identity could be an email-only AuditRequest lead with no User row at
   all, a Proposal with a clientEmail but no account yet, or a real User
   with ServiceRequest/ServiceProject rows. Per the brief, this deliberately
   does NOT introduce a new ClientProfile table: everything here is derived
   by merging on lowercased email across the three existing source tables in
   application code, reusing dashboard-metrics.ts's exact revenue
   methodology (ServiceRequest-only, never Proposal/ServiceProject pipeline
   value) rather than reinventing price parsing.

   Performance note: given the current near-zero row counts across User /
   AuditRequest / Proposal, this fetches each source table in full (3 batched
   queries) rather than paginating, then merges in memory — the brief
   explicitly sanctions this trade-off at the current real scale. If any of
   these tables ever grows large (thousands+ rows), this needs to become a
   real paginated/indexed query path instead of a full-table merge. */

export type ClientStage = "ACTIVE_SERVICE" | "APPROVED_PENDING" | "PROPOSAL" | "AUDIT_PROSPECT";

export const CLIENT_STAGE_LABELS: Record<ClientStage, string> = {
  ACTIVE_SERVICE: "Active service",
  APPROVED_PENDING: "Approved, pending delivery",
  PROPOSAL: "Proposal sent",
  AUDIT_PROSPECT: "Audit / prospect",
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const TERMINAL_PROJECT_STAGES = ["COMPLETED", "CANCELLED"] as const;

function lc(email: string): string {
  return email.trim().toLowerCase();
}

/** Derives stage, revenue, services list, last-activity timestamp, and
    outstanding actions from one identity's already-fetched rows. Shared by
    both the batched directory listing and the single-identity profile page
    so the two never drift apart. */
function deriveClientFacts(input: {
  user: Pick<User, "id" | "email" | "name" | "role" | "createdAt"> | null;
  audits: AuditRequest[];
  proposals: Proposal[];
  serviceRequests: ServiceRequest[];
  serviceProjects: (ServiceProject & { catalogService?: { title: string } | null })[];
  openSupportCount: number;
}) {
  const { user, audits, proposals, serviceRequests, serviceProjects, openSupportCount } = input;
  const now = Date.now();

  const hasActiveServiceRequest = serviceRequests.some((sr) => sr.monthlyStatus === "active");
  const hasActiveProject = serviceProjects.some(
    (p) => !TERMINAL_PROJECT_STAGES.includes(p.stage as (typeof TERMINAL_PROJECT_STAGES)[number])
  );
  const hasApprovedProposal = proposals.some((p) => p.status === "APPROVED");
  const hasSentProposal = proposals.some((p) =>
    ["SENT", "VIEWED", "CHANGES_REQUESTED"].includes(p.status)
  );

  let stage: ClientStage;
  if (hasActiveServiceRequest || hasActiveProject) stage = "ACTIVE_SERVICE";
  else if (hasApprovedProposal) stage = "APPROVED_PENDING";
  else if (hasSentProposal) stage = "PROPOSAL";
  else stage = "AUDIT_PROSPECT";

  // Revenue: exact same ServiceRequest-based methodology as
  // dashboard-metrics.ts — never derived from Proposal or ServiceProject.
  let mrrCents = 0;
  let setupCents = 0;
  const serviceLabels = new Set<string>();
  for (const sr of serviceRequests) {
    const service = getService(sr.serviceId);
    if (service) serviceLabels.add(service.title);
    if (sr.monthlyStatus === "active") mrrCents += parsePriceDisplayToCents(service?.monthlyPriceDisplay);
    if (sr.whopSetupPaymentId) setupCents += parsePriceDisplayToCents(service?.setupPriceDisplay);
  }
  for (const p of serviceProjects) {
    if (p.catalogService?.title) serviceLabels.add(p.catalogService.title);
    else if (p.sourceServiceId) {
      const service = getService(p.sourceServiceId);
      serviceLabels.add(service?.title ?? p.sourceServiceId);
    } else {
      serviceLabels.add(p.title);
    }
  }

  // Display name/company: prefer the richest, most recent named source.
  const latestAudit = audits[0]; // callers pass these ordered createdAt desc
  const latestProposal = proposals[0]; // callers pass these ordered createdAt desc
  const companyName = latestProposal?.companyName || latestAudit?.companyName || null;
  const displayName =
    companyName ||
    latestProposal?.clientName ||
    latestAudit?.name ||
    user?.name ||
    user?.email ||
    latestProposal?.clientEmail ||
    latestAudit?.email ||
    "(unknown)";

  // Last activity: max of any relevant timestamp we have in hand.
  const timestamps: number[] = [];
  for (const a of audits) timestamps.push(a.updatedAt.getTime());
  for (const p of proposals) timestamps.push(p.updatedAt.getTime());
  for (const sr of serviceRequests) timestamps.push(sr.updatedAt.getTime());
  for (const sp of serviceProjects) timestamps.push(sp.updatedAt.getTime());
  if (user?.createdAt) timestamps.push(user.createdAt.getTime());
  const lastActivityAt = timestamps.length ? new Date(Math.max(...timestamps)) : null;

  // Outstanding actions — same signals as dashboard-metrics.ts's Needs
  // Attention, scoped to this one client.
  const outstandingActions: string[] = [];
  const staleThreshold = now - THREE_DAYS_MS;
  for (const a of audits) {
    if (a.status === "SUBMITTED") outstandingActions.push("Audit needs review");
  }
  for (const p of proposals) {
    if (["SENT", "VIEWED"].includes(p.status) && p.sentAt && p.sentAt.getTime() < staleThreshold) {
      outstandingActions.push("Proposal awaiting response (3+ days)");
    }
    if (p.status === "APPROVED" && !serviceProjects.some((sp) => sp.proposalId === p.id)) {
      outstandingActions.push("Approved proposal needs a workspace");
    }
  }
  const missingReqCount = serviceProjects.reduce(
    (acc, sp) => acc + ((sp as unknown as { requirements?: { status: string }[] }).requirements?.filter((r) => r.status === "MISSING").length ?? 0),
    0
  );
  if (missingReqCount > 0) {
    outstandingActions.push(`${missingReqCount} client requirement${missingReqCount === 1 ? "" : "s"} missing`);
  }
  if (openSupportCount > 0) {
    outstandingActions.push(`${openSupportCount} open support request${openSupportCount === 1 ? "" : "s"}`);
  }

  return {
    stage,
    stageLabel: CLIENT_STAGE_LABELS[stage],
    mrrCents,
    setupCents,
    services: Array.from(serviceLabels),
    displayName,
    companyName,
    lastActivityAt,
    outstandingActions,
  };
}

export type ClientDirectoryEntry = {
  email: string; // lowercased, the route-param identity
  displayName: string;
  companyName: string | null;
  userId: string | null;
  role: "CLIENT" | "ADMIN" | null;
  stage: ClientStage;
  stageLabel: string;
  services: string[];
  mrrCents: number;
  setupCents: number;
  lastActivityAt: Date | null;
  outstandingActions: string[];
  counts: { audits: number; proposals: number; serviceRequests: number; serviceProjects: number };
};

/** The full merged directory. Three batched source-table fetches, then an
    in-memory merge keyed on lowercased email — see file header for the
    performance trade-off this makes at current scale. */
export async function getClientDirectory(): Promise<ClientDirectoryEntry[]> {
  const [users, audits, proposals] = await Promise.all([
    db.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } }),
    db.auditRequest.findMany({ orderBy: { createdAt: "desc" } }),
    db.proposal.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const userIds = users.map((u) => u.id);
  const [serviceRequests, serviceProjects, openSupportRows] = await Promise.all([
    userIds.length
      ? db.serviceRequest.findMany({ where: { userId: { in: userIds } } })
      : Promise.resolve([] as ServiceRequest[]),
    userIds.length
      ? db.serviceProject.findMany({
          where: { userId: { in: userIds } },
          include: {
            catalogService: { select: { title: true } },
            requirements: { where: { status: "MISSING" }, select: { status: true } },
          },
        })
      : Promise.resolve([] as (ServiceProject & { catalogService: { title: string } | null; requirements: { status: string }[] })[]),
    userIds.length
      ? db.supportRequest.groupBy({
          by: ["userId"],
          where: { userId: { in: userIds }, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT"] } },
          _count: { _all: true },
        })
      : Promise.resolve([] as { userId: string; _count: { _all: number } }[]),
  ]);

  const userById = new Map(users.map((u) => [u.id, u]));
  const openSupportByUserId = new Map(openSupportRows.map((r) => [r.userId, r._count._all]));

  // Group everything by lowercased email.
  const emails = new Set<string>();
  for (const u of users) emails.add(lc(u.email));
  for (const a of audits) emails.add(lc(a.email));
  for (const p of proposals) emails.add(lc(p.clientEmail));

  const auditsByEmail = new Map<string, AuditRequest[]>();
  for (const a of audits) {
    const key = lc(a.email);
    if (!auditsByEmail.has(key)) auditsByEmail.set(key, []);
    auditsByEmail.get(key)!.push(a);
  }

  const proposalsByEmail = new Map<string, Proposal[]>();
  for (const p of proposals) {
    const key = lc(p.clientEmail);
    if (!proposalsByEmail.has(key)) proposalsByEmail.set(key, []);
    proposalsByEmail.get(key)!.push(p);
  }
  // A proposal's userId can point to a User whose email differs in casing
  // (or, in theory, whose clientEmail was never updated) — fold those in too.
  for (const p of proposals) {
    if (!p.userId) continue;
    const owner = userById.get(p.userId);
    if (!owner) continue;
    const key = lc(owner.email);
    if (key === lc(p.clientEmail)) continue; // already added above
    if (!proposalsByEmail.has(key)) proposalsByEmail.set(key, []);
    const list = proposalsByEmail.get(key)!;
    if (!list.some((existing) => existing.id === p.id)) list.push(p);
  }

  const userByEmail = new Map<string, (typeof users)[number]>();
  for (const u of users) userByEmail.set(lc(u.email), u);

  const srByUserId = new Map<string, ServiceRequest[]>();
  for (const sr of serviceRequests) {
    if (!srByUserId.has(sr.userId)) srByUserId.set(sr.userId, []);
    srByUserId.get(sr.userId)!.push(sr);
  }
  const spByUserId = new Map<string, typeof serviceProjects>();
  for (const sp of serviceProjects) {
    if (!spByUserId.has(sp.userId)) spByUserId.set(sp.userId, []);
    spByUserId.get(sp.userId)!.push(sp);
  }

  const entries: ClientDirectoryEntry[] = [];
  for (const email of emails) {
    const user = userByEmail.get(email) ?? null;
    const clientAudits = (auditsByEmail.get(email) ?? []).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const clientProposals = (proposalsByEmail.get(email) ?? []).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const clientServiceRequests = user ? srByUserId.get(user.id) ?? [] : [];
    const clientServiceProjects = user ? spByUserId.get(user.id) ?? [] : [];
    const openSupportCount = user ? openSupportByUserId.get(user.id) ?? 0 : 0;

    const facts = deriveClientFacts({
      user,
      audits: clientAudits,
      proposals: clientProposals,
      serviceRequests: clientServiceRequests,
      serviceProjects: clientServiceProjects,
      openSupportCount,
    });

    entries.push({
      email,
      displayName: facts.displayName,
      companyName: facts.companyName,
      userId: user?.id ?? null,
      role: user?.role ?? null,
      stage: facts.stage,
      stageLabel: facts.stageLabel,
      services: facts.services,
      mrrCents: facts.mrrCents,
      setupCents: facts.setupCents,
      lastActivityAt: facts.lastActivityAt,
      outstandingActions: facts.outstandingActions,
      counts: {
        audits: clientAudits.length,
        proposals: clientProposals.length,
        serviceRequests: clientServiceRequests.length,
        serviceProjects: clientServiceProjects.length,
      },
    });
  }

  return entries.sort((a, b) => {
    const at = a.lastActivityAt?.getTime() ?? 0;
    const bt = b.lastActivityAt?.getTime() ?? 0;
    return bt - at;
  });
}

/* ---------------------------------------------------------------------- */
/* Single-identity profile                                                 */
/* ---------------------------------------------------------------------- */

export type ClientProfileMessage = ServiceMessage & {
  projectId: string;
  projectTitle: string;
  senderName: string | null;
  senderEmail: string;
};

export type ClientActivityEvent = {
  id: string;
  label: string;
  at: Date;
  href: string;
};

export type ClientProfile = {
  email: string;
  displayName: string;
  companyName: string | null;
  userId: string | null;
  role: "CLIENT" | "ADMIN" | null;
  userCreatedAt: Date | null;
  stage: ClientStage;
  stageLabel: string;
  services: string[];
  mrrCents: number;
  setupCents: number;
  lastActivityAt: Date | null;
  outstandingActions: string[];
  audits: AuditRequest[];
  proposals: Proposal[];
  serviceRequests: ServiceRequest[];
  serviceProjects: (ServiceProject & { catalogService: { title: string } | null })[];
  messages: ClientProfileMessage[];
  supportRequests: SupportRequest[];
  activity: ClientActivityEvent[];
};

/** Looks up one merged client identity by (already lowercased, already
    decoded) email. Returns null if the email resolves to zero rows across
    all three source tables — callers should turn that into a 404. Every
    query here is independently scoped to this one email/userId; nothing is
    fetched more broadly and filtered client-side. */
export async function getClientProfileByEmail(emailRaw: string): Promise<ClientProfile | null> {
  const email = lc(emailRaw);
  if (!email || !email.includes("@")) return null;

  const [user, audits, proposalsByEmail] = await Promise.all([
    db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }),
    db.auditRequest.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
    }),
    db.proposal.findMany({
      where: { clientEmail: { equals: email, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  let proposals = proposalsByEmail;
  if (user) {
    const byUserId = await db.proposal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    const seen = new Set(proposals.map((p) => p.id));
    for (const p of byUserId) {
      if (!seen.has(p.id)) {
        proposals.push(p);
        seen.add(p.id);
      }
    }
    proposals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  if (!user && audits.length === 0 && proposals.length === 0) return null;

  const [serviceRequests, serviceProjectsRaw, supportRequests] = user
    ? await Promise.all([
        db.serviceRequest.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
        db.serviceProject.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          include: {
            catalogService: { select: { title: true } },
            requirements: { where: { status: "MISSING" }, select: { status: true } },
            messages: {
              orderBy: { createdAt: "asc" },
              include: { sender: { select: { name: true, email: true } } },
            },
          },
        }),
        db.supportRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
      ])
    : [[] as ServiceRequest[], [] as never[], [] as SupportRequest[]];

  const serviceProjects = serviceProjectsRaw as (ServiceProject & {
    catalogService: { title: string } | null;
    requirements: { status: string }[];
    messages: (ServiceMessage & { sender: { name: string | null; email: string } })[];
  })[];

  const openSupportCount = supportRequests.filter((s) =>
    ["OPEN", "IN_PROGRESS", "WAITING_CLIENT"].includes(s.status)
  ).length;

  const facts = deriveClientFacts({
    user,
    audits,
    proposals,
    serviceRequests,
    serviceProjects,
    openSupportCount,
  });

  const messages: ClientProfileMessage[] = [];
  for (const sp of serviceProjects) {
    for (const m of sp.messages) {
      messages.push({
        ...m,
        projectId: sp.id,
        projectTitle: sp.title,
        senderName: m.sender.name,
        senderEmail: m.sender.email,
      });
    }
  }
  messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Per-client activity feed — a filtered slice of the same kind of
  // merged-timestamp approach dashboard-metrics.ts's getRecentActivity
  // uses, built directly from rows already fetched above (no extra queries).
  const activity: ClientActivityEvent[] = [];
  for (const a of audits) {
    activity.push({ id: `audit-${a.id}`, label: "Audit submitted", at: a.createdAt, href: `/admin/audits/${a.id}` });
  }
  for (const p of proposals) {
    if (p.sentAt) {
      activity.push({ id: `proposal-sent-${p.id}`, label: "Proposal sent", at: p.sentAt, href: `/admin/proposals/${p.id}` });
    } else {
      activity.push({ id: `proposal-created-${p.id}`, label: "Proposal drafted", at: p.createdAt, href: `/admin/proposals/${p.id}` });
    }
  }
  for (const sr of serviceRequests) {
    activity.push({
      id: `sr-${sr.id}`,
      label: `Service request updated (${sr.status})`,
      at: sr.updatedAt,
      href: "/admin/service-requests",
    });
  }
  for (const sp of serviceProjects) {
    activity.push({ id: `sp-${sp.id}`, label: `Project created: ${sp.title}`, at: sp.createdAt, href: "/admin/service-requests" });
  }
  for (const m of messages) {
    activity.push({
      id: `message-${m.id}`,
      label: m.senderRole === "CLIENT" ? "Client sent a message" : "Admin replied to client",
      at: m.createdAt,
      href: "/admin/service-requests",
    });
  }
  for (const s of supportRequests) {
    activity.push({ id: `support-${s.id}`, label: `Support request: ${s.subject}`, at: s.createdAt, href: "/admin/service-requests" });
  }
  activity.sort((a, b) => b.at.getTime() - a.at.getTime());

  return {
    email,
    displayName: facts.displayName,
    companyName: facts.companyName,
    userId: user?.id ?? null,
    role: user?.role ?? null,
    userCreatedAt: user?.createdAt ?? null,
    stage: facts.stage,
    stageLabel: facts.stageLabel,
    services: facts.services,
    mrrCents: facts.mrrCents,
    setupCents: facts.setupCents,
    lastActivityAt: facts.lastActivityAt,
    outstandingActions: facts.outstandingActions,
    audits,
    proposals,
    serviceRequests,
    serviceProjects,
    messages,
    supportRequests,
    activity,
  };
}
