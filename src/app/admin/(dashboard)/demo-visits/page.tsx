import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { HqTopbar } from "../HqTopbar";

/* Visits to the demo pages and the services catalog, counted by src/lib/static-html.ts (Vercel Analytics could not see
   these pages, and its UTM breakdown is a paid add-on). Bots and link scanners are left out. */
const DAYS = 30;
const KIND_LABEL: Record<string, string> = { view: "Page view", start: "Get started click", checkout: "Checkout click" };
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

export default async function HqDemoVisitsPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const since = daysAgo(DAYS);
  const [rows, recent, byKind] = await Promise.all([
    db.demoHit.groupBy({ by: ["path", "country", "utmCampaign", "kind"], where: { createdAt: { gte: since } }, _count: { _all: true }, orderBy: { _count: { id: "desc" } }, take: 100 }),
    db.demoHit.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 25 }),
    db.demoHit.groupBy({ by: ["kind"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
  ]);
  const count = (kind: string) => byKind.find((k) => k.kind === kind)?._count._all ?? 0;

  return (
    <>
      <HqTopbar title="Demo visits" subtitle={`Last ${DAYS} days: ${count("view")} page views, ${count("start")} Get started clicks, ${count("checkout")} checkout clicks. A checkout click also emails you. Bots and link scanners are not counted. A campaign tag means the visitor came from that email batch.`} />
      <section className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Page</th>
                <th>Country</th>
                <th>Campaign</th>
                <th>What</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty" style={{ border: "none" }}>
                      <b>No visits yet</b>
                      Visits are recorded from the first deploy that includes this page.
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={`${r.path}|${r.country}|${r.utmCampaign}|${r.kind}`}>
                  <td>{r.path}</td>
                  <td>{r.country ?? "unknown"}</td>
                  <td className="muted">{r.utmCampaign ?? "none"}</td>
                  <td>{KIND_LABEL[r.kind] ?? r.kind}</td>
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
                <th>What</th>
                <th>Country</th>
                <th>From</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((h) => (
                <tr key={h.id}>
                  <td className="muted">{h.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                  <td>{h.path}</td>
                  <td>{KIND_LABEL[h.kind] ?? h.kind}</td>
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
