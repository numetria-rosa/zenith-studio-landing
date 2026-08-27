"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { fraunces } from "@/lib/fonts";

export function CurriculumAccordion({
  modules,
}: {
  modules: { title: string; description: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ol className="grid gap-2.5">
      {modules.map(({ title, description }, i) => {
        const open = openIndex === i;
        return (
          <li
            key={title}
            className="rounded-xl border"
            style={{ borderColor: "var(--bd)", background: "var(--card)" }}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                style={{
                  background: "color-mix(in srgb, var(--accent) 16%, transparent)",
                  color: "var(--accent)",
                  fontFamily: "var(--font-course-mono), monospace",
                }}
              >
                {i}
              </span>
              <span className={`${fraunces.className} flex-1 text-sm font-semibold`} style={{ fontFamily: "var(--font-course-serif), serif" }}>
                {title}
              </span>
              <ChevronDown
                className="h-4 w-4 flex-shrink-0 transition-transform"
                style={{ color: "var(--mut)", transform: open ? "rotate(180deg)" : undefined }}
                aria-hidden
              />
            </button>
            {open && (
              <div className="px-4 pb-4 pl-[52px] text-sm leading-6" style={{ color: "var(--mut)" }}>
                {description}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
