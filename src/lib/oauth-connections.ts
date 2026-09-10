import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";
import { encryptSecret, decryptSecret } from "@/lib/secrets";
import { refreshGoogleAccessToken } from "@/lib/oauth-google";
import { refreshMicrosoftAccessToken } from "@/lib/oauth-microsoft";
import type { OAuthProvider } from "@prisma/client";

const OAUTH_SECRET_ENV = "OAUTH_ENCRYPTION_KEY";

/** The attorney whose calendar/email this is should be the one clicking
    Connect and granting consent, so the OAuth routes accept the project's
    own owner, not just an admin. Admin stays allowed too, as a fallback for
    a client who needs hands-on help during onboarding. Re-checked
    independently in every route, never trusted from a prior page render. */
export async function canManageOAuthForProject(projectId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const project = await db.serviceProject.findUnique({ where: { id: projectId }, select: { userId: true } });
  if (!project) return false;
  if (project.userId === session.user.id) return true;

  const admin = await requireAdmin();
  return admin !== null;
}

export async function saveOAuthConnection(input: {
  projectId: string;
  provider: OAuthProvider;
  accountEmail: string;
  refreshToken: string;
  scope: string;
}): Promise<void> {
  const encryptedRefreshToken = encryptSecret(input.refreshToken, OAUTH_SECRET_ENV);
  await db.oAuthConnection.upsert({
    where: {
      projectId_provider_accountEmail: {
        projectId: input.projectId,
        provider: input.provider,
        accountEmail: input.accountEmail,
      },
    },
    create: {
      projectId: input.projectId,
      provider: input.provider,
      accountEmail: input.accountEmail,
      encryptedRefreshToken,
      scope: input.scope,
      status: "CONNECTED",
    },
    update: { encryptedRefreshToken, scope: input.scope, status: "CONNECTED", connectedAt: new Date() },
  });
}

export type FreshTokenResult = { ok: true; accessToken: string } | { ok: false; error: string };

/** Decrypts the stored refresh token and exchanges it for a live access
    token, called fresh before every calendar/email fetch since access
    tokens are short-lived (~1 hour) and this runs unattended from a cron. */
export async function getFreshAccessToken(connection: { provider: OAuthProvider; encryptedRefreshToken: string }): Promise<FreshTokenResult> {
  const refreshToken = decryptSecret(connection.encryptedRefreshToken, OAUTH_SECRET_ENV);
  const result =
    connection.provider === "GOOGLE"
      ? await refreshGoogleAccessToken(refreshToken)
      : await refreshMicrosoftAccessToken(refreshToken);
  return result;
}
