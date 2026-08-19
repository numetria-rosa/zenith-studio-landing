import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const db = new PrismaClient();

async function main() {
  const email = "no-purchase@example.com";
  const user = await db.user.upsert({
    where: { email },
    create: { email, name: "No Purchase" },
    update: {},
  });
  // Deliberately NO CourseEntitlement created.

  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await db.session.create({ data: { sessionToken, userId: user.id, expires } });

  console.log(JSON.stringify({ userId: user.id, email, sessionToken }, null, 2));
}

main().finally(() => db.$disconnect());
