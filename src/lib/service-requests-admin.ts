import { db } from "@/lib/db";
import { isServiceStatus } from "@/lib/services";

/* Shared by the admin page's inline form (server action) and the
   PATCH /api/admin/service-requests/[id] route, so both validate and write
   identically. Callers are responsible for requireAdmin() first — this
   function does not check authorization itself. */
export async function updateServiceRequestAsAdmin(
  id: string,
  patch: { status?: string; adminNote?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const data: { status?: string; adminNote?: string } = {};

  if (patch.status !== undefined) {
    if (!isServiceStatus(patch.status)) return { ok: false, error: `invalid status "${patch.status}"` };
    data.status = patch.status;
  }
  if (patch.adminNote !== undefined) {
    if (typeof patch.adminNote !== "string" || patch.adminNote.length > 5000) {
      return { ok: false, error: "adminNote must be a string under 5000 characters" };
    }
    data.adminNote = patch.adminNote;
  }
  if (Object.keys(data).length === 0) return { ok: false, error: "nothing to update" };

  await db.serviceRequest.update({ where: { id }, data });
  return { ok: true };
}
