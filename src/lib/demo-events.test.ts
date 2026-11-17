import { describe, expect, it } from "vitest";
import { agencyActiveAlertText, checkoutAlertText, demoEventFrom, engageLabel } from "./demo-events";

const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });
const BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const ok = { "user-agent": BROWSER, origin: "https://www.zenith-studio.site", "x-vercel-ip-country": "US" };

describe("demoEventFrom", () => {
  it("stores a checkout click with its checkout id, country and campaign", () => {
    const e = demoEventFrom({ kind: "checkout", path: "/demo/us/whatsapp-umrah-agent", search: "?utm_campaign=umrah-us&utm_source=email", href: "https://whop.com/checkout/ch_M5XKy2oxQQkoO28/" }, h(ok));
    expect(e).toMatchObject({ kind: "checkout", target: "ch_M5XKy2oxQQkoO28", country: "US", utmCampaign: "umrah-us", utmSource: "email" });
  });
  it("ignores bots, other sites, unknown kinds and pages outside the public ones", () => {
    const body = { kind: "checkout", path: "/demo/us/x", href: "" };
    expect(demoEventFrom(body, h({ ...ok, "user-agent": "Googlebot" }))).toBeNull();
    expect(demoEventFrom(body, h({ ...ok, origin: "https://evil.example" }))).toBeNull();
    expect(demoEventFrom({ ...body, kind: "view" }, h(ok))).toBeNull();
    expect(demoEventFrom({ ...body, path: "/admin/clients" }, h(ok))).toBeNull();
    expect(demoEventFrom("nonsense", h(ok))).toBeNull();
  });
});

describe("checkoutAlertText", () => {
  it("names the page, the checkout link and the campaign", () => {
    const t = checkoutAlertText({ kind: "checkout", path: "/demo/uk/whatsapp-umrah-agent", target: "ch_1", country: "GB", utmSource: "email", utmMedium: "cold", utmCampaign: "umrah-uk", contact: null, visit: null });
    expect(t.subject).toContain("/demo/uk/whatsapp-umrah-agent");
    expect(t.body).toContain("ch_1");
    expect(t.body).toContain("umrah-uk (email / cold)");
  });
});

describe("engagement events", () => {
  const search = "?utm_campaign=umrah-uk&utm_content=0uxipfc5";
  it("keeps an allowed engagement with the agency code and visit id", () => {
    const e = demoEventFrom({ kind: "engage", target: "scroll:50", path: "/demo/uk/whatsapp-umrah-agent", search, visit: "abc123xy" }, h(ok));
    expect(e).toMatchObject({ kind: "engage", target: "scroll:50", contact: "0uxipfc5", visit: "abc123xy" });
  });
  it("drops engagement targets that are not on the list, and malformed agency codes", () => {
    const base = { kind: "engage", path: "/demo/uk/x", search };
    expect(demoEventFrom({ ...base, target: "drop table" }, h(ok))).toBeNull();
    expect(demoEventFrom({ ...base, target: "scroll:33" }, h(ok))).toBeNull();
    expect(demoEventFrom({ ...base, target: "play", search: "?utm_content=<script>" }, h(ok))?.contact).toBeNull();
  });
  it("words the alerts for a named agency", () => {
    const e = demoEventFrom({ kind: "engage", target: "view:leads", path: "/demo/uk/whatsapp-umrah-agent", search }, h(ok))!;
    expect(agencyActiveAlertText(e, "Crescent Tours")).toMatchObject({ subject: "Crescent Tours is looking at the demo" });
    expect(engageLabel("scroll:90")).toBe("scrolled 90 percent of the page");
    expect(checkoutAlertText({ ...e, kind: "checkout", target: "ch_1" }, "Crescent Tours").subject).toBe("Crescent Tours clicked checkout on /demo/uk/whatsapp-umrah-agent");
  });
});
