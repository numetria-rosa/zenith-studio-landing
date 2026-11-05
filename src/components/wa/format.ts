/* Small display helpers shared by the dashboard pages. */

export const initialOf = (name: string | null | undefined, fallback = "C") => (name?.trim().charAt(0) || fallback).toUpperCase();

/** HH:MM for today, otherwise "5 Nov". */
export function shortTime(date: Date | string): string {
  const d = new Date(date);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export const gbp = (n: number) => `£${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;

/** "3s" or "2m" for the average first-reply time. */
export function replyTime(seconds: number | null): string {
  if (seconds == null) return "–";
  return seconds < 60 ? `${Math.max(1, Math.round(seconds))}s` : `${Math.round(seconds / 60)}m`;
}
