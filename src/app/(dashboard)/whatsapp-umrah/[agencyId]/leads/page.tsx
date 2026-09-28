import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency, listLeads } from "@/lib/whatsapp-umrah/dashboard-data";
import { updateLeadStatusAction } from "../actions";
import waStyles from "../waConsole.module.css";

const STATUSES = ["NEW", "QUALIFIED", "HOT", "HANDED_OFF", "WON", "LOST"] as const;
const BADGE_CLASS: Record<string, string> = { HOT: waStyles.badgeHot, QUALIFIED: waStyles.badgeQualified, NEW: waStyles.badgeNew };

export default async function LeadsPage({ params, searchParams }: { params: Promise<{ agencyId: string }>; searchParams: Promise<{ status?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const { status } = await searchParams;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const leads = await listLeads(agencyId, status);

  return (
    <div>
      <h1 className={waStyles.pageTitle}>Leads</h1>
      <p className={waStyles.pageDesc}>Every enquiry your agent has qualified, newest first.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <a href={`/whatsapp-umrah/${agencyId}/leads`} className={waStyles.badge} style={{ background: !status ? "var(--zc-raise)" : "transparent", border: "1px solid var(--zc-line-2)" }}>
          All
        </a>
        {STATUSES.map((s) => (
          <a
            key={s}
            href={`/whatsapp-umrah/${agencyId}/leads?status=${s}`}
            className={waStyles.badge}
            style={{ background: status === s ? "var(--zc-raise)" : "transparent", border: "1px solid var(--zc-line-2)" }}
          >
            {s.replace("_", " ")}
          </a>
        ))}
      </div>

      {leads.length === 0 ? (
        <p style={{ color: "var(--zc-muted)", fontSize: 14 }}>No leads yet.</p>
      ) : (
        <table className={waStyles.table}>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Status</th>
              <th>Dates</th>
              <th>Travellers</th>
              <th>Budget</th>
              <th>Package</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const updateStatus = updateLeadStatusAction.bind(null, agencyId, lead.id);
              return (
                <tr key={lead.id}>
                  <td>{lead.contact.name || lead.contact.phone}</td>
                  <td>
                    <span className={`${waStyles.badge} ${BADGE_CLASS[lead.status] ?? waStyles.badgeNew}`}>{lead.status.replace("_", " ")}</span>
                  </td>
                  <td>{lead.travelDates || "–"}</td>
                  <td>{lead.travelers ?? "–"}</td>
                  <td>{lead.budgetGbp ? `£${lead.budgetGbp}` : "–"}</td>
                  <td>{lead.packagePreference || "–"}</td>
                  <td>
                    <form action={updateStatus} style={{ display: "flex", gap: 6 }}>
                      <select name="status" defaultValue={lead.status} className={waStyles.select} style={{ fontSize: 12, padding: "4px 8px" }}>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      <button type="submit" style={{ fontSize: 12, color: "var(--zc-run-text)" }}>
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
