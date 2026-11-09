/* The timezone an agency's business hours are read in. Offered per market (the market tag on the Overview comes from
   the plan the agency first bought); an agency that never picks one gets its market's main zone, and one with no
   market on record keeps Europe/London, which is what every agency used before this was a setting. */

export const TIMEZONE_OPTIONS = [
  { id: "Europe/London", label: "United Kingdom (London)", market: "UK" },
  { id: "America/New_York", label: "US Eastern (New York)", market: "US" },
  { id: "America/Chicago", label: "US Central (Chicago)", market: "US" },
  { id: "America/Denver", label: "US Mountain (Denver)", market: "US" },
  { id: "America/Los_Angeles", label: "US Pacific (Los Angeles)", market: "US" },
  { id: "America/Toronto", label: "Canada Eastern (Toronto)", market: "CA" },
  { id: "America/Winnipeg", label: "Canada Central (Winnipeg)", market: "CA" },
  { id: "America/Edmonton", label: "Canada Mountain (Edmonton)", market: "CA" },
  { id: "America/Vancouver", label: "Canada Pacific (Vancouver)", market: "CA" },
  { id: "Australia/Sydney", label: "Australia East (Sydney, Melbourne)", market: "AU" },
  { id: "Australia/Brisbane", label: "Australia Queensland (Brisbane)", market: "AU" },
  { id: "Australia/Adelaide", label: "Australia Central (Adelaide)", market: "AU" },
  { id: "Australia/Perth", label: "Australia West (Perth)", market: "AU" },
  { id: "Africa/Johannesburg", label: "South Africa (Johannesburg)", market: "ZA" },
] as const;

const MARKET_DEFAULT: Record<string, string> = { UK: "Europe/London", US: "America/New_York", CA: "America/Toronto", AU: "Australia/Sydney", ZA: "Africa/Johannesburg" };

/** The zone to read hours in: the one the owner saved, else the main zone of their market, else London. */
export function resolveTimezone(saved: string | null | undefined, market: string | null | undefined): string {
  if (saved && isKnownTimezone(saved)) return saved;
  return (market && MARKET_DEFAULT[market]) || "Europe/London";
}

/** Any real IANA zone the platform knows (the browser's own detection can return one outside the suggested list). */
export function isKnownTimezone(id: string): boolean {
  if (!id) return false;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: id });
    return true;
  } catch {
    return false;
  }
}

/** The dropdown: the suggested zones with friendly names first, then every other zone the platform knows, plus the
    current value if it is somehow in neither. */
export function timezoneChoices(current: string): { id: string; label: string }[] {
  const suggested = TIMEZONE_OPTIONS.map((o) => ({ id: o.id as string, label: o.label as string }));
  const seen = new Set(suggested.map((o) => o.id));
  const others = Intl.supportedValuesOf("timeZone").filter((id) => !seen.has(id)).map((id) => ({ id, label: id.replace(/_/g, " ") }));
  const all = [...suggested, ...others];
  return all.some((o) => o.id === current) ? all : [{ id: current, label: current.replace(/_/g, " ") }, ...all];
}
