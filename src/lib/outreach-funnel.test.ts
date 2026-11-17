import { describe, expect, it } from "vitest";
import { agenciesToFollowUp, funnelByMarket, type FunnelContact, type FunnelHit } from "./outreach-funnel";

const d = (s: string) => new Date(s);
const contacts: FunnelContact[] = [
  { code: "aaaaaaa1", name: "Crescent Tours", market: "au", status: "delivered", emailedAt: d("2026-11-12"), repliedAt: null, suppressed: false },
  { code: "aaaaaaa2", name: "Lakemba Travel", market: "au", status: "bounced", emailedAt: d("2026-11-12"), repliedAt: null, suppressed: false },
  { code: "bbbbbbb1", name: "Medina Tours", market: "uk", status: "delivered", emailedAt: d("2026-11-13"), repliedAt: d("2026-11-15"), suppressed: true },
  { code: "bbbbbbb2", name: "Not yet emailed", market: "uk", status: "queued", emailedAt: null, repliedAt: null, suppressed: false },
];
const hit = (o: Partial<FunnelHit> & { kind: string }): FunnelHit => ({ target: null, contact: null, utmCampaign: null, createdAt: d("2026-11-17T10:00:00Z"), ...o });
const hits: FunnelHit[] = [
  hit({ kind: "view", contact: "aaaaaaa1", utmCampaign: "umrah-au" }),
  hit({ kind: "view", utmCampaign: "umrah-au" }), // anonymous, from the first batch (no agency code)
  hit({ kind: "engage", target: "scroll:90", contact: "aaaaaaa1", utmCampaign: "umrah-au" }),
  hit({ kind: "engage", target: "play", contact: "aaaaaaa1", utmCampaign: "umrah-au", createdAt: d("2026-11-17T10:05:00Z") }),
  hit({ kind: "checkout", target: "ch_1", contact: "aaaaaaa1", utmCampaign: "umrah-au" }),
  hit({ kind: "view", contact: "bbbbbbb1" }), // no campaign tag: the market comes from the agency
  hit({ kind: "view", utmCampaign: "other-campaign" }), // not an outreach market: ignored
  hit({ kind: "view", contact: "aaaaaaa1", utmCampaign: "umrah-au-followup1" }), // a follow-up campaign still counts for its market
];

describe("funnelByMarket", () => {
  const rows = funnelByMarket(contacts, hits);
  const au = rows.find((r) => r.market === "au")!;
  const uk = rows.find((r) => r.market === "uk")!;
  it("counts the email side per market", () => {
    expect(au).toMatchObject({ agencies: 2, emailed: 2, delivered: 1, bounced: 1, replied: 0 });
    expect(uk).toMatchObject({ agencies: 2, emailed: 1, delivered: 1, replied: 1 });
  });
  it("counts the website side per market, naming agencies where the link had a code", () => {
    expect(au).toMatchObject({ views: 3, openedAgencies: 1, engagedAgencies: 1, checkoutClicks: 1, startClicks: 0 });
    expect(uk).toMatchObject({ views: 1, openedAgencies: 1, engagedAgencies: 0 });
  });
  it("puts markets in a fixed order", () => {
    expect(rows.map((r) => r.market)).toEqual(["uk", "au"]);
  });
});

describe("agenciesToFollowUp", () => {
  it("ranks a checkout click above reading, and lists what each agency did", () => {
    const list = agenciesToFollowUp(contacts, hits);
    expect(list.map((a) => a.name)).toEqual(["Crescent Tours", "Medina Tours"]);
    expect(list[0]).toMatchObject({ code: "aaaaaaa1", replied: false });
    expect(list[0]!.did).toEqual(expect.arrayContaining(["Clicked checkout", "Played the chat demo", "Scrolled to the end"]));
    expect(list[1]).toMatchObject({ did: ["Opened the page only"], replied: true, suppressed: true });
  });
});
