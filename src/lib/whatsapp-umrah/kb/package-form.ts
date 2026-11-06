/* Draft model and helpers for the step-by-step package form. The form edits a PackageDraft (strings and chip
   states, easy to bind to inputs) and turns it back into the same FormData fields savePackageAction already
   parses, so the schema and the action are unchanged. */

import { PACKAGE_FORM_DEFAULTS, PACKAGE_TYPES, type PackageFields } from "./structured";

export const STEPS = ["Basics", "Stay", "Price", "Travel", "Included", "Extras"] as const;

/* Suggestion chips: plain config, never stored. */
export const INCLUDED_SUGGESTIONS = ["Return flights", "Visa", "Airport transfers", "Breakfast", "Lunch and dinner", "Ziyarat tours", "Travel insurance", "Zamzam water", "Guide in Makkah", "Train Makkah to Madinah"];
export const AIRPORT_SUGGESTIONS = ["London Heathrow", "London Gatwick", "Manchester", "Birmingham", "Glasgow"];
export const BASIS_SUGGESTIONS = ["Quad sharing", "Triple sharing", "Double sharing", "From", "Per adult"];
export const AVAILABILITY_SUGGESTIONS = ["Seats available", "Few seats left", "Sold out"];
export { PACKAGE_TYPES };

/* Limits mirror parsePackageForm in structured.ts, so the form never lets someone type what the parser would cut. */
export const LIMITS = { name: 80, short: 120, long: 600, items: 20 } as const;

export type ChipState = 0 | 1 | 2; // 0 not set, 1 included, 2 not included
export type Item = { label: string; state: ChipState };

export type PackageDraft = {
  name: string;
  type: string;
  description: string;
  nightsMakkah: number;
  nightsMadinah: number;
  makkahName: string;
  makkahStars: number; // 0 = no rating
  makkahMetres: string;
  madinahName: string;
  madinahStars: number;
  madinahMetres: string;
  price: string;
  basis: string;
  deposit: string;
  terms: string;
  airports: string[];
  airline: string;
  dates: string;
  availability: string;
  items: Item[];
  notes: string;
};

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const numText = (n: number | null | undefined) => (n === null || n === undefined || n === 0 ? "" : String(n));

/** Departure airports are stored as one string; chips are that string split on commas. */
export const splitAirports = (s: string) => s.split(",").map((a) => a.trim()).filter(Boolean);
export const joinAirports = (airports: string[]) => airports.join(", ");

/** Suggested items first (in the design's order), then any custom lines the package already has. */
function itemsFrom(included: string[], excluded: string[]): Item[] {
  const stateOf = (label: string): ChipState => (excluded.some((l) => same(l, label)) ? 2 : included.some((l) => same(l, label)) ? 1 : 0);
  const items: Item[] = INCLUDED_SUGGESTIONS.map((label) => ({ label, state: stateOf(label) }));
  for (const [list, state] of [[included, 1], [excluded, 2]] as const) {
    for (const line of list) if (!items.some((i) => same(i.label, line))) items.push({ label: line, state });
  }
  return items;
}

export function draftFromFields(f: PackageFields): PackageDraft {
  return {
    name: f.name,
    type: f.type,
    description: f.description,
    nightsMakkah: f.nightsMakkah,
    nightsMadinah: f.nightsMadinah,
    makkahName: f.makkahHotel.name,
    makkahStars: f.makkahHotel.stars ?? 0,
    makkahMetres: numText(f.makkahHotel.distanceMetres),
    madinahName: f.madinahHotel.name,
    madinahStars: f.madinahHotel.stars ?? 0,
    madinahMetres: numText(f.madinahHotel.distanceMetres),
    price: numText(f.pricePerPerson),
    basis: f.priceBasis,
    deposit: numText(f.deposit),
    terms: f.paymentTerms,
    airports: splitAirports(f.departureAirports),
    airline: f.airline,
    dates: f.travelDates,
    availability: f.availability,
    items: itemsFrom(f.included, f.excluded),
    notes: f.notes,
  };
}

/** A new package starts empty (type Umrah, like the existing default). */
export const emptyDraft = (): PackageDraft => draftFromFields(PACKAGE_FORM_DEFAULTS);

