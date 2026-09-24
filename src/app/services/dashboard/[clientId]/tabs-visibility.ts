/* Shared tab id list and visibility logic, split out from Tabs.tsx because
   that file is "use client" (ProjectTabs uses useState) and page.tsx
   (a server component) needs to call visibleTabIds() directly - Next.js
   refuses to call a function exported from a "use client" module outside
   of rendering it as a component. Found via live testing 2026-09-24: this
   broke every real client dashboard view with a server-side exception,
   pre-existing and unrelated to that day's route move (Tabs.tsx was only
   ever copied verbatim). */

export const ALL_TABS = [
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
    ["integrations", project.integrations.length > 0 || project.sourceServiceId === "ai-receptionist" || project.sourceServiceId === "law-firms"],
    ["billing", project.sourceServiceId === "law-firms" || project.timeEntries.length > 0 || project.oauthConnections.length > 0],
    ["leads", project.sourceServiceId === "ai-lead-capture" || project.sourceServiceId === "brokerages" || project.leads.length > 0],
    ["inbox", project.sourceServiceId === "ai-inbox-manager" || project.mailConnections.length > 0 || project.inboxDrafts.length > 0],
  ];
  return ALL_TABS.map((t) => t.id).filter((id) => always.includes(id) || conditional.some(([tid, show]) => tid === id && show));
}
