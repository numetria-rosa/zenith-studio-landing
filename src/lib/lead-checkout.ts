import { getWhopClient } from "@/lib/whop";
import { getSiteUrl } from "@/lib/site";

/* Whop checkout for the no-website cold-outreach campaign. Every checkout
   attaches to this one shared, hidden container product (created once via
   scripts/create-lead-website-whop-product.mjs) - leads are one-off, custom
   per-business sales, so unlike services.ts's per-service products there's
   nothing to browse; the product exists only as the required container
   Whop's API makes every plan belong to. Mirrors proposal-payments.ts's own
   reasoning for its shared PROPOSAL_WHOP_PRODUCT_ID. */
const LEAD_WEBSITE_WHOP_PRODUCT_ID = "prod_ncw191NzXItqf";

const LEAD_WEBSITE_PRICE_USD = 150;

/** Creates a hidden, one-off checkout for a single no-website lead and
    returns its purchase_url. Uses checkoutConfigurations (not plans.create)
    specifically because it accepts redirect_url directly - unlike a bare
    plan's purchase_url, which always lands the buyer on Whop's own generic
    receipt page (confirmed against the Plan SDK type - no redirect field
    exists there), a checkout configuration can send them to our own
    thank-you page after payment. force_create_new_plan is required because
    every lead is priced identically ($150 one_time): without it, Whop's
    "reuse a matching plan" behavior would silently collapse every lead onto
    the same underlying plan, losing the per-lead title/metadata that lets
    a payment.succeeded webhook (or a human in the Whop dashboard) tell
    leads apart. */
export async function createLeadCheckoutUrl(leadSlug: string, businessName: string): Promise<string> {
  const whop = getWhopClient();
  const companyId = process.env.WHOP_COMPANY_ID;
  if (!companyId) throw new Error("WHOP_COMPANY_ID is not set");

  const config = await whop.checkoutConfigurations.create({
    account_id: companyId,
    mode: "payment",
    metadata: { lead: leadSlug },
    redirect_url: `${getSiteUrl()}/pay/thanks?lead=${encodeURIComponent(leadSlug)}`,
    plan: {
      product_id: LEAD_WEBSITE_WHOP_PRODUCT_ID,
      title: businessName.slice(0, 30), // Whop plan titles cap at 30 chars (confirmed in proposal-payments.ts)
      description:
        "One-time website build, $150 after 40 percent off our regular $250 rate. No monthly fees. Deployment included once you provide or purchase a domain.",
      plan_type: "one_time",
      currency: "usd",
      initial_price: LEAD_WEBSITE_PRICE_USD,
      visibility: "hidden", // never listed - only reachable via the exact link sent to this one lead
      force_create_new_plan: true,
    },
  });

  if (!config.purchase_url) throw new Error(`Whop checkout configuration ${config.id} has no purchase_url`);
  return config.purchase_url;
}
