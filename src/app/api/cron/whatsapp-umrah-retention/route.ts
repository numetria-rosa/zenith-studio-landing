import { NextRequest } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { purgeExpiredContacts } from "@/lib/whatsapp-umrah/gdpr";

export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) return new Response("unauthorized", { status: 401 });
  const result = await purgeExpiredContacts();
  return Response.json(result);
}
