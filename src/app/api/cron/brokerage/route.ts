import { NextRequest } from "next/server";
import { runTransactionCoordinator } from "@/lib/transaction-coordinator";
import { runDatabaseManager } from "@/lib/database-manager";

/* Daily run for the Brokerage AI Team's Transaction Coordinator and Database Manager. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron");
  const authorized =
    (secret && auth === `Bearer ${secret}`) || (!secret && vercelCron === "1") || (!secret && process.env.NODE_ENV !== "production");
  if (!authorized) {
    return new Response("unauthorized", { status: 401 });
  }
  const transactions = await runTransactionCoordinator();
  const database = await runDatabaseManager();
  return Response.json({ transactions, database });
}
