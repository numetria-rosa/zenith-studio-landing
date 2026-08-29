import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { Prisma, ProposalItemKind } from "@prisma/client";
import { renderProposalPdfBuffer, proposalPdfFilename } from "@/lib/proposal-pdf";
import { sendProposalEmail } from "@/lib/mail";

/* Shared by /admin/audits/[id]'s "Create Proposal" action and
   /admin/proposals/[id]'s builder server actions (Slice 5 of the
   service-platform build, 2026-08-28). Matches audits-admin.ts's and
   service-requests-admin.ts's own convention: validate + write here,
   callers are responsible for requireAdmin() first — none of these
   functions check authorization themselves. */

export const PROPOSAL_ITEM_KINDS: ProposalItemKind[] = ["SETUP", "MONTHLY", "PER_UNIT", "CUSTOM", "DISCOUNT"];

export const PROPOSAL_ITEM_KIND_LABELS: Record<ProposalItemKind, string> = {
  SETUP: "Setup fee",
  MONTHLY: "Monthly fee",
  PER_UNIT: "Per-unit fee",
  CUSTOM: "Custom line item",
  DISCOUNT: "Discount",
};

export function isProposalItemKind(v: string): v is ProposalItemKind {
  return (PROPOSAL_ITEM_KINDS as readonly string[]).includes(v);
}

/** 24 random bytes, hex-encoded (48 chars) — the entire security mechanism
    for the client-facing link, modeled directly on PurchaseClaim's
    token-based pattern (see src/app/api/auth/claim/route.ts). */
export function generateAccessToken(): string {
  return randomBytes(24).toString("hex");
}

const PROPOSAL_TEXT_SECTION_KEYS = [
  "executiveSummary",
  "currentChallenges",
  "recommendedSolution",
  "scopeOfWork",
  "deliverables",
  "implementationPlan",
  "timeline",
  "assumptions",
  "notIncluded",
  "nextSteps",
  "terms",
] as const;
export type ProposalTextSectionKey = (typeof PROPOSAL_TEXT_SECTION_KEYS)[number];

export const PROPOSAL_SECTION_LABELS: Record<ProposalTextSectionKey, string> = {
  executiveSummary: "Executive summary",
  currentChallenges: "Current challenges",
  recommendedSolution: "Recommended solution",
  scopeOfWork: "Scope of work",
  deliverables: "Deliverables",
  implementationPlan: "Implementation plan",
  timeline: "Timeline",
  assumptions: "Assumptions",
  notIncluded: "What is not included",
  nextSteps: "Next steps",
  terms: "Terms",
};

/** Creates a new DRAFT Proposal from an existing AuditRequest — the only
    entry point this slice's UI has. Backfills clientEmail/clientName/
    companyName from the audit, seeds narrative sections from findings/
    recommendations when present, and creates SETUP/MONTHLY line items
    from any recommendation linked to a ServiceCatalog row with prices. */
export async function createProposalFromAudit(
  auditId: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const audit = await db.auditRequest.findUnique({
    where: { id: auditId },
    include: {
      findings: { orderBy: { createdAt: "asc" } },
      recommendations: {
        orderBy: { createdAt: "asc" },
        include: {
          catalogService: {
            select: {
              id: true,
              title: true,
              setupPriceCents: true,
              monthlyPriceCents: true,
            },
          },
        },
      },
    },
  });
  if (!audit) return { ok: false, error: "audit not found" };

  const company = audit.companyName?.trim() || audit.name?.trim() || "your business";
  const sections = buildProposalSectionsFromAudit({
    company,
    findings: audit.findings,
    recommendations: audit.recommendations,
  });

  const itemsData: Prisma.ProposalItemCreateWithoutProposalInput[] = [];
  let order = 0;
  const seenCatalogIds = new Set<string>();

  for (const rec of audit.recommendations) {
    const catalog = rec.catalogService;
    if (!catalog || seenCatalogIds.has(catalog.id)) continue;
    seenCatalogIds.add(catalog.id);

    if (catalog.setupPriceCents != null && catalog.setupPriceCents !== 0) {
      itemsData.push({
        label: `${catalog.title} setup`,
        kind: "SETUP",
        amountCents: catalog.setupPriceCents,
        catalogService: { connect: { id: catalog.id } },
        order: order++,
      });
    }
    if (catalog.monthlyPriceCents != null && catalog.monthlyPriceCents !== 0) {
      itemsData.push({
        label: `${catalog.title} monthly`,
        kind: "MONTHLY",
        amountCents: catalog.monthlyPriceCents,
        catalogService: { connect: { id: catalog.id } },
        order: order++,
      });
    }
  }

  const proposal = await db.proposal.create({
    data: {
      auditId: audit.id,
      clientEmail: audit.email,
      clientName: audit.name,
      companyName: audit.companyName,
      accessToken: generateAccessToken(),
      ...sections,
      items: itemsData.length > 0 ? { create: itemsData } : undefined,
    },
    select: { id: true },
  });
  return { ok: true, id: proposal.id };
}

