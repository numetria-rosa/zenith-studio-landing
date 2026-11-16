import { NextRequest } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { runBillingClerkForAllProjects } from "@/lib/billing-clerk";

export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) return new Response("unauthorized", { status: 401 });
  const result = await runBillingClerkForAllProjects();
  return Response.json(result);
}
