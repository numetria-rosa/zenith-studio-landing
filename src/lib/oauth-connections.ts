import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/secrets";
import { refreshGoogleAccessToken } from "@/lib/oauth-google";
import { refreshMicrosoftAccessToken } from "@/lib/oauth-microsoft";
import type { OAuthProvider } from "@prisma/client";

const OAUTH_SECRET_ENV = "OAUTH_ENCRYPTION_KEY";

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
    token — called fresh before every calendar/email fetch since access
    tokens are short-lived (~1 hour) and this runs unattended from a cron. */
export async function getFreshAccessToken(connection: { provider: OAuthProvider; encryptedRefreshToken: string }): Promise<FreshTokenResult> {
  const refreshToken = decryptSecret(connection.encryptedRefreshToken, OAUTH_SECRET_ENV);
  const result =
    connection.provider === "GOOGLE"
      ? await refreshGoogleAccessToken(refreshToken)
      : await refreshMicrosoftAccessToken(refreshToken);
  return result;
}
