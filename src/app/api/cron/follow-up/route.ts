import { NextRequest } from "next/server";
import { processFollowUps } from "@/lib/follow-up-clerk";
import { advanceAllTextingRegistrations } from "@/lib/texting-registration";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron");
  const authorized =
    (secret && auth === `Bearer ${secret}`) || (!secret && vercelCron === "1") || (!secret && process.env.NODE_ENV !== "production");
  if (!authorized) {
    return new Response("unauthorized", { status: 401 });
  }
  // Fallback for missed carrier-approval callbacks, before any texts go out.
  const registrationsAdvanced = await advanceAllTextingRegistrations();
  const result = await processFollowUps();
  return Response.json({ ...result, registrationsAdvanced });
}
