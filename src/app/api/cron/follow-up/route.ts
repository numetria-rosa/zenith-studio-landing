import { NextRequest } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { processFollowUps } from "@/lib/follow-up-clerk";
import { advanceAllTextingRegistrations } from "@/lib/texting-registration";

export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) return new Response("unauthorized", { status: 401 });
  // Switched off until someone has checked what it would send; set ENABLE_FOLLOWUP_CRON=1 in Vercel to turn it on.
  if (process.env.ENABLE_FOLLOWUP_CRON !== "1") return Response.json({ skipped: "disabled" });
  // Fallback for missed carrier-approval callbacks, before any texts go out.
  const registrationsAdvanced = await advanceAllTextingRegistrations();
  const result = await processFollowUps();
  return Response.json({ ...result, registrationsAdvanced });
}
