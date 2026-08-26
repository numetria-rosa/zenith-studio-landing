import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionForUser } from "@/lib/session";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* Whop's hosted checkout redirects the buyer's browser here with
   ?status=success&payment_id=pay_XXX (confirmed against Whop's own docs —
   status is always present, payment_id only on success). This is the other
   half of the webhook's createPurchaseClaim(): the webhook is the trusted
   write path (signature-verified), this route only ever reads what it
   already wrote, keyed by the same Whop payment id. Set this URL as the
   plan's "Checkout redirect" in the Whop dashboard. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const status = searchParams.get("status");
  const paymentId = searchParams.get("payment_id");

  if (status !== "success" || !paymentId) {
    return NextResponse.redirect(new URL("/sign-in?error=payment", origin));
  }

  // The webhook and this redirect race each other off the same Whop event;
  // the browser often lands here first. A few short retries covers the
  // normal case without holding the buyer on a spinner for long.
  let claim = null;
  for (let attempt = 0; attempt < 6 && !claim; attempt++) {
    if (attempt > 0) await sleep(1000);
    claim = await db.purchaseClaim.findUnique({ where: { paymentId } });
  }

  if (!claim || claim.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/sign-in?error=claim_expired", origin));
  }

  if (!claim.claimedAt) {
    await db.purchaseClaim.update({ where: { id: claim.id }, data: { claimedAt: new Date() } });
  }

  await createSessionForUser(claim.userId);
  return NextResponse.redirect(new URL("/welcome", origin));
}
