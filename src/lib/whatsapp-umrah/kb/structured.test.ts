import { describe, expect, it } from "vitest";
import { faqToText, packageToText, parseFaqForm, parsePackageForm } from "./structured";

function form(values: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

const base = {
  name: "Economy Umrah",
  type: "Umrah",
  description: "A simple 10 night trip.",
  nightsMakkah: "6",
  nightsMadinah: "4",
  makkahName: "Al Safwah",
  makkahStars: "4",
  makkahDistance: "400",
  madinahName: "Dar Al Iman",
  madinahStars: "3",
  madinahDistance: "250",
  pricePerPerson: "£1,295",
  priceBasis: "quad sharing",
  deposit: "300",
  departureAirports: "Birmingham, London Heathrow",
  included: "Return flights\n- Visa\n• Transfers",
  excluded: "Lunch and dinner",
};

describe("parsePackageForm", () => {
  it("reads the fields and normalises the price", () => {
    const r = parsePackageForm(form(base));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.fields.pricePerPerson).toBe(1295);
    expect(r.fields.nightsMakkah + r.fields.nightsMadinah).toBe(10);
    expect(r.fields.included).toEqual(["Return flights", "Visa", "Transfers"]);
    expect(r.fields.makkahHotel).toEqual({ name: "Al Safwah", stars: 4, distanceMetres: 400 });
  });

  it("rejects a package with no name, no price or no nights", () => {
    expect(parsePackageForm(form({ ...base, name: "" })).ok).toBe(false);
    expect(parsePackageForm(form({ ...base, pricePerPerson: "0" })).ok).toBe(false);
    expect(parsePackageForm(form({ ...base, nightsMakkah: "0", nightsMadinah: "0" })).ok).toBe(false);
  });

  it("ignores impossible star ratings", () => {
    const r = parsePackageForm(form({ ...base, makkahStars: "9" }));
    expect(r.ok && r.fields.makkahHotel.stars).toBeNull();
  });
});

describe("packageToText", () => {
  it("writes every fact the AI may quote, one labelled line each, as a single chunk", () => {
    const r = parsePackageForm(form(base));
    if (!r.ok) throw new Error("form should parse");
    const text = packageToText(r.fields);
    expect(text).toContain("Package: Economy Umrah (Umrah).");
    expect(text).toContain("Duration: 10 nights (6 in Makkah, 4 in Madinah).");
    expect(text).toContain("Makkah hotel: Al Safwah, 4-star, 400 metres from the Haram.");
    expect(text).toContain("Price: £1,295 per person (quad sharing).");
    expect(text).toContain("Deposit: £300 per person.");
    expect(text).toContain("Included: Return flights; Visa; Transfers.");
    expect(text).not.toMatch(/\n\s*\n/);
  });

  it("leaves out fields that were not filled in", () => {
    const r = parsePackageForm(form({ name: "Basic", pricePerPerson: "999", nightsMakkah: "5", nightsMadinah: "0" }));
    if (!r.ok) throw new Error("form should parse");
    const text = packageToText(r.fields);
    expect(text).not.toContain("Deposit");
    expect(text).not.toContain("hotel");
    expect(text).toContain("Duration: 5 nights (5 in Makkah).");
  });
});

describe("FAQ", () => {
  it("needs both a question and an answer", () => {
    expect(parseFaqForm(form({ question: "Do you offer visas?", answer: "" })).ok).toBe(false);
    const r = parseFaqForm(form({ question: "Do you offer visas?", answer: "Yes, included in every package." }));
    expect(r.ok && faqToText(r.fields)).toBe("FAQ. Question: Do you offer visas?\nAnswer: Yes, included in every package.");
  });
});
