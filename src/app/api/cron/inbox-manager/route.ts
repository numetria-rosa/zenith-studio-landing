import { NextRequest } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { runInboxManagerForAllProjects } from "@/lib/inbox-manager";

export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) return new Response("unauthorized", { status: 401 });
  const result = await runInboxManagerForAllProjects();
  return Response.json(result);
}