/** The exact form fields savePackageAction / parsePackageForm read. Included and Not included are one item per line. */
export function draftToFormEntries(d: PackageDraft): Record<string, string> {
  return {
    name: d.name,
    type: d.type,
    description: d.description,
    nightsMakkah: String(d.nightsMakkah),
    nightsMadinah: String(d.nightsMadinah),
    makkahName: d.makkahName,
    makkahStars: d.makkahStars ? String(d.makkahStars) : "",
    makkahDistance: d.makkahMetres,
    madinahName: d.madinahName,
    madinahStars: d.madinahStars ? String(d.madinahStars) : "",
    madinahDistance: d.madinahMetres,
    pricePerPerson: d.price,
    priceBasis: d.basis,
    deposit: d.deposit,
    paymentTerms: d.terms,
    departureAirports: joinAirports(d.airports),
    airline: d.airline,
    travelDates: d.dates,
    availability: d.availability,
    included: d.items.filter((i) => i.state === 1).map((i) => i.label).join("\n"),
    excluded: d.items.filter((i) => i.state === 2).map((i) => i.label).join("\n"),
    notes: d.notes,
  };
}

export const parsePrice = (s: string) => {
  const n = Number(s.replace(/[£,\s]/g, ""));
  return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
};
export const gbp = (n: number) => `£${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
export const totalNights = (d: PackageDraft) => d.nightsMakkah + d.nightsMadinah;
export const nightsLabel = (n: number) => `${n} ${n === 1 ? "night" : "nights"}`;

/** About 80 metres a minute on foot, never under a minute. */
export function walkMinutes(metres: string): number | null {
  const m = parseInt(metres, 10);
  return m > 0 ? Math.max(1, Math.round(m / 80)) : null;
}

/** Step bar state: true = complete, false = not done, null = optional step that never counts as complete. */
export function stepStates(d: PackageDraft): (boolean | null)[] {
  const price = parsePrice(d.price);
  return [!!d.name.trim(), totalNights(d) > 0 && !!d.makkahName.trim(), price !== null && price > 0, d.airports.length > 0, d.items.some((i) => i.state !== 0), null];
}

/** The 9 things the agent can answer from this package. */
export function answerChecks(d: PackageDraft): [string, boolean][] {
  const price = parsePrice(d.price);
  return [
    ["Price", price !== null && price > 0],
    ["Nights", totalNights(d) > 0],
    ["Makkah hotel", !!d.makkahName.trim()],
    ["Madinah hotel", !!d.madinahName.trim()],
    ["Departure airports", d.airports.length > 0],
    ["Travel dates", !!d.dates.trim()],
    ["Availability", !!d.availability.trim()],
    ["What’s included", d.items.some((i) => i.state === 1)],
    ["Deposit and terms", !!(d.deposit.trim() && d.terms.trim())],
  ];
}

/** Front-end template only: an example of the agent's reply, built from the fields. No AI call. */
export function exampleAnswer(d: PackageDraft, agentName: string, agencyName: string): string {
  const price = parsePrice(d.price);
  const priceText = price !== null && price > 0 ? gbp(price) : "£-";
  const included = d.items.filter((i) => i.state === 1).map((i) => i.label);
  const makkah = d.makkahName.trim()
    ? `${d.nightsMakkah ? `${d.nightsMakkah} nights in Makkah at ` : "Makkah: "}${d.makkahName.trim()}${d.makkahStars ? ` (${d.makkahStars}★)` : ""}${d.makkahMetres ? `, ${d.makkahMetres}m from the Haram` : ""}. `
    : "";
  const madinah = d.madinahName.trim() ? `${d.nightsMadinah ? `${d.nightsMadinah} nights in Madinah at ` : "Madinah: "}${d.madinahName.trim()}. ` : d.nightsMadinah ? `${d.nightsMadinah} nights in Madinah. ` : "";
  return (
    `The ${d.name.trim() || "package"} is ${priceText} per person${d.basis.trim() ? ` (${d.basis.trim().toLowerCase()})` : ""}. ` +
    makkah +
    madinah +
    (d.airports.length ? `Flights from ${joinAirports(d.airports)}. ` : "") +
    (included.length ? `Includes ${included.slice(0, 4).join(", ").toLowerCase()}. ` : "") +
    `${agentName}, ${agencyName}`
  );
}

/** The same rules parsePackageForm enforces, checked first so the owner lands on the step that needs fixing. */
export function firstProblem(d: PackageDraft): { step: number; message: string } | null {
  if (!d.name.trim()) return { step: 0, message: "Give the package a name." };
  const price = parsePrice(d.price);
  if (price === null || price <= 0) return { step: 2, message: "Enter the price per person in pounds." };
  if (totalNights(d) <= 0) return { step: 1, message: "Enter the number of nights in Makkah and/or Madinah." };
  return null;
}

/** Room left for another chip in each list (the parser keeps 20 per list) and in the airports string (120 characters). */
export const canAddItem = (d: PackageDraft) => d.items.length < LIMITS.items;
export const canAddAirport = (d: PackageDraft, airport: string) => joinAirports([...d.airports, airport]).length <= LIMITS.short;
