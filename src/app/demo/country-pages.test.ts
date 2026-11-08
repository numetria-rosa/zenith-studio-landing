import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// The country demo pages are generated from the UK one (scripts/build-umrah-country-demos.mjs). If the UK page changes
// and the generator is not re-run, or the generator leaks UK text into another country, this fails.
const EXPECT = {
  us: { plan: "$64", words: "US dollars", city: "New York" },
  ca: { plan: "$89", words: "Canadian dollars", city: "Toronto" },
  au: { plan: "$99", words: "Australian dollars", city: "Sydney" },
  za: { plan: "R1,049", words: "rand", city: "Johannesburg" },
} as const;

describe.each(Object.entries(EXPECT))("demo page: %s", (cc, e) => {
  const html = readFileSync(`public/demos/${cc}/whatsapp-umrah-agent.html`, "utf8");
  it("quotes the plan in local currency and nothing in pounds", () => {
    expect(html).toContain(`<b>${e.plan}</b>`);
    expect(html).toContain(`Priced in ${e.words}`);
    expect(html).not.toMatch(/£|GBP|\bUK\b|pounds/);
  });
  it("uses local cities, not UK ones", () => {
    expect(html).toContain(e.city);
    expect(html).not.toMatch(/\b(Manchester|Birmingham|Bradford|Leicester|London)\b/);
  });
  it("does not send buyers to the UK pound checkout", () => {
    expect(html).not.toContain("ch_M5XKy2oxQQkoO28");
  });
});
