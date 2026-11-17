import { describe, expect, it } from "vitest";
import { demoHitFrom, injectAnalytics, isBotAgent } from "./static-html";

const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });
const BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";

describe("injectAnalytics", () => {
  it("adds the snippet before </head>, once", () => {
    const once = injectAnalytics("<html><head><title>x</title></head><body></body></html>");
    expect(once).toContain('src="/_vercel/insights/script.js"');
    expect(once).toMatch(/<\/script><\/head>/);
    expect(injectAnalytics(once)).toBe(once);
  });
  it("puts it at the top when there is no head", () => {
    expect(injectAnalytics("<p>hi</p>").startsWith("<script>")).toBe(true);
  });
});

describe("isBotAgent", () => {
  it("lets real browsers through and drops scanners and previews", () => {
    expect(isBotAgent(BROWSER)).toBe(false);
    expect(isBotAgent("Googlebot/2.1")).toBe(true);
    expect(isBotAgent("Mozilla/5.0 (compatible; Microsoft Outlook Safelinks)")).toBe(true);
    expect(isBotAgent("Slackbot-LinkExpanding 1.0")).toBe(true);
    expect(isBotAgent(null)).toBe(true);
  });
});

describe("demoHitFrom", () => {
  it("keeps the path, country, UTM tags and an outside referrer", () => {
    const hit = demoHitFrom(
      "https://www.zenith-studio.site/demo/uk/whatsapp-umrah-agent?utm_source=email&utm_medium=cold&utm_campaign=umrah-uk",
      h({ "user-agent": BROWSER, "x-vercel-ip-country": "GB", referer: "https://mail.google.com/" }),
    );
    expect(hit).toEqual({ path: "/demo/uk/whatsapp-umrah-agent", country: "GB", utmSource: "email", utmMedium: "cold", utmCampaign: "umrah-uk", contact: null, referrer: "mail.google.com" });
  });
  it("ignores our own site as a referrer and skips bots", () => {
    expect(demoHitFrom("https://www.zenith-studio.site/services", h({ "user-agent": BROWSER, referer: "https://www.zenith-studio.site/" }))?.referrer).toBeNull();
    expect(demoHitFrom("https://www.zenith-studio.site/services", h({ "user-agent": "Googlebot" }))).toBeNull();
  });
});

describe("click tracker script", () => {
  type Ev = Record<string, unknown>;
  /** Runs the served script against a tiny fake browser and returns the beacons it sent. */
  const setup = () => {
    const html = injectAnalytics("<html><head></head></html>");
    const code = html.match(/<script>(\(function\(\)\{var v=[\s\S]*?)<\/script>/)![1]!;
    const sent: Ev[] = [];
    const listeners: Record<string, (e?: unknown) => void> = {};
    const timers: (() => void)[] = [];
    const win = { scrollY: 0, innerHeight: 1000, addEventListener: (t: string, f: () => void) => (listeners[t] = f) };
    const doc = { visibilityState: "visible", documentElement: { scrollHeight: 5000 }, addEventListener: (t: string, f: (e: unknown) => void) => (listeners[t] = f) };
    const nav = { sendBeacon: (_u: string, blob: { text: string }) => (sent.push(JSON.parse(blob.text)), true) };
    class FakeBlob { constructor(public parts: string[]) {} get text() { return this.parts.join(""); } }
    new Function("document", "window", "navigator", "Blob", "location", "setInterval", code)(doc, win, nav, FakeBlob, { pathname: "/demo/uk/whatsapp-umrah-agent", search: "?utm_campaign=umrah-uk&utm_content=0uxipfc5" }, (f: () => void) => timers.push(f));
    const click = (o: { href?: string; classes?: string[]; match?: string; data?: string }) => {
      const a = o.href ? { href: o.href, classList: { contains: (c: string) => (o.classes ?? []).includes(c) } } : null;
      const hit = (sel: string) => (o.match && sel.includes(o.match) ? { getAttribute: () => o.data ?? "" } : null);
      listeners.click!({ target: { closest: (sel: string) => (sel === "a" ? a : hit(sel)) } });
    };
    return { sent, win, click, scroll: () => listeners.scroll!(), tick: (n: number) => { for (let i = 0; i < n; i++) timers.forEach((f) => f()); } };
  };

  it("reports a click on a Whop checkout link, with the page, the link and a visit id", () => {
    const t = setup();
    t.click({ href: "https://whop.com/checkout/ch_M5XKy2oxQQkoO28/" });
    expect(t.sent).toHaveLength(1);
    expect(t.sent[0]).toMatchObject({ kind: "checkout", path: "/demo/uk/whatsapp-umrah-agent", search: "?utm_campaign=umrah-uk&utm_content=0uxipfc5", href: "https://whop.com/checkout/ch_M5XKy2oxQQkoO28/" });
    expect(String(t.sent[0]!.visit)).toMatch(/^[a-z0-9]{4,16}$/);
  });
  it("reports a Get started button as a start, and ignores other links", () => {
    const t = setup();
    t.click({ href: "https://x.test/#pricing", classes: ["js-start"] });
    t.click({ href: "https://x.test/#faq" });
    expect(t.sent.map((e) => e.kind)).toEqual(["start"]);
  });
  it("reports the chat demo, a simulator scenario, a dashboard tab and the FAQ once each", () => {
    const t = setup();
    t.click({ match: "#playBtn" });
    t.click({ match: "#playBtn" });
    t.click({ match: "[data-sim]", data: "2" });
    t.click({ match: "[data-view]", data: "leads" });
    t.click({ match: "details.faq" });
    expect(t.sent.map((e) => e.target)).toEqual(["play", "sim:2", "view:leads", "faq"]);
  });
  it("reports scroll depth as it grows, and time on the page", () => {
    const t = setup();
    t.win.scrollY = 1100; // 1100 of 4000 scrollable = 27 percent
    t.scroll();
    t.win.scrollY = 4000;
    t.scroll();
    t.tick(30);
    expect(t.sent.map((e) => e.target)).toEqual(["scroll:25", "scroll:50", "scroll:75", "scroll:90", "time:30"]);
  });
});
