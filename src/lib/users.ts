import type { Prisma } from "@prisma/client";

/* Small, deliberately separate from the webhook's own findOrCreateUser in
   src/app/api/webhooks/whop/route.ts (Slice 6 of the service-platform
   build, 2026-08-28). That function resolves by whopUserId first, then
   email — this one only ever has an email to go on (a proposal approval
   has no Whop identity involved), so it isn't the same lookup shape. Kept
   here instead of duplicated inline in proposals-public.ts in case a third
   email-only flow needs it later; the webhook route itself is intentionally
   NOT changed to import this, since Next.js route handlers aren't meant to
   be imported as libraries and the webhook file's stability outranks DRY. */
export async function findOrCreateUserByEmail(
  tx: Prisma.TransactionClient,
  email: string,
  name?: string | null
) {
  const existing = await tx.user.findUnique({ where: { email } });
  if (existing) return existing;
  return tx.user.create({ data: { email, name: name ?? undefined } });
}
