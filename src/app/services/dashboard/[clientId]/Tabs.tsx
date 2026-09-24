"use client";

import { useState } from "react";
import type { ReactNode } from "react";

/* Simple client-side tab switcher - no routing/URL state needed for a
   single-page workspace like this. Matches the dashboard's card language
   (Fraunces/IBM Plex, amber accent, dark cards) rather than the marketing
   site's aesthetic, since this page is reached from the Lab-branded
   dashboard shell. */

const ALL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "requirements", label: "Requirements" },
  { id: "integrations", label: "Integrations" },
  { id: "billing", label: "Billing" },
  { id: "leads", label: "Leads" },
  { id: "inbox", label: "Inbox" },
  { id: "messages", label: "Messages" },
  { id: "performance", label: "Performance" },
  { id: "support", label: "Support" },
] as const;

export type TabId = (typeof ALL_TABS)[number]["id"];

export type ActionItem = { id: string; label: string; tabId: TabId };

/** Which tabs actually apply to this project, computed server-side from
    what's in the data (not a hardcoded per-service matrix that would drift
    out of sync as bundles gain/lose roles) - overview/messages/performance/
    support are generic enough to always show, everything else only shows up
    once there's a real reason for the client to look at it. A client
    shouldn't have to guess which of ten tabs matters for what they bought. */
export function visibleTabIds(project: {
  requirements: unknown[];
  integrations: unknown[];
  timeEntries: unknown[];
  oauthConnections: unknown[];
  leads: unknown[];
  mailConnections: unknown[];
  inboxDrafts: unknown[];
  sourceServiceId: string | null;
}): TabId[] {
  const always: TabId[] = ["overview", "messages", "performance", "support"];
  const conditional: [TabId, boolean][] = [
    ["requirements", project.requirements.length > 0],
    ["integrations", project.integrations.length > 0 || project.sourceServiceId === "ai-receptionist"],
    ["billing", project.sourceServiceId === "law-firms" || project.timeEntries.length > 0 || project.oauthConnections.length > 0],
    ["leads", project.sourceServiceId === "ai-lead-capture" || project.sourceServiceId === "brokerages" || project.leads.length > 0],
    ["inbox", project.sourceServiceId === "ai-inbox-manager" || project.mailConnections.length > 0 || project.inboxDrafts.length > 0],
  ];
  return ALL_TABS.map((t) => t.id).filter((id) => always.includes(id) || conditional.some(([tid, show]) => tid === id && show));
}

export function ProjectTabs({
  panels,
  tabs,
  actionItems,
  initialTab,
}: {
  panels: Record<TabId, ReactNode>;
  tabs: TabId[];
  actionItems: ActionItem[];
  initialTab?: TabId;
}) {
  const [active, setActive] = useState<TabId>(initialTab ?? "overview");
  const labelFor = (id: TabId) => ALL_TABS.find((t) => t.id === id)?.label ?? id;

  return (
    <div className="mt-8">
      {actionItems.length > 0 && (
        <div className="mb-5 rounded-xl border border-[#f0b429]/30 bg-[#f0b429]/10 p-4">
          <div className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#f0b429]">
            Action needed
          </div>
          <div className="mt-2.5 flex flex-col gap-1.5">
            {actionItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.tabId)}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-[#f0b429]/20 bg-[#191d26] px-3.5 py-2.5 text-left text-[13.5px] font-semibold text-[#eeeee7] transition hover:border-[#f0b429]/50"
              >
                {item.label}
                <span className="flex-shrink-0 font-[family-name:var(--font-course-mono)] text-[11px] uppercase tracking-[0.06em] text-[#f0b429]">
                  {labelFor(item.tabId)} &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 border-b border-[#232838] pb-0">
        {tabs.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            className={`rounded-t-lg px-3.5 py-2 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.06em] transition ${
              active === id
                ? "border border-b-0 border-[#333a4c] bg-[#151920] text-[#f0b429]"
                : "text-[#676e7d] hover:text-[#9aa0ae]"
            }`}
          >
            {labelFor(id)}
          </button>
        ))}
      </div>
      <div className="rounded-b-xl rounded-tr-xl border border-[#232838] bg-[#151920] p-6">{panels[active]}</div>
    </div>
  );
}
