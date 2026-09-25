import { NextRequest } from "next/server";
import { snapshotMrr } from "@/lib/hq/snapshot";

/* Monthly MRR snapshot for Zenith HQ's Overview chart history - runs early
   on the 1st (see vercel.json), snapshots the month that just ended. Same
   auth pattern as every other /api/cron/* route in this repo. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron");
  const authorized =
    (secret && auth === `Bearer ${secret}`) || (!secret && vercelCron === "1") || (!secret && process.env.NODE_ENV !== "production");
  if (!authorized) {
    return new Response("unauthorized", { status: 401 });
  }
  const result = await snapshotMrr();
  return Response.json({ snapshotted: result });
}
