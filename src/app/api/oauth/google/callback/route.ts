import type { NextRequest } from "next/server";
import { exchangeGoogleCode } from "@/lib/oauth-google";
import { verifyOAuthState } from "@/lib/oauth-state";
import { saveOAuthConnection, canManageOAuthForProject } from "@/lib/oauth-connections";
import { db } from "@/lib/db";

export async function GET(request: NextRequest): Promise<Response> {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state) return new Response("missing code or state", { status: 400 });

  const verifiedState = verifyOAuthState(state);
  if (!verifiedState.ok) return new Response("invalid or expired state", { status: 400 });

  if (!(await canManageOAuthForProject(verifiedState.projectId))) return new Response("forbidden", { status: 403 });

  const project = await db.serviceProject.findUnique({ where: { id: verifiedState.projectId }, select: { id: true } });
  if (!project) return new Response("project not found", { status: 404 });

  const tokenResult = await exchangeGoogleCode(code);
  if (!tokenResult.ok) return new Response(`token exchange failed: ${tokenResult.error}`, { status: 502 });
  if (!tokenResult.refreshToken) {
    return new Response(
      "Google did not return a refresh token. This usually means the account already granted consent once before. Revoke access at myaccount.google.com/permissions and try connecting again.",
      { status: 502 }
    );
  }

  await saveOAuthConnection({
    projectId: project.id,
    provider: "GOOGLE",
    accountEmail: tokenResult.email,
    refreshToken: tokenResult.refreshToken,
    scope: "calendar.readonly gmail.readonly",
  });

  return Response.redirect(new URL(`/lab/dashboard/services/${project.id}`, request.url));
}
