"use client";

import { useState } from "react";
import type { SetupGuide } from "@/lib/setup-guides";

/* Reusable "pick your situation, see the exact steps" widget - the
   general pattern for anything in this dashboard that's confusing or too
   technical for a client to figure out alone, not a one-off for CRM
   setup. Pure client-side (no server round trip): the guide content is
   static, so there's nothing to fetch. */

export function GuidePicker({ guides, label }: { guides: SetupGuide[]; label: string }) {
  const [selectedId, setSelectedId] = useState("");
  const selected = guides.find((g) => g.id === selectedId);

  return (
    <div className="mt-3 flex flex-col gap-2">
      <label className="text-[11px] uppercase tracking-[0.06em] text-[#676e7d]">{label}</label>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full rounded-lg border border-[#333a4c] bg-[#0a0c10] px-3 py-2 text-[13px] text-[#eeeee7]"
      >
        <option value="">Not sure / pick one to see the steps</option>
        {guides.map((g) => (
          <option key={g.id} value={g.id}>
            {g.label}
          </option>
        ))}
      </select>

      {selected && (
        <div className="mt-1 rounded-lg border border-[#333a4c] bg-[#0a0c10] p-4">
          <p className="text-[12.5px] leading-5 text-[#9aa0ae]">{selected.intro}</p>
          <ol className="mt-3 flex flex-col gap-2">
            {selected.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] leading-5 text-[#eeeee7]">
                <span className="flex-shrink-0 font-[family-name:var(--font-course-mono)] text-[11px] text-[#f0b429]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {step}
              </li>
            ))}
          </ol>
          {selected.linkUrl && (
            <a
              href={selected.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-[12px] font-semibold text-[#f0b429] hover:underline"
            >
              {selected.linkLabel ?? "Learn more"} &rarr;
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/** Single-guide variant, for a spot that only ever needs one specific
    guide (e.g. "how do I share my Google Sheet") rather than a picker
    across several situations. */
export function InlineGuide({ guide }: { guide: SetupGuide }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[12px] font-semibold text-[#f0b429] hover:underline"
      >
        {guide.label} {open ? "−" : "+"}
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-[#333a4c] bg-[#0a0c10] p-4">
          <p className="text-[12.5px] leading-5 text-[#9aa0ae]">{guide.intro}</p>
          <ol className="mt-3 flex flex-col gap-2">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] leading-5 text-[#eeeee7]">
                <span className="flex-shrink-0 font-[family-name:var(--font-course-mono)] text-[11px] text-[#f0b429]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
