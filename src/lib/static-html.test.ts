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
    expect(hit).toEqual({ path: "/demo/uk/whatsapp-umrah-agent", country: "GB", utmSource: "email", utmMedium: "cold", utmCampaign: "umrah-uk", referrer: "mail.google.com" });
  });
  it("ignores our own site as a referrer and skips bots", () => {
    expect(demoHitFrom("https://www.zenith-studio.site/services", h({ "user-agent": BROWSER, referer: "https://www.zenith-studio.site/" }))?.referrer).toBeNull();
    expect(demoHitFrom("https://www.zenith-studio.site/services", h({ "user-agent": "Googlebot" }))).toBeNull();
  });
});

describe("click tracker script", () => {
  const run = (href: string, classes: string[] = []) => {
    const html = injectAnalytics("<html><head></head></html>");
    const code = html.match(/<script>(\(function\(\)\{document\.addEventListener[\s\S]*?)<\/script>/)![1]!;
    const sent: { url: string; body: string }[] = [];
    let handler: (e: unknown) => void = () => {};
    const a = { href, classList: { contains: (c: string) => classes.includes(c) } };
    const doc = { addEventListener: (_t: string, f: (e: unknown) => void) => (handler = f) };
    const nav = { sendBeacon: (url: string, blob: { text: string }) => (sent.push({ url, body: blob.text }), true) };
    class FakeBlob { constructor(public parts: string[]) {} get text() { return this.parts.join(""); } }
    new Function("document", "navigator", "Blob", "location", code)(doc, nav, FakeBlob, { pathname: "/demo/uk/whatsapp-umrah-agent", search: "?utm_campaign=umrah-uk" });
    handler({ target: { closest: () => a } });
    return sent;
  };
  it("reports a click on a Whop checkout link", () => {
    const sent = run("https://whop.com/checkout/ch_M5XKy2oxQQkoO28/");
    expect(sent).toHaveLength(1);
    expect(sent[0]!.url).toBe("/api/demo-event");
    expect(JSON.parse(sent[0]!.body)).toMatchObject({ kind: "checkout", path: "/demo/uk/whatsapp-umrah-agent", href: "https://whop.com/checkout/ch_M5XKy2oxQQkoO28/" });
  });
  it("reports a Get started button as a start, and ignores other links", () => {
    expect(JSON.parse(run("https://x.test/#pricing", ["js-start"])[0]!.body).kind).toBe("start");
    expect(run("https://x.test/#faq")).toHaveLength(0);
  });
});
