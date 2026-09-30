"use client";

import { useState } from "react";

/** Copies a formula. The label flips to "Copied" for a moment, announced politely. */
export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      className="min-h-11 shrink-0 rounded-full border border-white/[0.14] px-3.5 font-mono text-[12px] text-soft hover:text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan print:hidden"
    >
      <span aria-live="polite">{done ? "Copied" : "Copy"}</span>
    </button>
  );
}
