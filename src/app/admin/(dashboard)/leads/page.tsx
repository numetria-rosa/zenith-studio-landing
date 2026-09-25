import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { listLeadSourcesForHq } from "@/lib/hq/queries";
import { HqTopbar } from "../HqTopbar";

/* Leads (DESIGN.md 4.9), adapted: the prototype's single Booked/Showed/Won
   /Lost list assumes one lead funnel. This business runs three real ones -
   cold outreach that got a reply, free-audit submissions, and paid $35
   audit-call bookings - each with its own real status vocabulary, so they
   get their own section instead of being forced into one fake shared
   status. Deeper editing for each still lives on its existing dedicated
   page (Audits, Paid audit calls, and the cold-outreach campaign tools at
   /admin/outreach, kept alive but off the main nav). */
export default async function HqLeadsPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const { prospects, audits, paidAudits } = await listLeadSourcesForHq();
  const won = audits.filter((a) => a.status === "ACCEPTED").length + prospects.filter((p) => p.status === "CUSTOMER").length;

  return (
    <>
      <HqTopbar
        title="Leads"
        subtitle="Cold outreach, free audits and paid audit calls - your three real lead sources."
        action={
          <Link href="/admin/outreach" className="btn">
            Manage outreach campaign
          </Link>
        }
      />

      <div className="kpis">
        <div className="kpi">
          <span>Cold outreach replies</span>
          <b>{prospects.length}</b>
        </div>
        <div className="kpi">
          <span>Free audits</span>
          <b>{audits.length}</b>
        </div>
        <div className="kpi">
          <span>Paid audit calls</span>
          <b>{paidAudits.length}</b>
        </div>
        <div className="kpi">
          <span>Won</span>
          <b>{won}</b>
        </div>
      </div>

      <section className="card" style={{ marginBottom: 22 }}>
        <div className="ctop" style={{ padding: "20px 24px 0" }}>
          <h2>Cold outreach replies</h2>
          <Link href="/admin/outreach" className="link">
            All prospects
          </Link>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Business</th>
                <th>Niche</th>
                <th>Status</th>
                <th>Last touch</th>
              </tr>
            </thead>
            <tbody>
              {prospects.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="empty" style={{ border: "none" }}>
                      <b>No replies yet</b>
                    </div>
                  </td>
                </tr>
              )}
              {prospects.slice(0, 15).map((p) => (
                <tr key={p.id}>
                  <td>
                    <b>{p.businessName}</b>
                    <span className="sm">{p.city}</span>
                  </td>
                  <td className="muted">{p.niche}</td>
                  <td>
                    <span className={`pill ${p.status === "CUSTOMER" ? "p-ok" : "p-run"}`}>
                      <i />
                      {p.status.toLowerCase().replace("_", " ")}
                    </span>
                  </td>
                  <td className="muted">{(p.lastOutreachAt ?? p.updatedAt).toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 22 }}>
        <div className="ctop" style={{ padding: "20px 24px 0" }}>
          <h2>Free audits</h2>
          <Link href="/admin/audits" className="link">
            All audits
          </Link>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Submitted by</th>
                <th>Status</th>
                <th>Submitted</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="empty" style={{ border: "none" }}>
                      <b>No audits yet</b>
                    </div>
                  </td>
                </tr>
              )}
              {audits.slice(0, 15).map((a) => (
                <tr key={a.id}>
                  <td>
                    <b>{a.companyName || a.name || a.email}</b>
                    <span className="sm">{a.email}</span>
                  </td>
                  <td>
                    <span className={`pill ${a.status === "ACCEPTED" ? "p-ok" : a.status === "DECLINED" ? "p-bad" : "p-run"}`}>
                      <i />
                      {a.status.toLowerCase().replace("_", " ")}
                    </span>
                  </td>
                  <td className="muted">{a.createdAt.toISOString().slice(0, 10)}</td>
                  <td className="r">
                    {a.status === "ACCEPTED" ? (
                      <Link href="/admin/clients?new=1" className="btn" style={{ minHeight: 36, padding: "6px 12px", fontSize: 12.5 }}>
                        Start setup
                      </Link>
                    ) : (
                      <Link href={`/admin/audits/${a.id}`} className="link">
                        Open
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="ctop" style={{ padding: "20px 24px 0" }}>
          <h2>Paid audit calls</h2>
          <Link href="/admin/paid-audits" className="link">
            All bookings
          </Link>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Booked by</th>
                <th>Status</th>
                <th>Booked</th>
              </tr>
            </thead>
            <tbody>
              {paidAudits.length === 0 && (
                <tr>
                  <td colSpan={3}>
                    <div className="empty" style={{ border: "none" }}>
                      <b>No bookings yet</b>
                    </div>
                  </td>
                </tr>
              )}
              {paidAudits.slice(0, 15).map((p) => (
                <tr key={p.id}>
                  <td>
                    <b>{p.companyName || p.email}</b>
                    <span className="sm">{p.email}</span>
                  </td>
                  <td>
                    <span className={`pill ${p.status === "COMPLETED" ? "p-ok" : p.status === "CANCELLED" || p.status === "REFUNDED" ? "p-bad" : "p-run"}`}>
                      <i />
                      {p.status.toLowerCase().replace("_", " ")}
                    </span>
                  </td>
                  <td className="muted">{p.createdAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
