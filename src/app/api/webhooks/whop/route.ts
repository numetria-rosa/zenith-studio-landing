import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import type { Payment, Membership } from "@whop/sdk/resources.js";
import { getWhopClient } from "@/lib/whop";
import { db } from "@/lib/db";
import { courseIdForWhopProductId } from "@/lib/courses";
import { serviceKindForWhopPlanId } from "@/lib/services";
import { generateStrongPassword, encryptPassword } from "@/lib/password";

/* Zenith Lab — Whop webhook handler.
   Implements whop-checkout-links-and-webhooks.md §3.3/§3.7 exactly:
     - raw body passed to unwrap() BEFORE any JSON parsing (parsing first
       breaks signature verification)
     - unwrap() throws on a bad signature -> caught -> 400, payload never trusted
     - idempotent on Whop's `webhook-id` (at-least-once delivery, doc §3.7)
     - responds fast; this course's traffic doesn't yet need a queue/waitUntil */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers);

  const whop = getWhopClient();
  let event: Awaited<ReturnType<typeof whop.webhooks.unwrap>>;
  try {
    event = whop.webhooks.unwrap(rawBody, { headers });
  } catch (err) {
    console.error("[whop webhook] rejected — signature verification failed:", err);
    return new Response("invalid signature", { status: 400 });
  }

  try {
    // Idempotency + correctness together, atomically: the WebhookEvent insert
    // and the business-logic writes commit or roll back as one unit. If this
    // event id already exists, the insert conflicts immediately and nothing
    // below re-runs (a retried delivery reuses the same webhook-id — doc §3.7).
    // If business logic throws, the WHOLE transaction rolls back — including
    // the WebhookEvent row — so a genuine Whop retry can actually reprocess it,
    // rather than silently no-op'ing on a delivery we never actually handled.
    await db.$transaction(async (tx) => {
      await tx.webhookEvent.create({
        data: { id: event.id, type: event.type, payload: event as unknown as Prisma.InputJsonValue },
      });

      if (event.type === "payment.succeeded") {
        await handlePaymentSucceeded(tx, event.data);
      } else if (event.type === "membership.deactivated") {
        await handleMembershipDeactivated(tx, event.data);
      }
      // Every other subscribed-or-not event type is accepted and ignored —
      // the WebhookEvent row is still recorded for audit/debug visibility.
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Unique constraint on WebhookEvent.id -> this exact delivery was already
      // processed (or is currently being processed by a concurrent retry).
      // Per doc §3.7, that's the expected, correct outcome of at-least-once
      // delivery — not an error.
      return new Response("OK", { status: 200 });
    }
    console.error("[whop webhook] processing failed, will let Whop retry:", err);
    return new Response("processing failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}

type Tx = Prisma.TransactionClient;

async function handlePaymentSucceeded(tx: Tx, payment: Payment) {
  const productId = payment.product?.id;
  const courseId = productId ? courseIdForWhopProductId(productId) : null;
  const serviceMatch = courseId ? null : serviceKindForWhopPlanId(payment.plan?.id);

  if (!courseId && !serviceMatch) {
    // Doc's "safely rejected/logged rather than granting random access"
    // (Phase 14) — an unrecognized product/plan must never grant anything.
    console.warn(
      `[whop webhook] payment.succeeded for unmapped product "${productId ?? "unknown"}" / plan "${payment.plan?.id ?? "unknown"}" ` +
        `— no entitlement or service request created. Check the WHOP_*_ID env vars against courses.ts / services.ts.`
    );
    return;
  }

  const whopUserId = payment.user?.id ?? null;
  const email = payment.user?.email ?? null;
  const name = payment.user?.name ?? null;

  if (!email && !whopUserId) {
    console.error("[whop webhook] payment.succeeded has no user id or email — cannot resolve an account", payment.id);
    return;
  }

  const user = await findOrCreateUser(tx, whopUserId, email, name);
  await createPurchaseClaim(tx, user.id, payment.id);

  if (courseId) {
    await tx.courseEntitlement.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      create: {
        userId: user.id,
        courseId,
        status: "active",
        source: "whop",
        whopMembershipId: payment.membership?.id ?? null,
        whopPaymentId: payment.id,
      },
      update: {
        status: "active",
        revokedAt: null,
        whopMembershipId: payment.membership?.id ?? undefined,
        whopPaymentId: payment.id,
      },
    });
    return;
  }

  // serviceMatch is non-null here (the !courseId && !serviceMatch check above returned already otherwise)
  const { serviceId, kind } = serviceMatch!;
  if (kind === "setup") {
    // Create at "new" if this is the first purchase; if a request already
    // exists (re-purchase, or the monthly plan created it first), leave
    // build `status` alone — a setup re-buy shouldn't reset progress.
    await tx.serviceRequest.upsert({
      where: { userId_serviceId: { userId: user.id, serviceId } },
      create: {
        userId: user.id,
        serviceId,
        status: "new",
        whopSetupPaymentId: payment.id,
        whopSetupMembershipId: payment.membership?.id ?? null,
      },
      update: {
        whopSetupPaymentId: payment.id,
        whopSetupMembershipId: payment.membership?.id ?? undefined,
      },
    });
  } else {
    await tx.serviceRequest.upsert({
      where: { userId_serviceId: { userId: user.id, serviceId } },
      create: {
        userId: user.id,
        serviceId,
        status: "new",
        monthlyStatus: "active",
        whopMonthlyMembershipId: payment.membership?.id ?? null,
      },
      update: {
        monthlyStatus: "active",
        whopMonthlyMembershipId: payment.membership?.id ?? undefined,
      },
    });
  }
}

async function handleMembershipDeactivated(tx: Tx, membership: Membership) {
  const courseResult = await tx.courseEntitlement.updateMany({
    where: { whopMembershipId: membership.id, status: "active" },
    data: { status: "revoked", revokedAt: new Date() },
  });

  const serviceResult = await tx.serviceRequest.updateMany({
    where: { whopMonthlyMembershipId: membership.id, monthlyStatus: "active" },
    data: { monthlyStatus: "canceled" }, // build `status` is untouched — a lapsed retainer doesn't erase what was built
  });

  if (courseResult.count === 0 && serviceResult.count === 0) {
    console.warn(`[whop webhook] membership.deactivated for ${membership.id} matched no active entitlement or service request`);
  }
}

async function findOrCreateUser(
  tx: Tx,
  whopUserId: string | null,
  email: string | null,
  name: string | null
) {
  if (whopUserId) {
    const byWhopId = await tx.user.findUnique({ where: { whopUserId } });
    if (byWhopId) return byWhopId;
  }
  if (email) {
    const byEmail = await tx.user.findUnique({ where: { email } });
    if (byEmail) {
      // Backfill the stronger identity (Phase 5) the first time we see it.
      if (whopUserId && !byEmail.whopUserId) {
        return tx.user.update({ where: { id: byEmail.id }, data: { whopUserId } });
      }
      return byEmail;
    }
  }
  if (!email) {
    throw new Error("Cannot create a user from a payment with no email and no existing whopUserId match");
  }
  return tx.user.create({ data: { email, whopUserId: whopUserId ?? undefined, name: name ?? undefined } });
}

/* Gives every buyer a real password the moment they pay (first purchase
   only — later repeat purchases reuse the existing one, and a self-chosen
   change on /profile is never overwritten) and drops a claim row keyed by
   this exact payment id. /api/auth/claim reads that row when the buyer's
   browser bounces back from Whop's checkout redirect, so they land on
   /dashboard already signed in with no email round-trip required. */
async function createPurchaseClaim(tx: Tx, userId: string, paymentId: string) {
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

  if (!user.passwordEnc) {
    await tx.user.update({ where: { id: userId }, data: { passwordEnc: encryptPassword(generateStrongPassword()) } });
  }

  await tx.purchaseClaim.upsert({
    where: { paymentId },
    create: { paymentId, userId, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    update: {}, // a retried webhook delivery must never regenerate/overwrite an already-issued claim
  });
}
