import { describe, expect, it } from "vitest";
import { PACKAGE_FORM_DEFAULTS, packageFromJson, parsePackageForm, type PackageFields } from "./structured";
import { answerChecks, draftFromFields, draftToFormEntries, emptyDraft, exampleAnswer, firstProblem, splitAirports, stepStates, walkMinutes, type PackageDraft } from "./package-form";

const toFormData = (d: PackageDraft) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(draftToFormEntries(d))) fd.set(k, v);
  return fd;
};
const parse = (d: PackageDraft) => {
  const r = parsePackageForm(toFormData(d));
  if (!r.ok) throw new Error(r.error);
  return r.fields;
};

const economy: PackageFields = {
  ...PACKAGE_FORM_DEFAULTS,
  name: "7 Night Economy Umrah",
  nightsMakkah: 4,
  nightsMadinah: 3,
  makkahHotel: { name: "Dar Al Safa Hotel", stars: 3, distanceMetres: 600 },
  pricePerPerson: 1295,
  priceBasis: "Quad sharing",
  departureAirports: "London Heathrow, Manchester, Birmingham",
  included: ["Return flights", "Visa", "Airport transfers", "Breakfast"],
  excluded: ["Lunch and dinner", "Ziyarat tours"],
};

describe("package form draft", () => {
  it("a new package starts empty", () => {
    const d = emptyDraft();
    expect(d.name).toBe("");
    expect(d.price).toBe("");
    expect(d.airports).toEqual([]);
    expect(d.items.every((i) => i.state === 0)).toBe(true);
    expect(stepStates(d)).toEqual([false, false, false, false, false, null]);
  });

  it("loading a package and saving it unchanged gives back the same fields", () => {
    expect(parse(draftFromFields(economy))).toEqual(economy);
  });

  it("existing included and not included lines become chips in the right state", () => {
    const d = draftFromFields(economy);
    const state = (label: string) => d.items.find((i) => i.label === label)?.state;
    expect(state("Return flights")).toBe(1);
    expect(state("Breakfast")).toBe(1);
    expect(state("Lunch and dinner")).toBe(2);
    expect(state("Ziyarat tours")).toBe(2);
    expect(state("Zamzam water")).toBe(0);
  });

  it("chips map to the Included and Not included lines, in order, and unset chips are left out", () => {
    const d = draftFromFields(economy);
    d.items = d.items.map((i) => (i.label === "Zamzam water" ? { ...i, state: 1 } : i.label === "Visa" ? { ...i, state: 2 } : i));
    const f = parse(d);
    expect(f.included).toEqual(["Return flights", "Airport transfers", "Breakfast", "Zamzam water"]);
    expect(f.excluded).toEqual(["Visa", "Lunch and dinner", "Ziyarat tours"]);
  });

  it("custom lines already on a package are kept as chips, and matching ignores case", () => {
    const f = packageFromJson({ ...economy, included: ["return flights", "Free wheelchair assistance"], excluded: ["Single room supplement"] });
    const d = draftFromFields(f);
    expect(d.items.find((i) => i.label === "Return flights")?.state).toBe(1);
    expect(d.items.some((i) => i.label === "return flights")).toBe(false);
    const out = parse(d);
    expect(out.included).toEqual(["Return flights", "Free wheelchair assistance"]);
    expect(out.excluded).toEqual(["Single room supplement"]);
  });

  it("airports are stored as one comma-separated string", () => {
    expect(splitAirports("London Heathrow, Manchester,Birmingham ")).toEqual(["London Heathrow", "Manchester", "Birmingham"]);
    const d = draftFromFields(economy);
    d.airports = [...d.airports, "Glasgow"];
    expect(parse(d).departureAirports).toBe("London Heathrow, Manchester, Birmingham, Glasgow");
  });

  it("no stars saves as no rating", () => {
    const d = draftFromFields(economy);
    d.makkahStars = 0;
    expect(parse(d).makkahHotel.stars).toBeNull();
  });

  it("walking time is metres over 80, rounded, at least 1 minute", () => {
    expect(walkMinutes("600")).toBe(8);
    expect(walkMinutes("20")).toBe(1);
    expect(walkMinutes("")).toBeNull();
    expect(walkMinutes("0")).toBeNull();
  });

  it("step bar and the 9-item checklist follow the rules in the spec", () => {
    const d = draftFromFields(economy);
    expect(stepStates(d)).toEqual([true, true, true, true, true, null]);
    expect(answerChecks(d).filter(([, ok]) => ok).map(([t]) => t)).toEqual(["Price", "Nights", "Makkah hotel", "Departure airports", "What’s included"]);
    expect(answerChecks(d)).toHaveLength(9);
  });

  it("the example reply is built from the fields", () => {
    const text = exampleAnswer(draftFromFields(economy), "Zen", "Zenith Demo Travel");
    expect(text).toBe("The 7 Night Economy Umrah is £1,295 per person (quad sharing). 4 nights in Makkah at Dar Al Safa Hotel (3★), 600m from the Haram. 3 nights in Madinah. Flights from London Heathrow, Manchester, Birmingham. Includes return flights, visa, airport transfers, breakfast. Zen, Zenith Demo Travel");
  });

  it("save is blocked on the step that needs fixing, in the same order the parser checks", () => {
    const d = emptyDraft();
    expect(firstProblem(d)?.step).toBe(0);
    d.name = "Test";
    expect(firstProblem(d)?.step).toBe(2);
    d.price = "£1,295";
    expect(firstProblem(d)?.step).toBe(1);
    d.nightsMakkah = 5;
    expect(firstProblem(d)).toBeNull();
    expect(parse(d).pricePerPerson).toBe(1295);
  });
});
