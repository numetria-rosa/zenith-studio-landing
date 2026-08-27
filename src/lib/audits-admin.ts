import { db } from "@/lib/db";
import { AuditStatus, FindingSeverity, RecommendationPriority } from "@prisma/client";

/* Shared by /admin/audits/[id]'s server actions (Slice 4 of the
   service-platform build, 2026-08-28). Matches service-requests-admin.ts's
   own convention: validate + write here, callers are responsible for
   requireAdmin() first — none of these functions check authorization
   themselves. */

export const AUDIT_STATUSES: AuditStatus[] = [
  "SUBMITTED",
  "IN_REVIEW",
  "PROPOSAL_SENT",
  "ACCEPTED",
  "DECLINED",
];

export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In review",
  PROPOSAL_SENT: "Proposal sent",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
};

export function isAuditStatus(v: string): v is AuditStatus {
  return (AUDIT_STATUSES as readonly string[]).includes(v);
}

export const FINDING_SEVERITIES: FindingSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const FINDING_SEVERITY_LABELS: Record<FindingSeverity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export function isFindingSeverity(v: string): v is FindingSeverity {
  return (FINDING_SEVERITIES as readonly string[]).includes(v);
}

export const RECOMMENDATION_PRIORITIES: RecommendationPriority[] = ["LOW", "MEDIUM", "HIGH"];

export const RECOMMENDATION_PRIORITY_LABELS: Record<RecommendationPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export function isRecommendationPriority(v: string): v is RecommendationPriority {
  return (RECOMMENDATION_PRIORITIES as readonly string[]).includes(v);
}

export async function updateAuditStatusAsAdmin(
  id: string,
  status: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isAuditStatus(status)) return { ok: false, error: `invalid status "${status}"` };
  await db.auditRequest.update({ where: { id }, data: { status } });
  return { ok: true };
}

export type NewFindingInput = {
  auditId: string;
  title: string;
  severity: string;
  description: string;
  currentImpact: string;
  recommendedSolution: string;
};

export async function addFindingAsAdmin(
  input: NewFindingInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { auditId, title, severity, description, currentImpact, recommendedSolution } = input;
  if (!title.trim()) return { ok: false, error: "title is required" };
  if (!isFindingSeverity(severity)) return { ok: false, error: `invalid severity "${severity}"` };
  if (!description.trim()) return { ok: false, error: "description is required" };
  if (!currentImpact.trim()) return { ok: false, error: "currentImpact is required" };
  if (!recommendedSolution.trim()) return { ok: false, error: "recommendedSolution is required" };

  const audit = await db.auditRequest.findUnique({ where: { id: auditId }, select: { id: true } });
  if (!audit) return { ok: false, error: "audit not found" };

  await db.auditFinding.create({
    data: { auditId, title: title.trim(), severity, description, currentImpact, recommendedSolution },
  });
  return { ok: true };
}

export type NewRecommendationInput = {
  auditId: string;
  title: string;
  priority: string;
  rationale: string;
  expectedOutcome: string;
  estimatedEffort: string;
  catalogServiceId?: string;
};

export async function addRecommendationAsAdmin(
  input: NewRecommendationInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { auditId, title, priority, rationale, expectedOutcome, estimatedEffort } = input;
  const catalogServiceId = input.catalogServiceId?.trim() || undefined;

  if (!title.trim()) return { ok: false, error: "title is required" };
  if (!isRecommendationPriority(priority)) return { ok: false, error: `invalid priority "${priority}"` };
  if (!rationale.trim()) return { ok: false, error: "rationale is required" };
  if (!expectedOutcome.trim()) return { ok: false, error: "expectedOutcome is required" };
  if (!estimatedEffort.trim()) return { ok: false, error: "estimatedEffort is required" };

  const audit = await db.auditRequest.findUnique({ where: { id: auditId }, select: { id: true } });
  if (!audit) return { ok: false, error: "audit not found" };

  if (catalogServiceId) {
    const service = await db.serviceCatalog.findUnique({ where: { id: catalogServiceId }, select: { id: true } });
    if (!service) return { ok: false, error: "catalog service not found" };
  }

  await db.auditRecommendation.create({
    data: {
      auditId,
      title: title.trim(),
      priority,
      rationale,
      expectedOutcome,
      estimatedEffort: estimatedEffort.trim(),
      catalogServiceId: catalogServiceId ?? null,
    },
  });
  return { ok: true };
}
