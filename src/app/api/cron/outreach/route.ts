import { NextRequest } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { processFollowUps } from "@/lib/outreach-admin";

export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) return new Response("unauthorized", { status: 401 });
  // Switched off until someone has checked what it would send; set ENABLE_OUTREACH_CRON=1 in Vercel to turn it on.
  if (process.env.ENABLE_OUTREACH_CRON !== "1") return Response.json({ skipped: "disabled" });
  const result = await processFollowUps();
  return Response.json(result);
}
