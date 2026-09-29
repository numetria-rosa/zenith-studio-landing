import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** CLAUDE.md §7: "Audit log for admin actions (manual WABA connect/
    reconnect, overrides)." One call site per admin action, `detail` never
    holds the raw access token - only shape-safe metadata (ids, booleans). */
export async function logWaAuditEvent(agencyId: string, actorUserId: string | null, action: string, detail?: Record<string, unknown>): Promise<void> {
  await db.waAuditLog.create({ data: { agencyId, actorUserId, action, detail: (detail ?? Prisma.JsonNull) as Prisma.InputJsonValue } });
}
