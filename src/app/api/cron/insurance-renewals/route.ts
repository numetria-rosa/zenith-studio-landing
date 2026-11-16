import { NextRequest } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { sendDueRenewalReminders } from "@/lib/insurance-renewals";

export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) return new Response("unauthorized", { status: 401 });
  const result = await sendDueRenewalReminders();
  return Response.json(result);
}
