import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getWhopClient } from "@/lib/whop";
import { agenciesToFollowUp, funnelByMarket } from "@/lib/outreach-funnel";
import { HqTopbar } from "../HqTopbar";

/* The Umrah cold-email funnel, per market: emailed, delivered, replied, who opened their link and who did something on the
   page, checkout clicks and payments. Below it, the named agencies to follow up first. The email side comes from
   OutreachContact (kept current by scripts/umrah-sync.mjs), the website side from DemoHit, payments from Whop. */
const DAYS = 60;
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

/** Paid WhatsApp agent payments in Whop, or null when Whop cannot be read right now. */
async function paidWhatsAppPayments(): Promise<number | null> {
  try {
    let n = 0;
    for await (const p of getWhopClient().payments.list({ company_id: process.env.WHOP_COMPANY_ID!, statuses: ["paid"] })) {
      if (/whatsapp ai agent/i.test(p.product?.title ?? "")) n++;
    }
    return n;
  } catch {
    return null;
  }
}

const when = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");

export default async function HqOutreachFunnelPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const [contacts, hits, paid] = await Promise.all([
    db.outreachContact.findMany({ select: { code: true, name: true, market: true, status: true, emailedAt: true, repliedAt: true, suppressed: true } }),
    db.demoHit.findMany({ where: { createdAt: { gte: daysAgo(DAYS) } }, select: { kind: true, target: true, contact: true, utmCampaign: true, createdAt: true }, take: 50000 }),
    paidWhatsAppPayments(),
  ]);
  const rows = funnelByMarket(contacts, hits);
  const agencies = agenciesToFollowUp(contacts, hits);
  const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((n, r) => n + f(r), 0);

  return (
    <>
      <HqTopbar
        title="Outreach funnel"
        subtitle={`Umrah cold emails, last ${DAYS} days of website activity. "Opened" can include a security scanner that behaves like a browser; "Engaged" (played the demo, scrolled, stayed) is the human signal. Agencies emailed before 17 Nov have links without a code, so their visits count by market only. ${paid === null ? "Payments could not be read from Whop right now." : `Paid WhatsApp agent payments in Whop: ${paid}.`}`}
      />
      <section className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Market</th>
                <th>Agencies</th>
                <th>Emailed</th>
                <th>Delivered</th>
                <th>Bounced</th>
                <th>Replied</th>
                <th>Page views</th>
                <th>Opened (named)</th>
                <th>Engaged (named)</th>
                <th>Get started</th>
                <th>Checkout clicks</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11}>
                    <div className="empty" style={{ border: "none" }}>
                      <b>Nothing yet</b>
                      Run scripts/umrah-sync.mjs to load the agencies, and the website counts appear as visitors arrive.
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.market}>
                  <td>
                    <b>{r.market.toUpperCase()}</b>
                  </td>
                  <td>{r.agencies}</td>
                  <td>{r.emailed}</td>
                  <td>{r.delivered}</td>
                  <td>{r.bounced}</td>
                  <td>{r.replied}</td>
                  <td>{r.views}</td>
                  <td>{r.openedAgencies}</td>
                  <td>{r.engagedAgencies}</td>
                  <td>{r.startClicks}</td>
                  <td>{r.checkoutClicks}</td>
                </tr>
              ))}
              {rows.length > 1 && (
                <tr>
                  <td>
                    <b>All</b>
                  </td>
                  <td>{sum((r) => r.agencies)}</td>
                  <td>{sum((r) => r.emailed)}</td>
                  <td>{sum((r) => r.delivered)}</td>
                  <td>{sum((r) => r.bounced)}</td>
                  <td>{sum((r) => r.replied)}</td>
                  <td>{sum((r) => r.views)}</td>
                  <td>{sum((r) => r.openedAgencies)}</td>
                  <td>{sum((r) => r.engagedAgencies)}</td>
                  <td>{sum((r) => r.startClicks)}</td>
                  <td>{sum((r) => r.checkoutClicks)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 16 }}>Agencies to follow up first</h2>
        <p className="muted" style={{ margin: "0 0 12px" }}>
          Named agencies that opened their own link, most interested first. A checkout click ranks above everything. Agencies that replied or opted out are marked, so you do not chase them.
        </p>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Agency</th>
                <th>Market</th>
                <th>What they did</th>
                <th>Last activity (UTC)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {agencies.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty" style={{ border: "none" }}>
                      <b>No named agency has opened its link yet</b>
                      Links with an agency code go out from the 17 Nov batch and the follow-ups.
                    </div>
                  </td>
                </tr>
              )}
              {agencies.map((a) => (
                <tr key={a.code}>
                  <td>
                    <b>{a.name}</b>
                  </td>
                  <td>{a.market.toUpperCase()}</td>
                  <td>{a.did.join(", ")}</td>
                  <td className="muted">{when(a.lastAt)}</td>
                  <td>{a.suppressed ? "Do not contact" : a.replied ? "Replied" : "Follow up"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
