import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import {
  listPaidAuditsForAdmin,
  createPaidAudit,
  updatePaidAudit,
  PAID_AUDIT_STATUSES,
  PAID_AUDIT_STATUS_LABELS,
  PAID_AUDIT_BOOKING_URL,
} from "@/lib/paid-audit";
import type { PaidAuditStatus } from "@prisma/client";

/* Paid audit call tracking ($35 Cal Pay). Rows auto-arrive via
   /api/webhooks/cal; this page is for review, status updates, and manual
   fallback entries. Matches every other admin route's pattern:
   requireAdmin() -> notFound(), dark Studio card language, every write
   action independently re-checks requireAdmin(). */

function formatDateTime(d: Date | null): string {
  if (!d) return "—";
  return d.toISOString().slice(0, 16).replace("T", " ");
}

const STATUS_COLORS: Record<PaidAuditStatus, string> = {
  PAYMENT_PENDING: "border-white/15 bg-white/[0.03] text-white/50",
  PAID: "border-cyan-400/30 bg-cyan-400/[0.06] text-cyan-300",
  BOOKING_PENDING: "border-amber-400/30 bg-amber-400/[0.06] text-amber-300",
  BOOKED: "border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-300",
  COMPLETED: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  FOLLOW_UP: "border-fuchsia-400/30 bg-fuchsia-400/[0.06] text-fuchsia-300",
  CANCELLED: "border-red-400/40 bg-red-400/[0.08] text-red-300",
  REFUNDED: "border-red-400/30 bg-red-400/[0.05] text-red-300/80",
};

export default async function AdminPaidAuditsPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const audits = await listPaidAuditsForAdmin();

  async function createAction(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    await createPaidAudit({
      email: String(formData.get("email") || ""),
      companyName: String(formData.get("companyName") || ""),
      status: String(formData.get("status") || ""),
      scheduledAt: String(formData.get("scheduledAt") || ""),
      calBookingUid: String(formData.get("calBookingUid") || ""),
      adminNote: String(formData.get("adminNote") || ""),
    });
    revalidatePath("/admin/paid-audits");
    revalidatePath("/admin");
  }

  async function editAction(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    if (!session) return;
    const id = String(formData.get("id") || "");
    await updatePaidAudit(id, {
      email: String(formData.get("email") || ""),
      companyName: String(formData.get("companyName") || ""),
      status: String(formData.get("status") || ""),
      scheduledAt: String(formData.get("scheduledAt") || ""),
      calBookingUid: String(formData.get("calBookingUid") || ""),
      adminNote: String(formData.get("adminNote") || ""),
      followUpNote: String(formData.get("followUpNote") || ""),
    });
    revalidatePath("/admin/paid-audits");
    revalidatePath("/admin");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Link href="/admin" className="text-sm text-white/50 hover:text-white/80">
            &larr; Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Paid audit calls</h1>
          <p className="mt-1 text-sm text-white/50">
            {audits.length} tracked · $35, 20-minute calls booked and paid through{" "}
            <a href={PAID_AUDIT_BOOKING_URL} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30">
              Cal.com
            </a>
            . New bookings sync automatically via webhook — use the form below only for corrections or fallback.
          </p>
        </div>
      </div>

      {/* New paid audit form */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Add a booking</h2>
        <form
          action={createAction}
          className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5"
        >
          <div className="flex flex-wrap gap-3">
            <input
              name="email"
              type="email"
              required
              placeholder="Client email (must already have an account)..."
              className="min-w-[260px] flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            />
            <input
              name="companyName"
              placeholder="Company (optional)..."
              className="min-w-[200px] flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/50" htmlFor="new-status">
                Status
              </label>
              <select
                id="new-status"
                name="status"
                defaultValue="BOOKED"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
              >
                {PAID_AUDIT_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-[#05060a]">
                    {PAID_AUDIT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50" htmlFor="new-scheduledAt">
                Call time
              </label>
              <input
                id="new-scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50" htmlFor="new-calBookingUid">
                Cal.com booking ref
              </label>
              <input
                id="new-calBookingUid"
                name="calBookingUid"
                placeholder="Optional"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Add
            </button>
          </div>
          <textarea
            name="adminNote"
            rows={2}
            placeholder="Internal note (optional)..."
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
          />
        </form>
      </section>

      {/* List */}
      <section className="mt-10 mb-8">
        <h2 className="text-lg font-semibold">All bookings</h2>
        <div className="mt-4 flex flex-col gap-3">
          {audits.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
              No paid audit calls tracked yet.
            </p>
          )}
          {audits.map((a) => (
            <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{a.user.name || a.email}</p>
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${STATUS_COLORS[a.status]}`}
                    >
                      {PAID_AUDIT_STATUS_LABELS[a.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/40">
                    {a.email}
                    {a.companyName && ` · ${a.companyName}`}
                  </p>
                  <p className="mt-2 text-xs text-white/40">
                    Call: {formatDateTime(a.scheduledAt)}
                    {a.calBookingUid && ` · Cal ref ${a.calBookingUid}`}
                  </p>
                  {a.adminNote && <p className="mt-2 text-sm text-white/70">{a.adminNote}</p>}
                  {a.followUpNote && <p className="mt-2 text-sm text-fuchsia-200/80">Follow-up: {a.followUpNote}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-white/40">${(a.amountCents / 100).toFixed(0)} {a.currency.toUpperCase()}</p>
                  <p className="mt-1 text-xs text-white/30">Created {formatDateTime(a.createdAt)}</p>
                </div>
              </div>

              <details className="mt-4 border-t border-white/5 pt-3">
                <summary className="cursor-pointer text-xs text-white/40 hover:text-white/70">Edit</summary>
                <form action={editAction} className="mt-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <input type="hidden" name="id" value={a.id} />
                  <div className="flex flex-wrap gap-3">
                    <input
                      name="email"
                      type="email"
                      defaultValue={a.email}
                      required
                      className="min-w-[220px] flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                    />
                    <input
                      name="companyName"
                      defaultValue={a.companyName ?? ""}
                      className="min-w-[180px] flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-white/50">Status</label>
                      <select
                        name="status"
                        defaultValue={a.status}
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                      >
                        {PAID_AUDIT_STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-[#05060a]">
                            {PAID_AUDIT_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-white/50">Call time</label>
                      <input
                        name="scheduledAt"
                        type="datetime-local"
                        defaultValue={a.scheduledAt ? a.scheduledAt.toISOString().slice(0, 16) : ""}
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-white/50">Cal.com booking ref</label>
                      <input
                        name="calBookingUid"
                        defaultValue={a.calBookingUid ?? ""}
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <textarea
                    name="adminNote"
                    defaultValue={a.adminNote ?? ""}
                    rows={2}
                    placeholder="Internal note..."
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                  />
                  <textarea
                    name="followUpNote"
                    defaultValue={a.followUpNote ?? ""}
                    rows={2}
                    placeholder="Follow-up note..."
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="self-start rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
                  >
                    Save
                  </button>
                </form>
              </details>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
