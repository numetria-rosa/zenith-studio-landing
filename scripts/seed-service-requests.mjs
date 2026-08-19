// Local-only test seed — one ServiceRequest per status stage, for a fresh
// test client, so the client dashboard and admin page can be exercised.
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const db = new PrismaClient();
const STATUSES = ["new", "scoping", "building", "live", "maintenance"];
const SERVICE_IDS = ["ai-inbox-manager", "ai-lead-capture", "ai-receptionist", "ai-inbox-manager", "ai-lead-capture"];

async function main() {
  const email = "service-client@example.com";
  const user = await db.user.upsert({
    where: { email },
    create: { email, name: "Service Client" },
    update: {},
  });

  // Only one ServiceRequest per (user, serviceId) is allowed, so reuse the
  // seeded course-owning user's distinct services with distinct statuses by
  // creating extra throwaway users for the repeated service ids.
  for (let i = 0; i < STATUSES.length; i++) {
    const u =
      i < 3
        ? user
        : await db.user.upsert({
            where: { email: `service-client-${i}@example.com` },
            create: { email: `service-client-${i}@example.com`, name: `Service Client ${i}` },
            update: {},
          });
    await db.serviceRequest.upsert({
      where: { userId_serviceId: { userId: u.id, serviceId: SERVICE_IDS[i] } },
      create: {
        userId: u.id,
        serviceId: SERVICE_IDS[i],
        status: STATUSES[i],
        monthlyStatus: i % 2 === 0 ? "active" : "inactive",
      },
      update: { status: STATUSES[i] },
    });
  }

  const sessionToken = randomUUID();
  await db.session.create({
    data: { sessionToken, userId: user.id, expires: new Date(Date.now() + 86400000) },
  });

  console.log(JSON.stringify({ userId: user.id, email, sessionToken }, null, 2));
}

main().finally(() => db.$disconnect());
