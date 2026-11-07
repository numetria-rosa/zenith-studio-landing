import { db } from "@/lib/db";

/* The agency's own calendar of occasions: a name and one day or a date range ("Ramadan 2027", "Eid al-Fitr 2027",
   "October half-term"). The agent reads them to match a customer's "Ramadan" or "Eid" to the packages whose
   travel dates fall inside, so the dates are the agency's to set and correct. Dates are calendar days (no time). */

export type OccasionInput = { name: string; startDate: Date; endDate: Date | null };
type Parsed = { ok: true; value: OccasionInput } | { ok: false; error: string };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(raw: FormDataEntryValue | null): Date | null {
  const v = String(raw ?? "").trim();
  if (!DAY.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : d;
}

/** Reads the occasion form: a name, a start day, and an end day for a range (blank, or the same day, means one day). */
export function parseOccasionForm(form: FormData): Parsed {
  const name = String(form.get("name") ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!name) return { ok: false, error: "Give the occasion a name." };
  const startDate = parseDay(form.get("startDate"));
  if (!startDate) return { ok: false, error: "Choose the date, or the first day of the range." };
  const rawEnd = String(form.get("endDate") ?? "").trim();
  const end = rawEnd ? parseDay(form.get("endDate")) : null;
  if (rawEnd && !end) return { ok: false, error: "The last day isn't a valid date." };
  if (end && end < startDate) return { ok: false, error: "The last day can't be before the first day." };
  return { ok: true, value: { name, startDate, endDate: end && end.getTime() !== startDate.getTime() ? end : null } };
}

const fmt = (d: Date, withYear: boolean) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" });

/** "16 May 2027" or "8 February to 9 March 2027" (the year once when both ends share it). */
export function formatOccasionDates(startDate: Date, endDate: Date | null): string {
  if (!endDate) return fmt(startDate, true);
  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();
  return `${fmt(startDate, !sameYear)} to ${fmt(endDate, true)}`;
}

/** The calendar as the agent reads it. Empty when the agency has none. */
export function occasionsPrompt(list: OccasionInput[]): string {
  if (list.length === 0) return "";
  return [
    "OCCASIONS (the agency's own calendar. When the customer names an occasion or season listed here, use these dates to find the packages whose travel dates fall inside or overlap it. Religious dates can move a day or two with moon sighting, so say \"around\" when you quote them. If an occasion isn't listed, never state its dates):",
    ...list.map((o) => `- ${o.name}: ${formatOccasionDates(o.startDate, o.endDate)}.`),
  ].join("\n");
}

/** Approximate dates for 2027, offered as a starting point the owner can correct. Moon sighting can move them. */
export const SUGGESTED_OCCASIONS: OccasionInput[] = [
  { name: "Ramadan 2027", startDate: new Date("2027-02-08T00:00:00Z"), endDate: new Date("2027-03-09T00:00:00Z") },
  { name: "Eid al-Fitr 2027", startDate: new Date("2027-03-09T00:00:00Z"), endDate: new Date("2027-03-11T00:00:00Z") },
  { name: "Hajj 2027", startDate: new Date("2027-05-15T00:00:00Z"), endDate: new Date("2027-05-20T00:00:00Z") },
  { name: "Eid al-Adha 2027", startDate: new Date("2027-05-16T00:00:00Z"), endDate: new Date("2027-05-19T00:00:00Z") },
];

/** Upcoming and current occasions first: ones that ended more than a week ago are left out of the agent's prompt. */
export async function loadOccasions(agencyId: string, now = new Date()): Promise<OccasionInput[]> {
  const cutoff = new Date(now.getTime() - 7 * 86_400_000);
  const rows = await db.waOccasion.findMany({
    where: { agencyId, OR: [{ endDate: { gte: cutoff } }, { endDate: null, startDate: { gte: cutoff } }] },
    orderBy: { startDate: "asc" },
    take: 40,
    select: { name: true, startDate: true, endDate: true },
  });
  return rows;
}
