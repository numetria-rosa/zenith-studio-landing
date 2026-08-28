"use client";

import { useState } from "react";
import type { ReactNode } from "react";

/* Simple client-side tab switcher — no routing/URL state needed for a
   single-page workspace like this. Matches the dashboard's card language
   (Fraunces/IBM Plex, amber accent, dark cards) rather than the marketing
   site's aesthetic, since this page is reached from the Lab-branded
   dashboard shell. */

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "requirements", label: "Requirements" },
  { id: "integrations", label: "Integrations" },
  { id: "files", label: "Files" },
  { id: "messages", label: "Messages" },
  { id: "performance", label: "Performance" },
  { id: "support", label: "Support" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export function ProjectTabs({ panels }: { panels: Record<TabId, ReactNode> }) {
  const [active, setActive] = useState<TabId>("overview");

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-1.5 border-b border-[#232838] pb-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`rounded-t-lg px-3.5 py-2 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.06em] transition ${
              active === t.id
                ? "border border-b-0 border-[#333a4c] bg-[#151920] text-[#f0b429]"
                : "text-[#676e7d] hover:text-[#9aa0ae]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="rounded-b-xl rounded-tr-xl border border-[#232838] bg-[#151920] p-6">{panels[active]}</div>
    </div>
  );
}
