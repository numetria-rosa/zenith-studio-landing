import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { findOrCreateUserByEmail } from "@/lib/users";
import { createServiceProjectWithDefaults } from "@/lib/service-projects";
import { computeApprovedTotals, createProposalCheckout, isProposalPaymentMode } from "@/lib/proposal-payments";

/* Token-secured client-facing proposal lookup (Slice 5 of the
   service-platform build, 2026-08-28). Modeled on PurchaseClaim's pattern
   (src/app/api/auth/claim/route.ts): the accessToken IS the entire security
   mechanism, no session/signin required. Every caller — the page's own GET
   render AND every one of the three response server actions — must call
   this function fresh; nothing here is ever cached or trusted from an
   earlier call in the same request lifecycle.

   A wrong/malformed token, a well-formed-but-nonexistent token, an expired
   proposal, and a not-yet-sent (DRAFT) proposal's token all resolve to the
   exact same `null` here — the caller renders one identical "invalid or
   expired" state for all four cases, so none of them is distinguishable
   from outside. */
export async function resolveProposalByToken(token: string | null | undefined) {
  if (!token || typeof token !== "string" || token.length < 10) return null;

  const proposal = await db.proposal.findUnique({
    where: { accessToken: token },
    include: { items: { orderBy: { order: "asc" } }, approvals: { orderBy: { respondedAt: "asc" } } },
  });
  if (!proposal) return null;

  // DRAFT proposals were never sent — an admin may not have finished
  // writing them, and a leaked draft-stage link should not be inspectable.
  if (proposal.status === "DRAFT") return null;

  if (proposal.expiresAt && proposal.expiresAt < new Date()) return null;

  return proposal;
}

/** Called once per GET of the public view. Only bumps SENT -> VIEWED and
    only sets viewedAt the first time (viewedAt currently null) — never
    downgrades a proposal that's already APPROVED/CHANGES_REQUESTED/DECLINED
    back to VIEWED just because the client reloaded the page. */
export async function markProposalViewed(id: string) {
  const proposal = await db.proposal.findUnique({ where: { id }, select: { viewedAt: true, status: true } });
  if (!proposal) return;
  if (proposal.viewedAt) return;

  await db.proposal.update({
    where: { id },
    data: {
      viewedAt: new Date(),
      status: proposal.status === "SENT" ? "VIEWED" : undefined,
    },
  });
}

/** Best-effort — never throws, never blocks the caller on failing to
    obtain a real client IP. */
export function getClientIp(headerBag: Headers): string | null {
  try {
    const forwarded = headerBag.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return headerBag.get("x-real-ip");
  } catch {
    return null;
  }
}

export type ClientResponseAction = "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";

const ACTION_TO_STATUS: Record<ClientResponseAction, Prisma.ProposalUpdateInput["status"]> = {
  APPROVED: "APPROVED",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  REJECTED: "DECLINED",
};

/** Re-validates the token itself — never trusts that the caller already
    validated it via a prior page render. Refuses to record a second
    decision once one of APPROVED/CHANGES_REQUESTED/DECLINED is already
    live on the proposal record.

    selectedAddOnItemIds/paymentMode only matter for action === "APPROVED"
    — CHANGES_REQUESTED/REJECTED ignore them entirely. When the approved
    total has a recurring (MONTHLY-kind) component, paymentMode is
    required: the client is choosing, at the moment they approve, whether
    to pay setup now and the monthly plan later (SPLIT, surfaced once an
    admin marks the project LIVE) or both right now (BUNDLED, one Whop
    checkout). See src/lib/proposal-payments.ts for what each mode actually
    creates. */
