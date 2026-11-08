import type { Prisma, PrismaClient } from "@prisma/client";
import { getWhopClient } from "@/lib/whop";
import { db } from "@/lib/db";
import { currencyForWhopPlanId } from "./whop-plans";
import { EXTRA_PACK_PRICE_LOCAL, EXTRA_PACK_REPLIES, extraPackBudgetUsdCents, type PlanCurrency } from "./economics";

type Tx = PrismaClient | Prisma.TransactionClient;

/* Extra AI replies, bought in packs of EXTRA_PACK_REPLIES, one-time, for the current month only (economics.ts has the
   prices and the 60% margin rule). Each purchase is its own Whop checkout, created here with the agency's id in the
   checkout's metadata; Whop copies that metadata onto the payment, and the webhook (api/webhooks/whop) credits the pack
   when the payment succeeds. The pack is a plain one-time plan per currency on its own hidden Whop product
   (scripts/create-whatsapp-umrah-extra-replies-product.mjs and ...-plans.mjs), so it never touches the Starter subscription.
   Docs: docs.whop.com/api-reference/checkout-configurations/create-a-checkout-configuration (inline plan, metadata). */

export const EXTRA_REPLIES_PRODUCT_ID = "prod_cdUFAHRqgjvTU";
export const EXTRA_REPLIES_KIND = "wa_extra_replies";

/** One hidden one-time Whop plan per currency on that product (scripts/create-whatsapp-umrah-extra-replies-plans.mjs),
    priced from EXTRA_PACK_PRICE_LOCAL. Plan ids are public, so they live in code like the Starter plans do. */
export const EXTRA_PACK_PLAN_IDS: Record<PlanCurrency, string> = {
  GBP: "plan_r0tyf8IXdahMZ",
  USD: "plan_9Obi0lJqbSuFc",
  CAD: "plan_sf3pVQ9nQF3tp",
  AUD: "plan_pa7hufGHN0VYk",
  ZAR: "plan_5ATKWORbTZGhr",
};

const CURRENCIES: PlanCurrency[] = ["GBP", "USD", "CAD", "AUD", "ZAR"];

/** What a pack costs this agency, in the currency it pays its plan in. */
export async function extraPackOffer(agencyId: string): Promise<{ currency: PlanCurrency; price: number; replies: number }> {
  const subscription = await db.waSubscription.findUnique({ where: { agencyId }, select: { whopPlanId: true } });
  const currency = currencyForWhopPlanId(subscription?.whopPlanId);
  return { currency, price: EXTRA_PACK_PRICE_LOCAL[currency], replies: EXTRA_PACK_REPLIES };
}

const SYMBOL: Record<PlanCurrency, string> = { GBP: "£", USD: "$", CAD: "$", AUD: "$", ZAR: "R" };
/** "£6", "$9", "$12 CAD", "$13 AUD", "R140": the symbol, then the code where "$" alone would be ambiguous. */
export function formatPackPrice(currency: PlanCurrency, price: number): string {
  return `${SYMBOL[currency]}${price.toLocaleString("en-GB")}${currency === "CAD" || currency === "AUD" ? ` ${currency}` : ""}`;
}

/** A Whop checkout for one pack, on the currency's own plan. The buyer returns to the dashboard's Settings page afterwards. */
export async function createExtraRepliesCheckout(agencyId: string, siteUrl: string): Promise<{ url: string; currency: PlanCurrency; price: number }> {
  const companyId = process.env.WHOP_COMPANY_ID;
  if (!companyId) throw new Error("WHOP_COMPANY_ID is not set");
  const { currency, price, replies } = await extraPackOffer(agencyId);
  const config = await getWhopClient().checkoutConfigurations.create({
    account_id: companyId,
    mode: "payment",
    metadata: { kind: EXTRA_REPLIES_KIND, agencyId, replies, currency },
    redirect_url: `${siteUrl.replace(/\/$/, "")}/whatsapp-umrah/${agencyId}/settings?extra=thanks`,
    plan_id: EXTRA_PACK_PLAN_IDS[currency],
  });
  if (!config.purchase_url) throw new Error("Whop returned no checkout link");
  return { url: config.purchase_url, currency, price };
}

export function isExtraRepliesPayment(metadata: unknown): boolean {
  return !!metadata && typeof metadata === "object" && (metadata as { kind?: unknown }).kind === EXTRA_REPLIES_KIND;
}

type ExtraPayment = {
  id: string;
  metadata?: unknown;
  currency?: string | null;
  subtotal?: number | null;
  total?: number | null;
};

/** Credits a paid pack to its agency for the current month. Idempotent on the Whop payment id. Refuses (and says why
    in the log) anything that does not match what we sold: an unknown agency or currency, or an amount below the price. */
export async function recordExtraRepliesPayment(tx: Tx, payment: ExtraPayment): Promise<"recorded" | "duplicate" | "rejected"> {
  const meta = (payment.metadata ?? {}) as { agencyId?: unknown; currency?: unknown };
  const agencyId = typeof meta.agencyId === "string" ? meta.agencyId : "";
  const currency = CURRENCIES.find((c) => c === meta.currency);
  if (!agencyId || !currency) {
    console.error("[whop webhook] extra-replies payment with bad metadata", payment.id);
    return "rejected";
  }
  const price = EXTRA_PACK_PRICE_LOCAL[currency];
  const paid = payment.subtotal ?? payment.total ?? 0;
  if ((payment.currency ?? "").toLowerCase() !== currency.toLowerCase() || paid + 0.01 < price) {
    console.error(`[whop webhook] extra-replies payment ${payment.id} does not match the ${currency} ${price} pack (paid ${paid} ${payment.currency})`);
    return "rejected";
  }
  const agency = await tx.waAgency.findUnique({ where: { id: agencyId }, select: { id: true } });
  if (!agency) {
    console.error("[whop webhook] extra-replies payment for an unknown agency", payment.id);
    return "rejected";
  }
  if (await tx.waExtraReplies.findUnique({ where: { whopPaymentId: payment.id }, select: { id: true } })) return "duplicate";
  const now = new Date();
  await tx.waExtraReplies.create({
    data: {
      agencyId,
      periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      replies: EXTRA_PACK_REPLIES,
      budgetUsdCents: Math.round(extraPackBudgetUsdCents(currency)),
      currency,
      whopPaymentId: payment.id,
    },
  });
  return "recorded";
}
