import { NextRequest } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { purgeDocChaserData, runDocumentChaser } from "@/lib/document-chaser-db";

/* Daily run for the AI Document Chaser: reminds clients who still owe documents, tells the accountant when one is done,
   then applies the retention rules (purgeDocChaserData). */
export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) return new Response("unauthorized", { status: 401 });
  const chase = await runDocumentChaser();
  const retention = await purgeDocChaserData();
  return Response.json({ ...chase, retention });
}
