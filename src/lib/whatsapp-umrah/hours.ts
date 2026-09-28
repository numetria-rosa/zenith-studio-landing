/* Business hours and away mode - spec 3.5. WaAgentSettings.businessHours
   is untyped Json in the schema (no dashboard UI has written one yet),
   so the shape lives here as the one place that reads/writes it.
   Unset/null businessHours means "always open" - a reasonable default
   for an agent that's designed to answer 24/7 anyway, and means an
   agency that never touches this setting behaves exactly like before
   this feature existed. */

export type DayHours = { open: string; close: string } | null; // "09:00"/"17:00" 24h, or null = closed that day
export type BusinessHours = Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", DayHours>>;

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function parseHoursJson(value: unknown): BusinessHours | null {
  if (!value || typeof value !== "object") return null;
  return value as BusinessHours;
}

/** True if `now` (in the agency's own timezone) falls inside a
    configured open window. Always true if businessHours is unset. IANA
    timezone via Intl - no library needed, this repo already leans on
    platform APIs elsewhere for exactly this reason. */
export function isWithinBusinessHours(businessHoursJson: unknown, timezone: string, now = new Date()): boolean {
  const hours = parseHoursJson(businessHoursJson);
  if (!hours) return true;

  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value.toLowerCase().slice(0, 3);
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = Number(parts.find((p) => p.type === "minute")?.value);
  const dayKey = DAY_KEYS.find((d) => d === weekday);
  if (!dayKey) return true; // couldn't resolve the day - fail open rather than wrongly going silent

  const today = hours[dayKey];
  if (!today) return false; // explicitly marked closed
  const nowMinutes = hour * 60 + minute;
  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);
  return nowMinutes >= openH * 60 + openM && nowMinutes < closeH * 60 + closeM;
}
