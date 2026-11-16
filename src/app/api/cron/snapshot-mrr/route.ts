import { NextRequest } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { snapshotMrr } from "@/lib/hq/snapshot";

/* Monthly MRR snapshot for Zenith HQ's Overview chart history - runs early
   on the 1st (see vercel.json), snapshots the month that just ended. Same
   auth pattern as every other /api/cron/* route in this repo. */
export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) return new Response("unauthorized", { status: 401 });
  const result = await snapshotMrr();
  return Response.json({ snapshotted: result });
}