type AuditFindingLike = {
  title: string;
  severity: string;
  description: string;
  currentImpact: string;
  recommendedSolution: string;
};

type AuditRecommendationLike = {
  title: string;
  priority: string;
  rationale: string;
  expectedOutcome: string;
  estimatedEffort: string;
  catalogService: { title: string } | null;
};

/** Builds editable starting copy for a proposal from audit review data.
    Admin can rewrite every field afterward — this only kills the blank page. */
export function buildProposalSectionsFromAudit(input: {
  company: string;
  findings: AuditFindingLike[];
  recommendations: AuditRecommendationLike[];
}): Record<ProposalTextSectionKey, string> {
  const { company, findings, recommendations } = input;

  const currentChallenges =
    findings.length > 0
      ? findings
          .map(
            (f) =>
              `• ${f.title} (${f.severity})\n${f.description.trim()}\nImpact: ${f.currentImpact.trim()}`
          )
          .join("\n\n")
      : `• Manual / slow processes that cost ${company} time every week\n• Leads and enquiries that go unanswered outside business hours\n• No reliable system of record for follow-up`;

  const recommendedSolution =
    recommendations.length > 0
      ? recommendations
          .map((r) => {
            const catalog = r.catalogService ? ` (via ${r.catalogService.title})` : "";
            return `• ${r.title}${catalog}\n${r.rationale.trim()}\nExpected outcome: ${r.expectedOutcome.trim()}\nEffort: ${r.estimatedEffort.trim()}`;
          })
          .join("\n\n")
      : `We recommend a done-for-you automation build tailored to ${company}'s current tools and workflow, with hosting and ongoing improvements included in the monthly plan.`;

  const scopeLines =
    recommendations.length > 0
      ? recommendations.map((r) => `• ${r.title}`).join("\n")
      : `• Discovery and workflow mapping\n• Build and connect the automation to your existing tools\n• Test, handoff, and first-week support`;

  const deliverables =
    recommendations.length > 0
      ? recommendations.map((r) => `• ${r.title}: live and documented`).join("\n")
      : `• Working automation live in your stack\n• Short handoff doc / loom of how it works\n• Access to your project workspace for ongoing requests`;

  return {
    executiveSummary: `Based on our review of ${company}, we've identified ${findings.length || "several"} operational bottleneck${findings.length === 1 ? "" : "s"} and recommend a focused automation build so the team spends less time on repetitive work and more time on revenue.`,
    currentChallenges,
    recommendedSolution,
    scopeOfWork: `In scope for this engagement:\n${scopeLines}`,
    deliverables,
    implementationPlan: `1. Kickoff and collect access / brand / workflow details\n2. Build and connect integrations\n3. Internal QA against your real scenarios\n4. Go-live and handoff\n5. Monthly monitoring and improvements`,
    timeline: `Typically 2–7 days from kickoff to live, depending on access turnaround and how many systems we need to connect.`,
    assumptions: `• You can provide timely access to the tools we need to connect\n• A single point of contact is available for questions during build\n• Scope matches the line items in this proposal; out-of-scope work is quoted separately`,
    notIncluded: `• Custom software products unrelated to the automations listed\n• Ongoing content creation or human VA work\n• Third-party SaaS subscription fees (billed by those vendors directly)`,
    nextSteps: `1. Approve this proposal (and choose payment mode if there is a monthly component)\n2. Complete payment for the setup fee\n3. Fill in the project requirements checklist so we can start build`,
    terms: `Setup is due on approval. Monthly covers hosting, monitoring, and ongoing improvements and can be cancelled anytime. Work already delivered remains yours.`,
  };
}

