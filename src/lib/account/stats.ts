/** Pure helpers for the student space: streak, relative time and the recent-activity feed. */

export type ActivityKind = "lesson" | "quiz" | "exercise";
export type Activity = { kind: ActivityKind; title: string; detail: string; at: Date };

/** Calendar day ("2026-09-30") of `d` in an IANA timezone; falls back to UTC for a bad zone. */
export function dayKey(d: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function previousDay(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Consecutive days with at least one completion, ending today (or yesterday: today may not have started yet). */
export function learningStreak(completions: Date[], timeZone: string, now = new Date()): number {
  const days = new Set(completions.map((d) => dayKey(d, timeZone)));
  let cursor = dayKey(now, timeZone);
  if (!days.has(cursor)) cursor = previousDay(cursor);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = previousDay(cursor);
  }
  return streak;
}

export function timeAgo(at: Date, now = new Date()): string {
  const mins = Math.floor((now.getTime() - at.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return at.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** The newest `limit` events across all sources. */
export function recentActivity(events: Activity[], limit = 4): Activity[] {
  return [...events].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

/** Http(s) URL or empty string; null when it is not a valid URL. */
export function cleanUrl(input: string): string | null {
  const v = input.trim();
  if (!v) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
