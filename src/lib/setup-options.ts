/* Fixed choices for every agent setup form. Clients never type rules or
   FAQs: they pick options here and code turns the picks into the text the
   engines already consume (qualification rules, hours, FAQ lines, CRM
   field names). Only facts that can't be an option (a name, an email, a
   phone number) stay as typed fields. Pure: no DB, safe to test. */

export type Choice = { value: string; label: string };
export type ChoiceGroup = { name: string; question: string; multi: boolean; required: boolean; options: Choice[] };

const opts = (pairs: [string, string][]): Choice[] => pairs.map(([value, label]) => ({ value, label }));

// ---------- Lead qualification (Intake Agent, Inside Sales Agent, Lead Capture) ----------

const QUALIFICATION: Record<string, ChoiceGroup[]> = {
  "insurance-ai-team": [
    {
      name: "want",
      question: "Which lines of business do you want leads for?",
      multi: true,
      required: true,
      options: opts([
        ["Auto", "Auto"],
        ["Home", "Home"],
        ["Renters", "Renters"],
        ["Condo", "Condo"],
        ["Landlord / rental property", "Landlord / rental property"],
        ["Life", "Life"],
        ["Health", "Health"],
        ["Commercial / business", "Commercial / business"],
        ["Workers' comp", "Workers' comp"],
        ["Umbrella", "Umbrella"],
        ["Motorcycle / boat / RV", "Motorcycle / boat / RV"],
      ]),
    },
    {
      name: "also",
      question: "Anything else a good lead should have? (optional)",
      multi: true,
      required: false,
      options: opts([
        ["lives in a state we write in", "Lives in a state we write in"],
        ["has a policy renewing within 60 days", "Renewing within 60 days"],
        ["wants two or more policies", "Wants 2 or more policies"],
        ["is currently insured", "Currently insured"],
      ]),
    },
  ],
  brokerages: [
    {
      name: "want",
      question: "Which leads do you want?",
      multi: true,
      required: true,
      options: opts([
        ["Buyers", "Buyers"],
        ["Sellers", "Sellers"],
        ["Investors", "Investors"],
        ["Renters", "Renters"],
      ]),
    },
    {
      name: "also",
      question: "Anything else a good lead should have? (optional)",
      multi: true,
      required: false,
      options: opts([
        ["plans to move within 90 days", "Moving within 90 days"],
        ["is pre-approved or paying cash", "Pre-approved or paying cash"],
        ["is not already working with another agent", "Not working with another agent"],
        ["is looking in our service area", "In our service area"],
      ]),
    },
  ],
  "ai-lead-capture": [
    {
      name: "also",
      question: "What makes a lead worth pursuing?",
      multi: true,
      required: true,
      options: opts([
        ["any", "Every enquiry counts"],
        ["is in our service area", "In our service area"],
        ["wants to start within 30 days", "Ready to start within 30 days"],
        ["mentions a budget", "Mentions a budget"],
        ["is a business, not a consumer", "Business customer"],
      ]),
    },
  ],
};

export function qualificationGroups(sourceServiceId: string | null): ChoiceGroup[] {
  return QUALIFICATION[sourceServiceId ?? ""] ?? QUALIFICATION["ai-lead-capture"];
}

/** Reads the picked options for `groups` out of a form. Unknown values are
    dropped (never trusted); a required group with nothing picked fails. */
export function readChoices(
  groups: ChoiceGroup[],
  getAll: (name: string) => unknown[]
): { ok: true; picks: Record<string, string[]> } | { ok: false; error: string } {
  const picks: Record<string, string[]> = {};
  for (const g of groups) {
    const allowed = new Set(g.options.map((o) => o.value));
    const values = [...new Set(getAll(g.name).map(String))].filter((v) => allowed.has(v));
    const kept = g.multi ? values : values.slice(0, 1);
    if (g.required && kept.length === 0) return { ok: false, error: `Pick at least one option for "${g.question}"` };
    picks[g.name] = kept;
  }
  return { ok: true, picks };
}

