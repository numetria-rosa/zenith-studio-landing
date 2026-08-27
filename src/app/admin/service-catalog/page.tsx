import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

/* Read-only owner-facing view of the DB-backed ServiceCatalog table (Slice 2
   of the service-platform build). This table is not load-bearing yet — it's
   seeded from src/lib/services.ts's SERVICES array (scripts/seed-service-
   catalog.mjs) purely to prove the DB shape before anything depends on it.
   404s (not a redirect) for non-admins, matching admin/service-requests's
   own pattern: the route's existence isn't something to confirm to a
   logged-in-but-not-you visitor. No create/edit here yet — that's a later
   slice once this table becomes load-bearing. */
export default async function AdminServiceCatalogPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const services = await db.serviceCatalog.findMany({
    orderBy: { createdAt: "asc" },
  });

  function formatCents(cents: number | null): string {
    if (cents === null) return "—";
    return `$${(cents / 100).toLocaleString()}`;
  }

  return (
    <div className="min-h-screen bg-[#05060a] text-white px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">Service catalog</h1>
        <p className="mt-1 text-sm text-white/50">
          {services.length} total. Read-only — src/lib/services.ts is still the source of truth for checkout and
          fulfillment.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {services.length === 0 && <p className="text-white/50 text-sm">No catalog rows yet.</p>}

          {services.map((s) => (
            <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{s.title}</h2>
                  <p className="text-sm text-white/50">{s.slug}</p>
                </div>
                <span className="text-xs text-white/40">
                  {s.active ? "Active" : "Inactive"} · Updated {s.updatedAt.toISOString().slice(0, 10)}
                </span>
              </div>

              <p className="mt-3 text-sm text-white/70">{s.pitch}</p>
              <p className="mt-1 text-sm text-white/50">{s.description}</p>

              <div className="mt-4 flex flex-wrap gap-6 text-xs text-white/40">
                <span>Setup: {formatCents(s.setupPriceCents)}</span>
                <span>Monthly: {formatCents(s.monthlyPriceCents)}</span>
                <span>Setup plan: {s.whopSetupPlanId ?? "—"}</span>
                <span>Monthly plan: {s.whopMonthlyPlanId ?? "—"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
