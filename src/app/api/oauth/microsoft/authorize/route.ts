import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { buildMicrosoftAuthorizeUrl } from "@/lib/oauth-microsoft";
import { signOAuthState } from "@/lib/oauth-state";

export async function GET(request: NextRequest): Promise<Response> {
  const admin = await requireAdmin();
  if (!admin) return new Response("forbidden", { status: 403 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return new Response("missing projectId", { status: 400 });

  const state = signOAuthState(projectId);
  return Response.redirect(buildMicrosoftAuthorizeUrl(state));
}