const list = (items: string[], joiner = "or") => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} ${joiner} ${items.at(-1)}`);

export function qualificationRulesText(picks: Record<string, string[]>): string {
  const want = picks.want ?? [];
  const also = (picks.also ?? []).filter((v) => v !== "any");
  const parts: string[] = [];
  if (want.length) parts.push(`A lead is worth pursuing if they want ${list(want)}.`);
  if (also.length) parts.push(`They should also meet these: the lead ${also.join("; ")}.`);
  if (!parts.length) parts.push("Every enquiry is worth pursuing.");
  return parts.join(" ");
}

// ---------- Receptionist hours ----------

export const DAYS = opts([
  ["Mon", "Mon"],
  ["Tue", "Tue"],
  ["Wed", "Wed"],
  ["Thu", "Thu"],
  ["Fri", "Fri"],
  ["Sat", "Sat"],
  ["Sun", "Sun"],
]);
const HOUR_LABELS = ["12am", "1am", "2am", "3am", "4am", "5am", "6am", "7am", "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm"];
export const OPEN_TIMES = opts(HOUR_LABELS.slice(5, 13).map((h) => [h, h]));
export const CLOSE_TIMES = opts(HOUR_LABELS.slice(12).map((h) => [h, h]));

export function hoursText(input: { allDay: boolean; days: string[]; open: string; close: string }): { ok: true; text: string } | { ok: false; error: string } {
  if (input.allDay) return { ok: true, text: "Open 24 hours a day, 7 days a week" };
  const order = DAYS.map((d) => d.value);
  const days = order.filter((d) => input.days.includes(d));
  if (!days.length) return { ok: false, error: "Pick the days you're open." };
  if (!OPEN_TIMES.some((o) => o.value === input.open) || !CLOSE_TIMES.some((o) => o.value === input.close)) return { ok: false, error: "Pick your opening and closing times." };
  // Collapse consecutive days into ranges: Mon, Tue, Wed, Fri -> Mon-Wed, Fri.
  const runs: string[][] = [];
  for (const d of days) {
    const last = runs.at(-1);
    if (last && order.indexOf(d) === order.indexOf(last.at(-1)!) + 1) last.push(d);
    else runs.push([d]);
  }
  const dayText = runs.map((r) => (r.length > 2 ? `${r[0]}-${r.at(-1)}` : r.join(", "))).join(", ");
  const closed = order.filter((d) => !days.includes(d));
  return { ok: true, text: `${dayText} ${input.open}-${input.close}${closed.length ? `, closed ${closed.join(", ")}` : ""}` };
}

// ---------- Receptionist FAQs ----------

const LAW_PRACTICE_AREAS: ChoiceGroup = {
  name: "practice",
  question: "Which cases do you take?",
  multi: true,
  required: true,
  options: opts([
    ["car accidents", "Car accidents"],
    ["truck accidents", "Truck accidents"],
    ["slip and fall injuries", "Slip and fall"],
    ["workplace injuries", "Workplace injury"],
    ["medical malpractice", "Medical malpractice"],
    ["wrongful death", "Wrongful death"],
    ["family law", "Family law"],
    ["criminal defense", "Criminal defense"],
    ["estate planning", "Estate planning"],
    ["immigration", "Immigration"],
    ["business law", "Business law"],
  ]),
};

const FAQ_COMMON: ChoiceGroup[] = [
  {
    name: "consult",
    question: "First consultation",
    multi: false,
    required: true,
    options: opts([
      ["The first consultation is free.", "Free"],
      ["The first consultation is paid; we share the price when booking.", "Paid"],
      ["We don't offer consultations; callers can book a regular appointment.", "No consultations"],
    ]),
  },
  {
    name: "clients",
    question: "New clients",
    multi: false,
    required: true,
    options: opts([
      ["We are accepting new clients.", "Accepting new clients"],
      ["We have a short waitlist for new clients; take their details.", "Waitlist"],
    ]),
  },
  {
    name: "pay",
    question: "Payment (optional)",
    multi: true,
    required: false,
    options: opts([
      ["We work on contingency: no fee unless we win.", "No fee unless we win"],
      ["We accept most insurance plans.", "Accept insurance"],
      ["Payment plans are available.", "Payment plans"],
      ["Estimates are free.", "Free estimates"],
    ]),
  },
  {
    name: "lang",
    question: "Languages your team speaks",
    multi: true,
    required: true,
    options: opts([
      ["English", "English"],
      ["Spanish", "Spanish"],
      ["French", "French"],
      ["Portuguese", "Portuguese"],
      ["Chinese", "Chinese"],
      ["Vietnamese", "Vietnamese"],
      ["Arabic", "Arabic"],
    ]),
  },
];

export function faqGroups(sourceServiceId: string | null): ChoiceGroup[] {
  return sourceServiceId === "law-firms" ? [LAW_PRACTICE_AREAS, ...FAQ_COMMON] : FAQ_COMMON;
}

export function faqText(picks: Record<string, string[]>): string {
  const lines: string[] = [];
  if (picks.practice?.length) lines.push(`We handle ${list(picks.practice, "and")}. For anything else, take a message.`);
  lines.push(...(picks.consult ?? []), ...(picks.clients ?? []), ...(picks.pay ?? []));
  if (picks.lang?.length) lines.push(`Our team speaks ${list(picks.lang, "and")}.`);
  return lines.join("\n");
}

// ---------- CRM field names ----------

export const CRM_FORMATS: (Choice & { format: string | null })[] = [
  { value: "default", label: "Standard (name, phone, email, notes)", format: null },
  { value: "hubspot", label: "HubSpot", format: '{"firstname": "...", "lastname": "...", "phone": "...", "email": "...", "message": "..."}' },
  { value: "salesforce", label: "Salesforce", format: '{"FirstName": "...", "LastName": "...", "Phone": "...", "Email": "...", "Description": "..."}' },
  { value: "gohighlevel", label: "GoHighLevel", format: '{"first_name": "...", "last_name": "...", "phone": "...", "email": "...", "notes": "..."}' },
  { value: "zoho", label: "Zoho CRM", format: '{"First_Name": "...", "Last_Name": "...", "Phone": "...", "Email": "...", "Description": "..."}' },
];

// ---------- Phone numbers ----------

/** The 3-digit US area code of a typed phone number, or null. Used so a
    client's new texting number is local to them, not a fixed default. */
export function areaCodeOf(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return ten.length === 10 && /^[2-9]/.test(ten) ? ten.slice(0, 3) : null;
}
