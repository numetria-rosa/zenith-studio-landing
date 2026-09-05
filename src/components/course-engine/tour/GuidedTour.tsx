"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

/* An animated, spotlight-style walkthrough — like a product tour, not a
   chat. Each step targets a real DOM element already on the page (found by
   a `data-tour="<id>"` attribute the lab itself sets on its own canvas,
   sliders, and stat panels), dims everything else, and walks through them
   in sequence with a moving highlight. No LLM, no server call — this is
   pure client-side UI, driven entirely by a fixed array of steps authored
   for the specific lab it's attached to. */

export type TourStep = {
  /** Matches a `data-tour="<id>"` attribute somewhere in the lab below. */
  target: string;
  title: string;
  body: string;
};

type Rect = { top: number; left: number; width: number; height: number };

function measure(selector: string): Rect | null {
  const el = document.querySelector(`[data-tour="${selector}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const pad = 8;
  return { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
}

export function GuidedTour({ steps, label = "Walk through this with me" }: { steps: TourStep[]; label?: string }) {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const recompute = useCallback(() => {
    if (!active) return;
    setRect(measure(steps[index]?.target));
  }, [active, index, steps]);

  useEffect(() => {
    recompute();
    if (!active) return;
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
  }, [active, recompute]);

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally re-binds fresh closures each step
  }, [active, index]);

  function start() {
    setIndex(0);
    setActive(true);
  }
  function close() {
    setActive(false);
  }
  function next() {
    if (index >= steps.length - 1) {
      close();
      return;
    }
    setIndex((i) => i + 1);
  }
  function back() {
    setIndex((i) => Math.max(0, i - 1));
  }

  const step = steps[index];
  const tooltipTop = rect ? Math.min(rect.top + rect.height + 16, window.innerHeight - 220) : 0;
  const tooltipLeft = rect ? Math.max(16, Math.min(rect.left, window.innerWidth - 336)) : 0;

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#f0b429] bg-[#f0b429]/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#f0b429] hover:bg-[#f0b429]/20"
      >
        <Sparkles size={13} aria-hidden /> {label}
      </button>

      <AnimatePresence>
        {active && rect && (
          <>
            <motion.div
              key="spotlight"
              className="fixed z-[200] rounded-xl border-2 border-[#8b7cf6] pointer-events-none"
              style={{ boxShadow: "0 0 0 9999px rgba(5,6,10,0.82)" }}
              initial={false}
              animate={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            />
            <motion.div
              key={`tooltip-${index}`}
              role="dialog"
              aria-label={step.title}
              className="fixed z-[201] w-[320px] rounded-xl border border-[#333a4c] bg-[#151920] p-4 shadow-2xl"
              style={{ top: tooltipTop, left: tooltipLeft }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-1 font-[family-name:var(--font-course-mono)] text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#8b7cf6]">
                Step {index + 1} of {steps.length}
              </div>
              <div className="mb-1.5 text-[14.5px] font-semibold text-[#eeeee7]">{step.title}</div>
              <p className="text-[13px] leading-relaxed text-[#9aa0ae]">{step.body}</p>
              <div className="mt-3 flex items-center justify-between">
                <button type="button" onClick={close} className="text-[12px] text-[#676e7d] hover:text-[#ff8585]">
                  Skip tour
                </button>
                <div className="flex gap-2">
                  {index > 0 && (
                    <button type="button" onClick={back} className="rounded-lg border border-[#333a4c] px-3 py-1.5 text-[12px] text-[#9aa0ae] hover:border-[#8b7cf6] hover:text-[#eeeee7]">
                      ← Back
                    </button>
                  )}
                  <button type="button" onClick={next} className="rounded-lg border border-[#8b7cf6] bg-[#8b7cf6]/10 px-3 py-1.5 text-[12px] font-semibold text-[#8b7cf6] hover:bg-[#8b7cf6]/20">
                    {index >= steps.length - 1 ? "Done" : "Next →"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