export type ProposalSectionsInput = Partial<Record<ProposalTextSectionKey, string>> & {
  clientEmail?: string;
  clientName?: string;
  companyName?: string;
  /** Date-only string (yyyy-mm-dd, from an <input type="date">) or "" to
      clear. Added in Slice 5 of the admin command center (2026-08-28) —
      expiresAt existed on the schema and was already enforced by
      resolveProposalByToken in proposals-public.ts, but nothing in the
      admin UI could ever set it. This is the smallest addition that closes
      that gap without touching the token-resolution logic itself. */
  expiresAt?: string;
};

export async function updateProposalSectionsAsAdmin(
  id: string,
  input: ProposalSectionsInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const proposal = await db.proposal.findUnique({ where: { id }, select: { id: true } });
  if (!proposal) return { ok: false, error: "proposal not found" };

  if (input.clientEmail !== undefined && !input.clientEmail.trim()) {
    return { ok: false, error: "clientEmail cannot be empty" };
  }

  const data: Prisma.ProposalUpdateInput = {};
  if (input.clientEmail !== undefined) data.clientEmail = input.clientEmail.trim();
  if (input.clientName !== undefined) data.clientName = input.clientName.trim() || null;
  if (input.companyName !== undefined) data.companyName = input.companyName.trim() || null;
  for (const key of PROPOSAL_TEXT_SECTION_KEYS) {
    if (input[key] !== undefined) data[key] = input[key] ?? "";
  }
  if (input.expiresAt !== undefined) {
    if (!input.expiresAt.trim()) {
      data.expiresAt = null;
    } else {
      const parsed = new Date(`${input.expiresAt.trim()}T23:59:59.000Z`);
      if (Number.isNaN(parsed.getTime())) return { ok: false, error: "invalid expiry date" };
      data.expiresAt = parsed;
    }
  }

  await db.proposal.update({ where: { id }, data });
  return { ok: true };
}

export type NewProposalItemInput = {
  proposalId: string;
  label: string;
  kind: string;
  amountDollars: string;
  unitLabel?: string;
  isOptionalAddOn?: boolean;
  catalogServiceId?: string;
};

export async function addProposalItemAsAdmin(
  input: NewProposalItemInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { proposalId, label, kind, amountDollars } = input;
  if (!label.trim()) return { ok: false, error: "label is required" };
  if (!isProposalItemKind(kind)) return { ok: false, error: `invalid kind "${kind}"` };

  const dollars = Number(amountDollars);
  if (!Number.isFinite(dollars)) return { ok: false, error: "amount must be a number" };
  let amountCents = Math.round(dollars * 100);
  if (kind === "DISCOUNT") amountCents = -Math.abs(amountCents);
  else if (amountCents < 0) return { ok: false, error: "amount cannot be negative except for a discount" };

  const proposal = await db.proposal.findUnique({ where: { id: proposalId }, select: { id: true } });
  if (!proposal) return { ok: false, error: "proposal not found" };

  const catalogServiceId = input.catalogServiceId?.trim() || undefined;
  if (catalogServiceId) {
    const service = await db.serviceCatalog.findUnique({ where: { id: catalogServiceId }, select: { id: true } });
    if (!service) return { ok: false, error: "catalog service not found" };
  }

  const count = await db.proposalItem.count({ where: { proposalId } });

  await db.proposalItem.create({
    data: {
      proposalId,
      label: label.trim(),
      kind,
      amountCents,
      unitLabel: input.unitLabel?.trim() || null,
      isOptionalAddOn: Boolean(input.isOptionalAddOn),
      order: count,
      catalogServiceId: catalogServiceId ?? null,
    },
  });
  return { ok: true };
}

export async function deleteProposalItemAsAdmin(
  itemId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const item = await db.proposalItem.findUnique({ where: { id: itemId }, select: { id: true } });
  if (!item) return { ok: false, error: "item not found" };
  await db.proposalItem.delete({ where: { id: itemId } });
  return { ok: true };
}

/** Full serialized copy of the proposal's content + items, used both for the
    immutable ProposalVersion.snapshot and for the client-facing view. */
