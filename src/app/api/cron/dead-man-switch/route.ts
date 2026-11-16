import { NextRequest } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { checkForSilentIntegrations } from "@/lib/dead-man-switch";

export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) return new Response("unauthorized", { status: 401 });
  const result = await checkForSilentIntegrations();
  return Response.json(result);
}
