import { describe, expect, it } from "vitest";
import { demoHitFrom, injectAnalytics, isBotAgent } from "./static-html";

const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });
const BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";

describe("injectAnalytics", () => {
  it("adds the snippet before </head>, once", () => {
    const once = injectAnalytics("<html><head><title>x</title></head><body></body></html>");
    expect(once).toContain('src="/_vercel/insights/script.js"></script></head>');
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
