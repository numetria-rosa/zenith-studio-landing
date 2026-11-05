/* Plain values and helpers for the WhatsApp agent dashboard. They live apart from ui.tsx (a client module) because
   server components cannot call functions or read constants exported from a "use client" file. */

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/** One status colour map, used everywhere (spec "Status colour map"). */
export const STATUS = {
  NEW: { label: "New", color: "#5CC8FF" },
  QUALIFIED: { label: "Qualified", color: "#C7B0FF" },
  HOT: { label: "Hot", color: "#FF9BB0" },
  HANDED_OFF: { label: "Handed off", color: "#FFD27A" },
  WON: { label: "Won", color: "#3DDC97" },
  LOST: { label: "Lost", color: "#7D8392" },
} as const;
export type LeadStatus = keyof typeof STATUS;
export const LEAD_STATUSES = Object.keys(STATUS) as LeadStatus[];

export const MINT = "#3DDC97";
export const AMBER = "#FFD27A";
export const VIOLET = "#C7B0FF";
export const CYAN = "#5CC8FF";
export const EMBER = "#FF9BB0";
export const DIM = "#7D8392";

/** Time of day in HH:MM, for message captions. */
export const hhmm = (d: Date | string) => new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** Arabic/Urdu text gets dir="rtl"; captions stay LTR. */
export const isRtl = (text: string | null | undefined) => /[\u0600-\u06FF]/.test(text ?? "");
