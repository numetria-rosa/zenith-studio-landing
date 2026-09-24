// One-off: uploads each generated product cover image (see
// gen-whop-product-images.mjs) to Whop and attaches it as that product's
// gallery image.
//
// Uses raw fetch throughout, not the installed @whop/sdk client, on
// purpose: the SDK's ProductUpdateParams type (v0.0.42) doesn't expose
// gallery_images at all, even though Whop's own live docs
// (docs.whop.com/api-reference/products/update-product) confirm the real
// PATCH /products/{id} endpoint accepts it - the npm package's TS types
// just lag the actual API. Rather than fight the SDK's stale types with a
// cast, this matches Whop's own documented curl shape directly: Bearer
// auth + an explicit Api-Version-Date header (required for /files per
// their direct-file-upload guide; sent on every call here since the
// product update docs example also pins a client to that same version).
//
// Usage: node scripts/gen-whop-product-images.mjs (if not already run)
//        node --env-file=.env scripts/upload-whop-product-images.mjs
//
// Requires WHOP_API_KEY. Idempotent-ish: re-running re-uploads a fresh
// file and re-sets gallery_images every time - safe, just wasteful if run
// twice, since Whop doesn't dedupe uploaded files.

import { readFile } from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.WHOP_API_KEY;
if (!apiKey) {
  console.error("Missing WHOP_API_KEY. Run with: node --env-file=.env scripts/upload-whop-product-images.mjs");
  process.exit(1);
}

const API_BASE = "https://api.whop.com/api/v1";
const API_VERSION_DATE = "2026-08-21-1";
const IMAGES_DIR = path.resolve("whop-product-images");

function headers(extra = {}) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Api-Version-Date": API_VERSION_DATE,
    ...extra,
  };
}

async function jsonOrThrow(res, context) {
  const text = await res.text();
  if (!res.ok) throw new Error(`${context} failed: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

/** Product ids not already stored anywhere in this repo (services.ts only
    keeps plan ids, not the parent product id) - resolved live from a known
    plan on that product instead of hardcoding a guess. */
async function resolveProductIdFromPlan(planId) {
  const res = await fetch(`${API_BASE}/plans/${planId}`, { headers: headers() });
  const plan = await jsonOrThrow(res, `GET /plans/${planId}`);
  if (!plan.product?.id) throw new Error(`Plan ${planId} has no product.id in response`);
  return plan.product.id;
}

async function uploadPublicImage(filePath) {
  const filename = path.basename(filePath);
  const bytes = await readFile(filePath);

  const createRes = await fetch(`${API_BASE}/files`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ filename, visibility: "public" }),
  });
  const file = await jsonOrThrow(createRes, `POST /files (${filename})`);

  const putRes = await fetch(file.upload_url, {
    method: "PUT",
    headers: file.upload_headers,
    body: bytes,
  });
  if (!putRes.ok) throw new Error(`PUT upload for ${filename} failed: ${putRes.status} ${await putRes.text()}`);

  // Poll until ready - small local PNGs, so this resolves in one or two tries.
  for (let attempt = 0; attempt < 20; attempt++) {
    const getRes = await fetch(`${API_BASE}/files/${file.id}`, { headers: headers() });
    const polled = await jsonOrThrow(getRes, `GET /files/${file.id}`);
    if (polled.upload_status === "ready") return polled;
    if (polled.upload_status === "failed") throw new Error(`File ${file.id} (${filename}) failed to process`);
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`File ${file.id} (${filename}) never became ready after ~30s`);
}

async function setGalleryImage(productId, fileId) {
  const res = await fetch(`${API_BASE}/products/${productId}`, {
    method: "PATCH",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ gallery_images: [{ id: fileId }] }),
  });
  return jsonOrThrow(res, `PATCH /products/${productId}`);
}

// image file (from gen-whop-product-images.mjs) -> how to resolve this
// product's id. Courses/bundles already store their product id
// (whopAccessPassId); services only ever stored plan ids, so those resolve
// live from one known plan on that product.
const TARGETS = [
  // Courses/bundles already done in the first run - trimmed here to avoid
  // re-uploading duplicate files for them (this script has no dedupe).
  { image: "ai-inbox-manager.png", label: "Service: AI Inbox Manager", planIdForProduct: "plan_AUhS9tvz8KrJC" },
  { image: "ai-lead-capture.png", label: "Service: AI Lead Capture & Follow-Up", planIdForProduct: "plan_l6f3sCRsCR2Em" },
  { image: "ai-receptionist.png", label: "Service: AI Receptionist & Booking", planIdForProduct: "plan_ts3JwXpFBKKMp" },
  { image: "law-firm-ai-team.png", label: "Service: Law Firm AI Team", planIdForProduct: "plan_kTlL5gBlJTsqy" },
  { image: "brokerage-ai-team.png", label: "Service: Brokerage AI Team", planIdForProduct: "plan_m3i6RwMYvMATE" },
];

async function main() {
  for (const t of TARGETS) {
    console.log(`\n${t.label}`);
    const productId = t.productId ?? (await resolveProductIdFromPlan(t.planIdForProduct));
    console.log(`  product: ${productId}`);

    const filePath = path.join(IMAGES_DIR, t.image);
    const file = await uploadPublicImage(filePath);
    console.log(`  uploaded: ${file.id} -> ${file.url}`);

    await setGalleryImage(productId, file.id);
    console.log(`  gallery_images set on ${productId}`);
  }
  console.log("\nDone. All 12 products now have a gallery image.");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
