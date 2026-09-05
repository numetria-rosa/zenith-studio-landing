"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* Escalating hints for a lab or practice task — a gentle nudge first, then
   a more specific pointer, then a near-answer, revealed one at a time on
   request rather than dumped all at once. This is authored guidance (real
   hints written for this specific lab), not a live/generated response. */

export function ProgressiveHint({ hints }: { hints: string[] }) {
  const [revealed, setRevealed] = useState(0);

  return (
    <div className="mt-3">
      {revealed < hints.length && (
        <button
          type="button"
          onClick={() => setRevealed((n) => n + 1)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#5fc2e8] bg-[#5fc2e8]/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#5fc2e8] hover:bg-[#5fc2e8]/20"
        >
          {revealed === 0 ? "Stuck? Get a hint" : `Need another hint? (${revealed}/${hints.length} shown)`}
        </button>
      )}
      <div className="mt-2 flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {hints.slice(0, revealed).map((hint, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-[#232838] bg-[#0a0c10] px-3.5 py-2.5 text-[13px] text-[#eeeee7]">
                <span className="mr-1.5 font-[family-name:var(--font-course-mono)] text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#5fc2e8]">
                  Hint {i + 1}
                </span>
                {hint}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
