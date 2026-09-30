"use client";

import { useState, useTransition } from "react";
import { saveNotificationsAction } from "@/app/account/actions";

type Prefs = { productNews: boolean; weeklyRecap: boolean; offers: boolean };
const ROWS: { key: keyof Prefs; label: string; hint: string }[] = [
  { key: "productNews", label: "New modules and updates", hint: "When a course you own gets new content." },
  { key: "weeklyRecap", label: "Weekly progress recap", hint: "A short summary every Monday." },
  { key: "offers", label: "New courses and offers", hint: "Launches and limited-time offers." },
];

export function NotificationToggles({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [error, setError] = useState(false);
  const [, start] = useTransition();
  const toggle = (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setError(false);
    start(async () => {
      const r = await saveNotificationsAction(next).catch(() => ({ ok: false as const }));
      if (!r.ok) { setPrefs(prefs); setError(true); }
    });
  };
  return (
    <div className="mt-4 flex flex-col">
      {ROWS.map((r) => (
        <div key={r.key} className={`flex items-center justify-between gap-4 py-3.5 border-t border-white/[0.06]`}>
          <div className="flex flex-col gap-0.5">
            <span id={`n-${r.key}`} className="text-[14.5px]">{r.label}</span>
            <span className="text-[12.5px] text-mist">{r.hint}</span>
          </div>
          <button
            type="button"
            aria-pressed={prefs[r.key]}
            aria-labelledby={`n-${r.key}`}
            onClick={() => toggle(r.key)}
            className={`relative flex h-11 w-12 shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan`}
          >
            <span className={`relative block h-7 w-12 rounded-full border transition-colors ${prefs[r.key] ? "border-[rgba(61,220,151,0.6)] bg-[rgba(61,220,151,0.35)]" : "border-white/[0.18] bg-white/[0.06]"}`}>
              <span className={`absolute top-[3px] h-[20px] w-[20px] rounded-full transition-all ${prefs[r.key] ? "left-[23px] bg-mint-text" : "left-[3px] bg-mist"}`} />
            </span>
          </button>
        </div>
      ))}
      {error && <p role="alert" className="m-0 pt-2 text-[13px] text-ember-text">Couldn&apos;t save that change. Try again.</p>}
    </div>
  );
}
