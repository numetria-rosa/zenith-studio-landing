import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getHqClients, fmtMoney, SERVICE_ORDER, SERVICE_SHORT, type ClientStatus } from "@/lib/hq";
import { createClient } from "@/lib/hq/actions";
import { HqTopbar } from "../HqTopbar";
import { ServiceTag } from "../ServiceTag";
import { StatusPill, HealthBar } from "../Pill";
import { NewClientDialog } from "../NewClientDialog";
import { Toast } from "../Toast";
import { Icon } from "../Icon";

const STATUS_FILTERS: { value: ClientStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "setup", label: "Setup" },
  { value: "paused", label: "Paused" },
];

export default async function HqClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; service?: string; status?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const { q, service, status } = await searchParams;

  const clients = await getHqClients();
  const now = new Date();
  const query = (q ?? "").trim().toLowerCase();
  const svcFilter = service && (SERVICE_ORDER as readonly string[]).includes(service) ? service : "all";
  const stFilter = status && STATUS_FILTERS.some((s) => s.value === status) ? status : "all";

  const filtered = clients.filter((c) => {
    if (svcFilter !== "all" && c.service !== svcFilter) return false;
    if (stFilter !== "all" && c.status !== stFilter) return false;
    if (query && !`${c.name} ${c.contactName} ${SERVICE_SHORT[c.service]}`.toLowerCase().includes(query)) return false;
    return true;
  });

  async function addClient(formData: FormData): Promise<void> {
    "use server";
    const projectId = await createClient({
      businessName: String(formData.get("businessName") || ""),
      contactEmail: String(formData.get("contactEmail") || ""),
      contactName: String(formData.get("contactName") || ""),
      serviceSlug: String(formData.get("serviceSlug") || ""),
      billingCycle: (String(formData.get("billingCycle") || "monthly") as "monthly" | "quarterly"),
    });
    redirect(`/admin/clients/${projectId}?flash=${encodeURIComponent("Client added · setup clock started")}`);
  }

  return (
    <>
      <HqTopbar
        title="Clients"
        subtitle={`${clients.length} clients across ${SERVICE_ORDER.length} services.`}
        action={
          <Link href="/admin/clients?new=1" className="btn go">
            <Icon name="plus" size={16} color="#04140C" strokeWidth={2.2} />
            New client
          </Link>
        }
      />

      <div className="bar2">
        <div className="filters" role="group" aria-label="Service">
          <Link href="/admin/clients" aria-pressed={svcFilter === "all"}>
            All services
          </Link>
          {SERVICE_ORDER.map((s) => (
            <Link key={s} href={`/admin/clients?service=${s}`} aria-pressed={svcFilter === s}>
              {SERVICE_SHORT[s]}
            </Link>
          ))}
        </div>
        <div className="seg" role="group" aria-label="Status">
          {STATUS_FILTERS.map((s) => (
            <Link key={s.value} href={s.value === "all" ? "/admin/clients" : `/admin/clients?status=${s.value}`} aria-pressed={stFilter === s.value}>
              {s.label} {s.value === "all" ? clients.length : clients.filter((c) => c.status === s.value).length}
            </Link>
          ))}
        </div>
      </div>

      <section className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Client</th>
                <th>Service</th>
                <th>Status</th>
                <th className="r">Plan</th>
                <th>Agents</th>
                <th>Health</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty" style={{ border: "none" }}>
                      <b>No clients match</b>Try another filter.
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((c) => {
                const on = c.agents.filter((a) => a.tone === "run" || a.tone === "done" || a.tone === "need").length;
                const needy = c.agents.filter((a) => a.real && a.tone === "need").length;
                return (
                  <tr className="click" key={c.id}>
                    <td>
                      <Link href={`/admin/clients/${c.id}`} className="rowbtn">
                        <b>{c.name}</b>
                        <span className="sm">{c.contactName}</span>
                      </Link>
                    </td>
                    <td>
                      <ServiceTag service={c.service} />
                    </td>
                    <td>
                      <StatusPill client={c} now={now} />
                    </td>
                    <td className="r num">
                      <b className={c.status !== "active" ? "muted" : undefined}>{fmtMoney(c.priceCents)}</b>
                      <span className="sm">{c.billingCycle}</span>
                    </td>
                    <td>
                      {on} / {c.agents.length} on{needy > 0 && <> · <span style={{ color: "#FF9BAE" }}>{needy} needs you</span></>}
                    </td>
                    <td>
                      <HealthBar health={c.health} />
                    </td>
                    <td className="muted">{c.since.toISOString().slice(0, 10)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <NewClientDialog action={addClient} />
      <Toast />
    </>
  );
}