async function buildProposalSnapshot(proposalId: string) {
  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!proposal) return null;
  return {
    clientEmail: proposal.clientEmail,
    clientName: proposal.clientName,
    companyName: proposal.companyName,
    sections: Object.fromEntries(PROPOSAL_TEXT_SECTION_KEYS.map((k) => [k, proposal[k]])),
    items: proposal.items.map((i) => ({
      label: i.label,
      kind: i.kind,
      amountCents: i.amountCents,
      unitLabel: i.unitLabel,
      isOptionalAddOn: i.isOptionalAddOn,
      order: i.order,
    })),
  };
}

/** Requires at least an executive summary and one line item — basic sanity
    so an empty proposal can't be sent. Snapshots current state into a new
    ProposalVersion, sets status SENT + sentAt, before/alongside the update.
    Re-sending after edits (status already SENT/VIEWED/etc.) is allowed and
    creates another version — that's the whole point of keeping history. */
export async function sendProposalAsAdmin(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const proposal = await db.proposal.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!proposal) return { ok: false, error: "proposal not found" };
  if (!proposal.executiveSummary?.trim()) {
    return { ok: false, error: "an executive summary is required before sending" };
  }
  if (proposal.items.length === 0) {
    return { ok: false, error: "at least one line item is required before sending" };
  }

  const snapshot = await buildProposalSnapshot(id);
  const lastVersion = await db.proposalVersion.findFirst({
    where: { proposalId: id },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

  await db.$transaction([
    db.proposalVersion.create({
      data: { proposalId: id, versionNumber: nextVersionNumber, snapshot: snapshot as Prisma.InputJsonValue },
    }),
    db.proposal.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    }),
  ]);
  return { ok: true };
}

/** Renders the current proposal to a PDF and emails it to the client via
    Resend, alongside the same client link the "Send to client" button
    already surfaces. Deliberately independent of sendProposalAsAdmin's
    status transition — emailing the PDF doesn't itself change
    DRAFT/SENT/etc., since an admin may want to re-send the PDF (e.g. after
    a client asks for another copy) without creating a new proposal
    version. Same emptiness guard as sendProposalAsAdmin so a blank
    proposal can't go out either way. */
export async function emailProposalPdfAsAdmin(
  id: string,
  publicUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const proposal = await db.proposal.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!proposal) return { ok: false, error: "proposal not found" };
  if (!proposal.executiveSummary?.trim()) {
    return { ok: false, error: "an executive summary is required before emailing" };
  }
  if (proposal.items.length === 0) {
    return { ok: false, error: "at least one line item is required before emailing" };
  }

  const buffer = await renderProposalPdfBuffer(id);
  if (!buffer) return { ok: false, error: "could not render PDF" };

  const filename = proposalPdfFilename(proposal.companyName, proposal.clientName);

  return sendProposalEmail({
    to: proposal.clientEmail,
    clientName: proposal.clientName,
    companyName: proposal.companyName,
    publicUrl,
    pdfBuffer: buffer,
    pdfFilename: filename,
  });
}

export function computeProposalTotals(items: { amountCents: number; isOptionalAddOn: boolean }[]) {
  let coreCents = 0;
  let addOnCents = 0;
  for (const item of items) {
    if (item.isOptionalAddOn) addOnCents += item.amountCents;
    else coreCents += item.amountCents;
  }
  return { coreCents, addOnCents, totalCents: coreCents + addOnCents };
}

/** One-time/setup vs. recurring breakdown for the proposals list (Slice 5
    of the admin command center, 2026-08-28). Reuses computeProposalTotals's
    exact sign convention (DISCOUNT is stored already-negative, so summing
    amountCents directly subtracts it correctly) rather than computing
    totals a second, different way. Scoped to non-add-on items only, same
    as coreCents above — optional add-ons are never counted here either.
    DISCOUNT is folded into the one-time/setup bucket, per this slice's
    brief, since it's most often applied against a setup fee. */
export function computeProposalAmountBreakdown(
  items: { amountCents: number; isOptionalAddOn: boolean; kind: ProposalItemKind }[]
) {
  let oneTimeCents = 0;
  let recurringCents = 0;
  for (const item of items) {
    if (item.isOptionalAddOn) continue;
    if (item.kind === "MONTHLY") recurringCents += item.amountCents;
    else oneTimeCents += item.amountCents; // SETUP, CUSTOM, PER_UNIT, DISCOUNT
  }
  return { oneTimeCents, recurringCents };
}
