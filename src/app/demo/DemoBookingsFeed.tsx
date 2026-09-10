"use client";

import { useEffect, useState } from "react";

type Booking = { uid: string; attendeeName: string; startISO: string };

/* Polls the real demo calendar every few seconds so a visitor who just
   booked (by phone or by the web-call button) sees it actually appear,
   live, on this page, instead of taking a screenshot's word for it. This
   is the "embed the calendar so they watch it happen" piece from the
   Meta AI conversation, built against Cal.com (what this app actually
   uses) rather than Google Calendar. */
export default function DemoBookingsFeed() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/demo/bookings", { cache: "no-store" });
        const data = (await res.json()) as { bookings: Booking[] };
        if (!cancelled) setBookings(data.bookings);
      } catch {
        // Transient network hiccup, next poll retries, nothing to show the user for this.
      }
    }
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Live demo calendar</p>
        <span className="flex items-center gap-1.5 text-[11px] text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Updates every 5s
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {bookings === null && <p className="text-sm text-white/40">Loading...</p>}
        {bookings?.length === 0 && (
          <p className="text-sm text-white/40">No bookings yet, book one above and it will show up here.</p>
        )}
        {bookings?.map((b) => (
          <div
            key={b.uid}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5"
          >
            <div>
              <p className="text-sm font-semibold text-white">{b.attendeeName}</p>
              <p className="text-xs text-white/50">
                {new Date(b.startISO).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <a
              href={`https://cal.com/booking/${b.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-xs font-semibold text-emerald-300 underline decoration-emerald-300/40 underline-offset-2 hover:text-emerald-200"
            >
              View confirmation &nearr;
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
