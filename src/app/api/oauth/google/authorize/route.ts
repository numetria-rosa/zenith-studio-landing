import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { buildGoogleAuthorizeUrl } from "@/lib/oauth-google";
import { signOAuthState } from "@/lib/oauth-state";

/* Admin-initiated: from a project's admin page, "Connect Google" links here
   with ?projectId=X. Only an admin can start this flow — the attorney
   authorizes access on Google's own consent screen, but it's the admin who
   decides which project a connection belongs to. */
export async function GET(request: NextRequest): Promise<Response> {
  const admin = await requireAdmin();
  if (!admin) return new Response("forbidden", { status: 403 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return new Response("missing projectId", { status: 400 });

  const state = signOAuthState(projectId);
  return Response.redirect(buildGoogleAuthorizeUrl(state));
}
