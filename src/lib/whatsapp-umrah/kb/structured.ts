/* Structured knowledge base entries: a package is a form of labelled fields, a FAQ is one question and answer.
   The form values are kept as JSON so the owner can edit them again, and turned into a short, fully labelled
   block of text for the AI. The AI's grounding check only lets a reply state numbers that appear in the text it
   retrieved, so everything it may quote (price, nights, distances, dates) is written out explicitly here. */

export const PACKAGE_TYPES = ["Umrah", "Ramadan Umrah", "Hajj", "Group package", "Other"] as const;

export type HotelFields = { name: string; stars: number | null; distanceMetres: number | null };

export type PackageFields = {
  name: string;
  type: string;
  description: string;
  nightsMakkah: number;
  nightsMadinah: number;
  makkahHotel: HotelFields;
  madinahHotel: HotelFields;
  pricePerPerson: number;
  priceBasis: string;
  deposit: number | null;
  paymentTerms: string;
  departureAirports: string;
  airline: string;
  travelDates: string;
  availability: string;
  included: string[];
  excluded: string[];
  notes: string;
};

export type FaqFields = { question: string; answer: string };

type Parsed<T> = { ok: true; fields: T } | { ok: false; error: string };

const MAX_SHORT = 120;
const MAX_LONG = 600;
const MAX_ITEMS = 20;

const str = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

function num(v: FormDataEntryValue | null): number | null {
  const raw = String(v ?? "").replace(/[£,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const lines = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-•*\s]+/, "").replace(/\s+/g, " ").trim().slice(0, MAX_SHORT))
    .filter(Boolean)
    .slice(0, MAX_ITEMS);

function hotel(form: FormData, key: string): HotelFields {
  const stars = num(form.get(`${key}Stars`));
  const distance = num(form.get(`${key}Distance`));
  return {
    name: str(form.get(`${key}Name`), MAX_SHORT),
    stars: stars !== null && stars >= 1 && stars <= 5 ? Math.round(stars) : null,
    distanceMetres: distance !== null ? Math.round(distance) : null,
  };
}

export function parsePackageForm(form: FormData): Parsed<PackageFields> {
  const name = str(form.get("name"), 80);
  if (!name) return { ok: false, error: "Give the package a name." };
  const price = num(form.get("pricePerPerson"));
  if (price === null || price <= 0) return { ok: false, error: "Enter the price per person in pounds." };
  const nightsMakkah = Math.round(num(form.get("nightsMakkah")) ?? 0);
  const nightsMadinah = Math.round(num(form.get("nightsMadinah")) ?? 0);
  if (nightsMakkah + nightsMadinah <= 0) return { ok: false, error: "Enter the number of nights in Makkah and/or Madinah." };
  const type = str(form.get("type"), 40);
  return {
    ok: true,
    fields: {
      name,
      type: (PACKAGE_TYPES as readonly string[]).includes(type) ? type : "Umrah",
      description: str(form.get("description"), MAX_LONG),
      nightsMakkah,
      nightsMadinah,
      makkahHotel: hotel(form, "makkah"),
      madinahHotel: hotel(form, "madinah"),
      pricePerPerson: price,
      priceBasis: str(form.get("priceBasis"), MAX_SHORT),
      deposit: num(form.get("deposit")),
      paymentTerms: str(form.get("paymentTerms"), MAX_LONG),
      departureAirports: str(form.get("departureAirports"), MAX_SHORT),
      airline: str(form.get("airline"), MAX_SHORT),
      travelDates: str(form.get("travelDates"), MAX_LONG),
      availability: str(form.get("availability"), MAX_SHORT),
      included: lines(form.get("included")),
      excluded: lines(form.get("excluded")),
      notes: str(form.get("notes"), MAX_LONG),
    },
  };
}

export function parseFaqForm(form: FormData): Parsed<FaqFields> {
  const question = str(form.get("question"), 200);
  const answer = str(form.get("answer"), 800);
  if (!question || !answer) return { ok: false, error: "Both the question and the answer are required." };
  return { ok: true, fields: { question, answer } };
}

const gbp = (n: number) => `£${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;

function hotelText(label: string, place: string, h: HotelFields): string | null {
  if (!h.name) return null;
  const parts = [h.name];
  if (h.stars) parts.push(`${h.stars}-star`);
  if (h.distanceMetres !== null) parts.push(`${h.distanceMetres.toLocaleString("en-GB")} metres from ${place}`);
  return `${label}: ${parts.join(", ")}.`;
}

/** One labelled line per fact, in a fixed order, no blank lines (so it stays a single retrieval chunk). */
export function packageToText(f: PackageFields): string {
  const nights = f.nightsMakkah + f.nightsMadinah;
  const split = [f.nightsMakkah ? `${f.nightsMakkah} in Makkah` : null, f.nightsMadinah ? `${f.nightsMadinah} in Madinah` : null].filter(Boolean).join(", ");
  const out = [
    `Package: ${f.name} (${f.type}).`,
    f.description && `Description: ${f.description}`,
    `Duration: ${nights} night${nights === 1 ? "" : "s"} (${split}).`,
    hotelText("Makkah hotel", "the Haram", f.makkahHotel),
    hotelText("Madinah hotel", "the Prophet's Mosque", f.madinahHotel),
    `Price: ${gbp(f.pricePerPerson)} per person${f.priceBasis ? ` (${f.priceBasis})` : ""}.`,
    f.deposit !== null && `Deposit: ${gbp(f.deposit)} per person.`,
    f.paymentTerms && `Payment terms: ${f.paymentTerms}`,
    f.departureAirports && `Departs from: ${f.departureAirports}.`,
    f.airline && `Flights: ${f.airline}.`,
    f.travelDates && `Travel dates: ${f.travelDates}`,
    f.availability && `Availability: ${f.availability}.`,
    f.included.length > 0 && `Included: ${f.included.join("; ")}.`,
    f.excluded.length > 0 && `Not included: ${f.excluded.join("; ")}.`,
    f.notes && `Notes: ${f.notes}`,
  ];
  return out.filter((l): l is string => Boolean(l)).join("\n");
}

export function faqToText(f: FaqFields): string {
  return `FAQ. Question: ${f.question}\nAnswer: ${f.answer}`;
}

export const PACKAGE_FORM_DEFAULTS: PackageFields = {
  name: "",
  type: "Umrah",
  description: "",
  nightsMakkah: 0,
  nightsMadinah: 0,
  makkahHotel: { name: "", stars: null, distanceMetres: null },
  madinahHotel: { name: "", stars: null, distanceMetres: null },
  pricePerPerson: 0,
  priceBasis: "",
  deposit: null,
  paymentTerms: "",
  departureAirports: "",
  airline: "",
  travelDates: "",
  availability: "",
  included: [],
  excluded: [],
  notes: "",
};

/** The stored JSON back into a form shape, tolerant of missing keys (an older or hand-edited row). */
export function packageFromJson(json: unknown): PackageFields {
  const d = PACKAGE_FORM_DEFAULTS;
  const j = (json && typeof json === "object" ? json : {}) as Partial<PackageFields>;
  return { ...d, ...j, makkahHotel: { ...d.makkahHotel, ...(j.makkahHotel ?? {}) }, madinahHotel: { ...d.madinahHotel, ...(j.madinahHotel ?? {}) } };
}
