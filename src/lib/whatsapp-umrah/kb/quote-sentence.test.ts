import { describe, expect, it } from "vitest";
import { detectParty, matchPackage, quoteRequest, quoteSentence, type QuotePackage } from "./quote-sentence";

const P = (name: string, type: string, price: number, deposit: number | null, basis = ""): QuotePackage => ({ name, type, pricePerPerson: price, deposit, priceBasis: basis });
const PACKAGES = [
  P("7 Night Economy Umrah", "Umrah", 1295, 200, "quad sharing"),
  P("10 Night Premium Umrah", "Umrah", 2450, 400, "twin sharing"),
  P("Ramadan Umrah 2027, last 10 nights", "Ramadan Umrah", 3950, 750, "twin sharing"),
  P("Family Group Umrah, Easter 2027", "Group package", 1650, 300, "per adult, triple sharing"),
];

describe("detectParty", () => {
  it.each([
    ["how much for 2 of us", 2],
    ["the two of us", 2],
    ["ok book the ramadan one for 2, how do we pay?", 2],
    ["we are 4 people", 4],
    ["for three adults", 3],
    ["both of us", 2],
    ["me and my mom", 2],
    ["just me", 1],
  ])("%s -> %s", (text, n) => expect(detectParty(text)).toBe(n));
  it("does not mistake a number of nights or a year for the party", () => {
    expect(detectParty("for 10 nights please")).toBeNull();
    expect(detectParty("ramadan 2027")).toBeNull();
    expect(detectParty("how much is it?")).toBeNull();
  });
});

describe("matchPackage", () => {
  it("finds the package a message points at", () => {
    expect(matchPackage("ok book the ramadan one", PACKAGES)?.name).toMatch(/Ramadan/);
    expect(matchPackage("the economy one please", PACKAGES)?.name).toBe("7 Night Economy Umrah");
    expect(matchPackage("easter family package", PACKAGES)?.name).toMatch(/Family Group/);
    expect(matchPackage("10 night premium", PACKAGES)?.name).toBe("10 Night Premium Umrah");
  });
  it("forgives a one-letter slip, and lets a shared year break a tie but never pick a package", () => {
    expect(matchPackage("umrah with my mom in ramadhan 2027", PACKAGES)?.name).toMatch(/Ramadan/);
    expect(matchPackage("anything in 2027?", PACKAGES)).toBeNull();
  });
  it("returns nothing when the message names none, or fits more than one equally", () => {
    expect(matchPackage("how much is it?", PACKAGES)).toBeNull();
    expect(matchPackage("night", PACKAGES)).toBeNull();
  });
});

describe("quoteSentence", () => {
  it("writes the group total, the deposit and the balance, with the per-person figures labelled", () => {
    expect(quoteSentence(PACKAGES[2], 2)).toBe("Ramadan Umrah 2027, last 10 nights for 2 travellers: \u00A37,900 in total (\u00A33,950 per person, twin sharing). Deposit \u00A31,500 (\u00A3750 per person). Balance after the deposit \u00A36,400.");
  });
  it("is plain for one traveller and when there is no deposit", () => {
    expect(quoteSentence(PACKAGES[0], 1)).toContain("for 1 traveller: \u00A31,295 in total");
    expect(quoteSentence(P("No deposit pack", "Umrah", 1000, null), 3)).toBe("No deposit pack for 3 travellers: \u00A33,000 in total (\u00A31,000 per person).");
  });
});

describe("quoteRequest", () => {
  it("quotes when the message gives the package and the party", () => {
    const r = quoteRequest({ message: "ok book the ramadan one for 2, how do we pay?" }, PACKAGES);
    expect(r?.party).toBe(2);
    expect(r?.sentence).toContain("\u00A37,900 in total");
  });
  it("uses what the chat already told us for the part the message leaves out", () => {
    const r = quoteRequest({ message: "yes the ramadan one", knownTravellers: 3 }, PACKAGES);
    expect(r?.sentence).toContain("for 3 travellers: \u00A311,850");
    expect(quoteRequest({ message: "how much for 2?", knownPackage: "10 Night Premium Umrah" }, PACKAGES)?.sentence).toContain("\u00A34,900");
  });
  it("does not quote without both, or for a party with children (priced from the package text)", () => {
    expect(quoteRequest({ message: "how much is the ramadan one?" }, PACKAGES)).toBeNull();
    expect(quoteRequest({ message: "how much for 2?" }, PACKAGES)).toBeNull();
    expect(quoteRequest({ message: "2 adults and 1 child on the easter family package" }, PACKAGES)).toBeNull();
  });
});
