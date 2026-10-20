import { NextRequest } from "next/server";
import { runDocumentChaser } from "@/lib/document-chaser-db";

/* Daily run for the AI Document Chaser: reminds clients who still owe documents, tells the accountant when one is done. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron");
  const authorized =
    (secret && auth === `Bearer ${secret}`) || (!secret && vercelCron === "1") || (!secret && process.env.NODE_ENV !== "production");
  if (!authorized) {
    return new Response("unauthorized", { status: 401 });
  }
  return Response.json(await runDocumentChaser());
}
