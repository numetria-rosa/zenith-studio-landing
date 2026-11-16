import { NextRequest } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { runTransactionCoordinator } from "@/lib/transaction-coordinator";
import { runDatabaseManager } from "@/lib/database-manager";

/* Daily run for the Brokerage AI Team's Transaction Coordinator and Database Manager. */
export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) return new Response("unauthorized", { status: 401 });
  const transactions = await runTransactionCoordinator();
  const database = await runDatabaseManager();
  return Response.json({ transactions, database });
}
