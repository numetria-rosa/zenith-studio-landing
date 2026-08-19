// Local-only test seed — creates a fake user + entitlement so the guard and
// dashboard can be exercised through the browser without a real Whop purchase.
// Uses the Auth.js "credentials-less" trick: we can't sign in through the
// magic-link flow without a real email provider, so we seed a Session row
// directly and print the session token to paste in as a cookie.
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const db = new PrismaClient();

async function main() {
  const email = "test-student@example.com";
  const user = await db.user.upsert({
    where: { email },
    create: { email, name: "Test Student", whopUserId: "user_test123" },
    update: {},
  });

  await db.courseEntitlement.upsert({
    where: { userId_courseId: { userId: user.id, courseId: "ai-engineering" } },
    create: {
      userId: user.id,
      courseId: "ai-engineering",
      status: "active",
      source: "whop",
      whopMembershipId: "mem_test123",
      whopPaymentId: "pay_test123",
    },
    update: { status: "active", revokedAt: null },
  });

  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await db.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  console.log(JSON.stringify({ userId: user.id, email, sessionToken, expires }, null, 2));
}

main().finally(() => db.$disconnect());
