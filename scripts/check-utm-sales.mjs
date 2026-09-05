// Shows which UTM-tagged campaign (if any) drove each real course sale.
// Reads WebhookEvent rows for payment.succeeded events — the full raw Whop
// payload is already logged there unconditionally by the webhook handler,
// so this needs no separate tracking table. UTM data only appears on a
// payment when the buyer went through /api/go/[courseId]?utm_...=... (the
// tracked link) rather than a plain checkout link or direct Whop visit.
//
// Usage:
//   node --env-file=.env scripts/check-utm-sales.mjs

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const events = await db.webhookEvent.findMany({
    where: { type: "payment.succeeded" },
    orderBy: { receivedAt: "desc" },
  });

  if (events.length === 0) {
    console.log("No payment.succeeded events recorded yet.");
    return;
  }

  console.log(`${events.length} payment.succeeded event(s):\n`);
  for (const event of events) {
    const payload = event.payload;
    const payment = payload?.data ?? payload;
    const metadata = payment?.metadata ?? null;
    const amount = payment?.subtotal ?? payment?.total ?? "?";
    const productTitle = payment?.product?.title ?? "?";
    const when = event.receivedAt.toISOString();

    console.log(`[${when}] $${amount} — "${productTitle}"`);
    if (metadata && Object.keys(metadata).length > 0) {
      console.log(`  source: ${metadata.utm_source ?? "-"} / medium: ${metadata.utm_medium ?? "-"} / campaign: ${metadata.utm_campaign ?? "-"} / content: ${metadata.utm_content ?? "-"}`);
    } else {
      console.log("  source: untracked (direct checkout link, no UTM params on the visit)");
    }
    console.log("");
  }
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