export async function recordClientResponse(
  token: string,
  action: ClientResponseAction,
  note: string | null,
  ipAddress: string | null,
  selectedAddOnItemIds: string[] = [],
  paymentMode: string | null = null
): Promise<{ ok: true; setupCheckoutUrl: string | null } | { ok: false; error: string }> {
  const proposal = await resolveProposalByToken(token);
  if (!proposal) return { ok: false, error: "invalid or expired link" };

  if (["APPROVED", "CHANGES_REQUESTED", "DECLINED"].includes(proposal.status)) {
    return { ok: false, error: "a decision has already been recorded for this proposal" };
  }

  if (action === "CHANGES_REQUESTED" && !note?.trim()) {
    return { ok: false, error: "a note is required when requesting changes" };
  }

  // Only real, real add-on item ids on THIS proposal can be selected — a
  // tampered form submission naming another proposal's item id (or
  // anything else) is silently dropped rather than trusted.
  const realAddOnIds = new Set(proposal.items.filter((i) => i.isOptionalAddOn).map((i) => i.id));
  const validSelectedAddOnIds = selectedAddOnItemIds.filter((id) => realAddOnIds.has(id));

  let setupCents = 0;
  let monthlyCents = 0;
  if (action === "APPROVED") {
    const totals = computeApprovedTotals(proposal.items, validSelectedAddOnIds);
    setupCents = totals.setupCents;
    monthlyCents = totals.monthlyCents;
    if (monthlyCents > 0 && !(paymentMode && isProposalPaymentMode(paymentMode))) {
      return { ok: false, error: "choose how you'd like to pay before approving" };
    }
  }
  const resolvedPaymentMode = monthlyCents > 0 && paymentMode && isProposalPaymentMode(paymentMode) ? paymentMode : null;

  await db.$transaction(async (tx) => {
    await tx.clientApproval.create({
      data: {
        proposalId: proposal.id,
        action,
        note: note?.trim() || null,
        ipAddress,
      },
    });
    await tx.proposal.update({
      where: { id: proposal.id },
      data: {
        status: ACTION_TO_STATUS[action],
        ...(action === "APPROVED"
          ? { selectedAddOnItemIds: validSelectedAddOnIds, paymentMode: resolvedPaymentMode }
          : {}),
      },
    });

    // Trigger 1 (Slice 6, 2026-08-28): an approved proposal automatically
    // creates the client's ServiceProject workspace, in the same
    // transaction as the approval itself. This does NOT require a real
    // Whop payment to have occurred — today, the actual payment for a
    // proposal-driven engagement still happens by some other means (bank
    // transfer, invoice, a manually-shared Whop link); this only makes
    // approval create the workspace, not payment.
    if (action === "APPROVED") {
      const user = await findOrCreateUserByEmail(tx, proposal.clientEmail, proposal.clientName);

      // Backfill Proposal.userId the first time a real account is tied to
      // it, mirroring the webhook's own "backfill the stronger identity
      // the first time we see it" convention.
      if (!proposal.userId) {
        await tx.proposal.update({ where: { id: proposal.id }, data: { userId: user.id } });
      }

      const primaryItem = proposal.items.find((i) => i.catalogServiceId) ?? proposal.items[0];
      const title = primaryItem?.label || proposal.companyName || proposal.clientName || "Service Engagement";

      await createServiceProjectWithDefaults(tx, {
        userId: user.id,
        title,
        catalogServiceId: primaryItem?.catalogServiceId ?? null,
        proposalId: proposal.id,
      });
    }
  });

  // Whop plan creation is a real network call — deliberately outside the
  // DB transaction above so a slow/flaky Whop API response never holds a
  // Postgres transaction open. If it throws, the approval itself has
  // already committed; the client just won't see a checkout link on this
  // exact render (the page's own fallback — deriving a URL from a stored
  // plan id — simply has nothing to derive yet). Not retried automatically
  // here; an admin can be asked to re-trigger if this ever actually fails.
  let setupCheckoutUrl: string | null = null;
  if (action === "APPROVED" && setupCents > 0) {
    const reference = proposal.id.slice(-8).toUpperCase();
    const mode = resolvedPaymentMode ?? "SPLIT"; // monthlyCents === 0 here means mode is irrelevant to createProposalCheckout
    const result = await createProposalCheckout(proposal.id, reference, setupCents, monthlyCents, mode);
    setupCheckoutUrl = result.setupCheckoutUrl;
  }

  return { ok: true, setupCheckoutUrl };
}
