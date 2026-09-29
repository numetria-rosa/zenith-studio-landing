import { NextRequest } from "next/server";
import { purgeExpiredContacts } from "@/lib/whatsapp-umrah/gdpr";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron");
  const authorized =
    (secret && auth === `Bearer ${secret}`) || (!secret && vercelCron === "1") || (!secret && process.env.NODE_ENV !== "production");
  if (!authorized) {
    return new Response("unauthorized", { status: 401 });
  }
  const result = await purgeExpiredContacts();
  return Response.json(result);
}
