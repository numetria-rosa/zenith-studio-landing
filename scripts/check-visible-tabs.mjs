// Quick regression check for visibleTabIds (Tabs.tsx) - added after fixing
// a real bug where a brand-new brokerages project hid its own Leads tab
// until the first lead arrived, even though the capture endpoint was
// already live for it. Run with: npx tsx scripts/check-visible-tabs.mjs
import assert from "node:assert/strict";
import { visibleTabIds } from "../src/app/lab/dashboard/services/[projectId]/Tabs.tsx";

const base = {
  requirements: [], integrations: [], timeEntries: [], oauthConnections: [],
  leads: [], mailConnections: [], inboxDrafts: [], sourceServiceId: null,
};

assert.ok(
  visibleTabIds({ ...base, sourceServiceId: "brokerages" }).includes("leads"),
  "brokerages project should show the Leads tab even with 0 leads"
);

assert.ok(
  visibleTabIds({ ...base, sourceServiceId: "law-firms" }).includes("billing"),
  "law-firms project should still show the Billing tab"
);

const inbox = visibleTabIds({ ...base, sourceServiceId: "ai-inbox-manager" });
assert.ok(!inbox.includes("leads"), "inbox-manager project should not show Leads tab");
assert.ok(!inbox.includes("billing"), "inbox-manager project should not show Billing tab");

console.log("All visibleTabIds checks passed.");
