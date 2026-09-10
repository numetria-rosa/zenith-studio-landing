import type { NextRequest } from "next/server";
import { buildMicrosoftAuthorizeUrl } from "@/lib/oauth-microsoft";
import { signOAuthState } from "@/lib/oauth-state";
import { canManageOAuthForProject } from "@/lib/oauth-connections";

export async function GET(request: NextRequest): Promise<Response> {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return new Response("missing projectId", { status: 400 });

  if (!(await canManageOAuthForProject(projectId))) return new Response("forbidden", { status: 403 });

  const state = signOAuthState(projectId);
  return Response.redirect(buildMicrosoftAuthorizeUrl(state));
}
