import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// The country demo pages are generated from the UK one (scripts/build-umrah-country-demos.mjs). If the UK page changes
// and the generator is not re-run, or the generator leaks UK text into another country, this fails.
const EXPECT = {
  us: { plan: "$52", words: "US dollars", city: "New York", checkout: "ch_3yCnqoK4wsfnVkJ", pack: "$9" },
  ca: { plan: "$83", words: "Canadian dollars", city: "Toronto", checkout: "ch_5gz3oRodm3dR7lb", pack: "$12 CAD" },
  au: { plan: "$85", words: "Australian dollars", city: "Sydney", checkout: "ch_3EmEku0gszYMzjv", pack: "$13 AUD" },
  za: { plan: "R900", words: "rand", city: "Johannesburg", checkout: "ch_Li6eHzPXGuRRKpT", pack: "R140" },
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
  it("says the business is Meta-verified and an approved Tech Provider, in the hero and the FAQ", () => {
    expect(html).toContain("Meta-verified business");
    expect(html).toContain("Is this approved by Meta?");
  });
  it("quotes the extra-replies pack in local currency", () => {
    expect(html).toContain(`Add 500 more replies for ${e.pack}`);
    expect(html).not.toContain("for £6");
  });
  it("sends buyers to this country's own local-currency checkout, never the UK pound one", () => {
    expect(html).toContain(`https://whop.com/checkout/${e.checkout}/`);
    expect(html).not.toContain("ch_M5XKy2oxQQkoO28");
    expect(html).not.toContain("mailto:");
  });
});

// France is generated in French (scripts/umrah-demo-fr.mjs), so it has its own checks instead of the English wording above.
describe("demo page: fr", () => {
  const html = readFileSync("public/demos/fr/whatsapp-umrah-agent.html", "utf8");
  it("is French, with the plan and the pack in euros written the French way", () => {
    expect(html).toContain('<html lang="fr">');
    expect(html).toContain("<b>45 €</b>");
    expect(html).toContain("Tarif en euros");
    expect(html).toContain("Ajoutez 500 réponses pour 8 €");
    expect(html).not.toMatch(/£|GBP|UK|pounds|Priced in/);
  });
  it("uses French cities and the French checkout", () => {
    expect(html).toContain("Paris");
    expect(html).not.toMatch(/(Manchester|Birmingham|Bradford|Leicester|London)/);
    expect(html).toContain("https://whop.com/checkout/ch_6TXEjCU7jRskGZY/");
    expect(html).not.toContain("ch_M5XKy2oxQQkoO28");
  });
  it("translates the page, the dashboard tour and its sample chats", () => {
    for (const text of ["Chaque demande d'Omra", "Votre tableau de bord, en visite guidée", "Cinq langues, détectées automatiquement", "Rendre à l", "Prospects chauds", "Wa alaykoum salam"]) expect(html).toContain(text);
    for (const english of ["Every Umrah enquiry", "Hand back to AI", "Take over any chat", "Four languages", "Answers from your packages"]) expect(html).not.toContain(english);
  });
});
