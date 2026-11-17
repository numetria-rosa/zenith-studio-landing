import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { HqTopbar } from "../HqTopbar";

/* Visits to the demo pages and the services catalog, counted by src/lib/static-html.ts (Vercel Analytics could not see
   these pages, and its UTM breakdown is a paid add-on). Bots and link scanners are left out. */
const DAYS = 30;
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

export default async function HqDemoVisitsPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const since = daysAgo(DAYS);
  const [rows, recent] = await Promise.all([
    db.demoHit.groupBy({ by: ["path", "country", "utmCampaign"], where: { createdAt: { gte: since } }, _count: { _all: true }, orderBy: { _count: { id: "desc" } }, take: 100 }),
    db.demoHit.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);
  const total = rows.reduce((n, r) => n + r._count._all, 0);

  return (
    <>
      <HqTopbar title="Demo visits" subtitle={`Opens of the demo pages and the services catalog in the last ${DAYS} days: ${total} in total. Bots and link scanners are not counted. A visit tagged with a campaign came from that email batch.`} />
      <section className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Page</th>
                <th>Country</th>
                <th>Campaign</th>
                <th>Visits</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="empty" style={{ border: "none" }}>
                      <b>No visits yet</b>
                      Visits are recorded from the first deploy that includes this page.
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={`${r.path}|${r.country}|${r.utmCampaign}`}>
                  <td>{r.path}</td>
                  <td>{r.country ?? "unknown"}</td>
                  <td className="muted">{r.utmCampaign ?? "none"}</td>
                  <td>{r._count._all}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card" style={{ marginTop: 16 }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>When (UTC)</th>
                <th>Page</th>
                <th>Country</th>
                <th>From</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((h) => (
                <tr key={h.id}>
                  <td className="muted">{h.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                  <td>{h.path}</td>
                  <td>{h.country ?? "unknown"}</td>
                  <td className="muted">{h.utmSource ? `${h.utmSource}${h.utmMedium ? ` / ${h.utmMedium}` : ""}` : h.referrer ?? "direct"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
