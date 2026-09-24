// One-off: sets each product's own redirect_purchase_url (the dashboard's
// "Checkout redirect" toggle) to the claim route, in addition to the
// per-plan Checkout Configuration redirect_url set earlier.
//
// These are two DIFFERENT Whop mechanisms, confirmed by inspecting the
// dashboard directly: a Checkout Configuration's redirect_url only fires
// for that one specific checkout link; redirect_purchase_url lives on the
// PRODUCT itself and fires for every purchase path on that product,
// including Whop's own "Join" button / Discover listing checkout - which a
// custom checkout-configuration link never touches. Both are needed for a
// buyer to always land on /api/auth/claim no matter which door they came
// through.
//
// Usage: node --env-file=.env scripts/set-whop-product-redirects.mjs
// Requires WHOP_API_KEY.

const apiKey = process.env.WHOP_API_KEY;
if (!apiKey) {
  console.error("Missing WHOP_API_KEY. Run with: node --env-file=.env scripts/set-whop-product-redirects.mjs");
  process.exit(1);
}

const API_BASE = "https://api.whop.com/api/v1";
const SITE_URL = process.env.SITE_URL || "https://zenith-studio.site";
const REDIRECT_URL = `${SITE_URL}/api/auth/claim`;

function headers(extra = {}) {
  return { Authorization: `Bearer ${apiKey}`, "Api-Version-Date": "2026-08-21-1", ...extra };
}

const PRODUCTS = [
  { label: "Course: AI Engineering", id: "prod_CKyY55RfnSTlU" },
  { label: "Course: Data Science & Analysis", id: "prod_9eVAjfMpwcaX8" },
  { label: "Course: AI Automation", id: "prod_2u2WQzQUio8kF" },
  { label: "Course: AI-Assisted Software Engineering", id: "prod_rW17sq9hKeXYN" },
  { label: "Course: Mathematics for Machine Learning", id: "prod_OKFbmWkhFm7rS" },
  { label: "Bundle: AI Engineering + AI Automation", id: "prod_vTnpT739BU4eM" },
  { label: "Bundle: AI-Assisted SWE + AI Engineering", id: "prod_WiyrjnVMppopW" },
  { label: "Service: AI Inbox Manager", id: "prod_tfvB7Ab6eE4Qr" },
  { label: "Service: AI Lead Capture & Follow-Up", id: "prod_7Ij3Z9iO6IP8Y" },
  { label: "Service: AI Receptionist & Booking", id: "prod_J5hMx2urP1ujX" },
  { label: "Service: Law Firm AI Team", id: "prod_At0P1t5f04lzI" },
  { label: "Service: Brokerage AI Team", id: "prod_Qd3Xw3cx8MBSp" },
  { label: "Shared: Proposal product (all client proposals)", id: "prod_wSRdxsXN2isTC" },
];

async function main() {
  console.log(`Setting redirect_purchase_url = ${REDIRECT_URL} on ${PRODUCTS.length} products\n`);
  for (const p of PRODUCTS) {
    const res = await fetch(`${API_BASE}/products/${p.id}`, {
      method: "PATCH",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ redirect_purchase_url: REDIRECT_URL }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.log(`${p.label} (${p.id}) FAILED: ${res.status} ${text}`);
      continue;
    }
    console.log(`${p.label} (${p.id}) OK`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
