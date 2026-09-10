import type { NextRequest } from "next/server";
import { buildGoogleAuthorizeUrl } from "@/lib/oauth-google";
import { signOAuthState } from "@/lib/oauth-state";
import { canManageOAuthForProject } from "@/lib/oauth-connections";

/* The attorney whose calendar/email this connects should be the one
   clicking this — reached from the client's own project dashboard
   ("Connect Google" in the Billing tab). Admin can also trigger it as a
   fallback for hands-on onboarding help. */
export async function GET(request: NextRequest): Promise<Response> {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return new Response("missing projectId", { status: 400 });

  if (!(await canManageOAuthForProject(projectId))) return new Response("forbidden", { status: 403 });

  const state = signOAuthState(projectId);
  return Response.redirect(buildGoogleAuthorizeUrl(state));
}
