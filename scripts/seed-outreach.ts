import { db } from "../src/lib/db";
import { importDallasDentalProspects, prepareEligibleProspects } from "../src/lib/outreach-admin";

async function main() {
  const imported = await importDallasDentalProspects();
  console.log("import", imported);

  const prepared = await prepareEligibleProspects();
  for (const row of prepared) {
    console.log(row.name, row.ok ? `ok` : row.error);
  }

  const counts = await db.prospect.groupBy({ by: ["status"], _count: true });
  console.log("statuses", counts);

  const ready = await db.outreachMessage.findMany({
    where: { status: { in: ["READY_TO_SEND", "NEEDS_REVIEW"] } },
    select: { subject: true, qualityScore: true, status: true, prospect: { select: { businessName: true, email: true } } },
  });
  console.log("drafts", JSON.stringify(ready, null, 2));

  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
