"use client";

import { useState, type ReactNode } from "react";

/* The "Show Me the Math" signature feature (course brief section 9): one
   concept, three depths, so a beginner and an advanced student can both use
   the same page. Level defaults to Intuition - nobody is forced into
   notation before they've opted in. */

const LEVELS = [
  { key: "intuition", label: "Intuition" },
  { key: "applied", label: "Applied Math" },
  { key: "proof", label: "Full Derivation" },
] as const;

type LevelKey = (typeof LEVELS)[number]["key"];

export function MathLevels({
  intuition,
  applied,
  proof,
}: {
  intuition: ReactNode;
  applied: ReactNode;
  proof: ReactNode;
}) {
  const [level, setLevel] = useState<LevelKey>("intuition");
  const content: Record<LevelKey, ReactNode> = { intuition, applied, proof };

  return (
    <div className="mt-6 rounded-xl border border-[#333a4c] bg-[#151920] p-5">
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Depth of explanation">
        {LEVELS.map((l) => (
          <button
            key={l.key}
            type="button"
            role="tab"
            aria-selected={level === l.key}
            onClick={() => setLevel(l.key)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
              level === l.key
                ? "bg-[#8b7cf6] text-[#120f24]"
                : "border border-[#333a4c] bg-[#191d26] text-[#9aa0ae] hover:border-[#8b7cf6] hover:text-[#eeeee7]"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="text-[14.5px] leading-relaxed text-[#eeeee7]">{content[level]}</div>
    </div>
  );
}
