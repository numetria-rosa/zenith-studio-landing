// Shows every real "Get access" click recorded by /api/go/[courseId] — this
// fires on EVERY click through that route, whether or not the visitor goes
// on to actually submit payment on Whop's checkout page. Whop itself has no
// record of someone who clicks through and abandons before entering payment
// info, so this is the only way to see that specific drop-off, and the only
// reliable count of "how many people tried to buy" independent of an ad
// platform's own (sometimes inflated) click counts.
//
// Usage:
//   node --env-file=.env scripts/check-checkout-attempts.mjs [courseId] [--since=2026-09-04]

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const courseId = args.find((a) => !a.startsWith("--"));
  const sinceArg = args.find((a) => a.startsWith("--since="));
  const since = sinceArg ? new Date(sinceArg.split("=")[1]) : null;

  const attempts = await db.checkoutAttempt.findMany({
    where: {
      ...(courseId ? { courseId } : {}),
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  if (attempts.length === 0) {
    console.log("No checkout attempts recorded yet" + (courseId ? ` for "${courseId}"` : "") + ".");
    return;
  }

  console.log(`${attempts.length} checkout attempt(s):\n`);
  const byCourse = {};
  for (const a of attempts) {
    byCourse[a.courseId] = (byCourse[a.courseId] ?? 0) + 1;
    const utm = [a.utmSource, a.utmMedium, a.utmCampaign, a.utmContent].some(Boolean)
      ? `source: ${a.utmSource ?? "-"} / medium: ${a.utmMedium ?? "-"} / campaign: ${a.utmCampaign ?? "-"} / content: ${a.utmContent ?? "-"}`
      : "no UTM (organic/direct click)";
    console.log(`[${a.createdAt.toISOString()}] ${a.courseId} — ${utm}`);
  }

  console.log("\nBy course:");
  for (const [id, count] of Object.entries(byCourse)) {
    console.log(`  ${id}: ${count}`);
  }
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
