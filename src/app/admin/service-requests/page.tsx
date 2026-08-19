import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getService, SERVICE_STATUSES, SERVICE_STATUS_LABELS, isServiceStatus } from "@/lib/services";
import { updateServiceRequestAsAdmin } from "@/lib/service-requests-admin";

/* Owner-facing view of every AI Systems purchase. 404s (not a redirect) for
   non-admins — the route's existence isn't something to confirm to a
   logged-in-but-not-you visitor. */
export default async function AdminServiceRequestsPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const requests = await db.serviceRequest.findMany({
    include: { user: { select: { email: true, name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  async function updateRequest(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;

    const id = String(formData.get("id"));
    const status = String(formData.get("status") || "");
    const adminNote = String(formData.get("adminNote") || "");

    await updateServiceRequestAsAdmin(id, {
      status: isServiceStatus(status) ? status : undefined,
      adminNote,
    });
    revalidatePath("/admin/service-requests");
  }

  return (
    <div className="min-h-screen bg-[#05060a] text-white px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">Service requests</h1>
        <p className="mt-1 text-sm text-white/50">{requests.length} total, newest activity first.</p>

        <div className="mt-8 flex flex-col gap-4">
          {requests.length === 0 && <p className="text-white/50 text-sm">No purchases yet.</p>}

          {requests.map((r) => {
            const service = getService(r.serviceId);
            return (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{service?.title ?? r.serviceId}</h2>
                    <p className="text-sm text-white/50">
                      {r.user.name || r.user.email} · {r.user.email}
                    </p>
                  </div>
                  <span className="text-xs text-white/40">
                    Monthly: {r.monthlyStatus} · Updated {r.updatedAt.toISOString().slice(0, 10)}
                  </span>
                </div>

                <form action={updateRequest} className="mt-4 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={r.id} />
                  <div>
                    <label className="block text-xs text-white/50 mb-1" htmlFor={`status-${r.id}`}>
                      Status
                    </label>
                    <select
                      id={`status-${r.id}`}
                      name="status"
                      defaultValue={r.status}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                    >
                      {SERVICE_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-[#05060a]">
                          {SERVICE_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[240px]">
                    <label className="block text-xs text-white/50 mb-1" htmlFor={`note-${r.id}`}>
                      Internal note (never shown to the client)
                    </label>
                    <textarea
                      id={`note-${r.id}`}
                      name="adminNote"
                      defaultValue={r.adminNote ?? ""}
                      rows={2}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
                  >
                    Save
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
