"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addAnotherAction, notApplicableAction } from "./actions";

/* Under each document on the client's upload page: "I don't have this" (with an optional reason, so the
   accountant isn't left guessing) and "I have more than one" (a second W-2, another brokerage). */
export function ItemActions({ token, itemId, label, status }: { token: string; itemId: string; label: string; status: string }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return setError(r.error);
      setError(null);
      setAsking(false);
      router.refresh();
    });

  const link = "text-[13.5px] text-white/60 underline underline-offset-4 hover:text-white disabled:opacity-50";

  if (status === "NOT_APPLICABLE")
    return (
      <button type="button" className={link} disabled={busy} onClick={() => run(() => notApplicableAction(token, itemId, "", true))}>
        Undo, I do have it
      </button>
    );

  return (
    <div className="flex flex-col gap-2">
      {asking ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder="Optional: why not? e.g. no longer have a mortgage"
            aria-label={`Why you don't have ${label}`}
            className="min-h-10 flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-[14px] text-white placeholder:text-white/40 outline-none focus:border-[#5CC8FF]"
          />
          <span className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => notApplicableAction(token, itemId, note, false))}
              className="min-h-10 rounded-full border border-white/20 px-4 text-[13.5px] font-medium text-white hover:bg-white/10 disabled:opacity-50"
            >
              Confirm
            </button>
            <button type="button" className={link} onClick={() => setAsking(false)}>
              Cancel
            </button>
          </span>
        </div>
      ) : (
        <span className="flex flex-wrap gap-x-5 gap-y-1">
          {status === "REQUESTED" && (
            <button type="button" className={link} onClick={() => setAsking(true)}>
              I don&apos;t have this
            </button>
          )}
          <button type="button" className={link} disabled={busy} onClick={() => run(() => addAnotherAction(token, itemId))}>
            I have more than one
          </button>
        </span>
      )}
      {error && (
        <p role="alert" className="m-0 text-[13px] text-[#FF9BB0]">
          {error}
        </p>
      )}
    </div>
  );
}
