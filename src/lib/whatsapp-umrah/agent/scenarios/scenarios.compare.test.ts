import { describe, expect, it, vi } from "vitest";
import { writeFileSync } from "node:fs";
import { SCENARIOS, type Scenario } from "./scenarios";
import { checkScenario } from "./check";

/* The model comparison: the same scenarios through the real pipeline (real guards, real retry on Claude), once with
   Groq writing the first draft and once with Claude Haiku writing it. Against the fixture agency (no database), real
   model calls. It costs a few pence and needs GROQ_API_KEY and ANTHROPIC_API_KEY, so it only runs when EVAL_COMPARE is
   set to the path the results are written to:

     EVAL_COMPARE=out.json node --env-file=.env ./node_modules/vitest/vitest.mjs run src/lib/whatsapp-umrah/agent/scenarios/scenarios.compare.test.ts

   Per model it reports: scenarios passed (facts and behaviour, as in the live run), how often the first draft broke a
   guard (a reply the customer would not have received had the guards not caught it), how often the chat ended up
   handed to a person, and the estimated cost and time per reply. */

vi.mock("@/lib/db", async () => {
  const f = await import("./fixture");
  const docs: Record<string, { id: string; kind: string; title: string }> = Object.fromEntries([
    ...f.FIXTURE_PACKAGES.map((p, i) => [`p${i + 1}`, { id: `d${i + 1}`, kind: "PACKAGE", title: p.name }]),
    ["f1", { id: "df1", kind: "FAQ", title: f.FIXTURE_FAQ.question }],
  ]);
  return {
    db: {
      waAgency: { findUnique: async () => ({ name: "Zenith Demo Travel", agentSettings: { tone: "WARM", emojiEnabled: false, signOff: "on", languagesEnabled: ["en", "ar", "tr", "ur"] } }) },
      waKbChunk: { findMany: async (a: { where: { id: { in: string[] } } }) => a.where.id.in.filter((id) => docs[id]).map((id) => ({ document: docs[id] })) },
      waOccasion: { findMany: async () => f.FIXTURE_OCCASIONS },
      waKbDocument: { findMany: async () => f.FIXTURE_PACKAGES.map((p) => ({ fields: p })) },
    },
  };
});
vi.mock("../../kb/retrieve", async () => {
  const f = await import("./fixture");
  return { loadKbChunks: async () => ({ ok: true, chunks: f.FIXTURE_CHUNKS }) };
});

import { runAgentPipeline } from "../pipeline";

const out = process.env.EVAL_COMPARE;
const only = process.env.EVAL_ONLY;
const ids = process.env.EVAL_IDS?.split(",").map((x) => x.trim()).filter(Boolean); // optional: only these scenario ids
const drafters = (process.env.EVAL_DRAFTERS ?? "groq,claude").split(",") as Drafter[];
// Groq's free tier allows ~8,000 tokens a minute and one of our prompts is ~4,600, so a back-to-back run is rate limited
// and every reply becomes a "technical problem" hand-off. EVAL_PACE_MS spaces the calls out (about 40000 for Groq).
const paceMs = Number(process.env.EVAL_PACE_MS ?? 0);
const picked = SCENARIOS.filter((s) => !s.expect.noModel && !s.languages && (!only || s.category === only || s.id === only) && (!ids || ids.includes(s.id)));

type Drafter = "groq" | "claude";
type Row = { id: string; category: string; passed: boolean; problems: string[]; firstDraftBroke: string[]; handedOff: boolean; intent: string | null; reason: string; costCents: number; ms: number; reply: string };

const results: Record<Drafter, Row[]> = { groq: [], claude: [] };

// A scenario that expects a guard to fire is proving a scripted bad draft is caught; a real model usually writes a good reply
// instead, so action and wording are not judged there (the excludes still are). Elsewhere only price figures are required.
const live = (s: Scenario): Scenario => {
  const trap = (s.expect.guards ?? []).length > 0;
  return { ...s, expect: { ...s.expect, action: trap ? "any" : s.expect.action, includes: trap ? [] : (s.expect.includes ?? []).filter((t) => /\d,\d{3}/.test(t)), guards: undefined, promptIncludes: undefined, noModel: false } };
};

describe.skipIf(!out)("model comparison", () => {
  describe.each(drafters)("first draft by %s", (drafter) => {
    it.each(picked.map((s) => [s.id, s] as const))("%s", { timeout: 300_000 }, async (_id, s) => {
      if (paceMs > 0) await new Promise((r) => setTimeout(r, paceMs));
      const started = Date.now();
      const r = await runAgentPipeline({ agencyId: "demo", customerMessage: s.message, conversationHistory: s.history, knownDetails: s.known, firstDrafter: drafter });
      const problems = checkScenario(live(s), r);
      results[drafter].push({
        id: s.id,
        category: s.category,
        passed: problems.length === 0,
        problems,
        firstDraftBroke: r.guardsTriggered.filter((g) => g !== "off_topic" && g !== "identity_question"),
        handedOff: r.action === "handoff",
        intent: r.intent,
        reason: r.action === "handoff" ? r.reason : "",
        costCents: r.promptRuns.reduce((n, p) => n + (p.costEstimateCents ?? 0), 0),
        ms: Date.now() - started,
        reply: r.action === "reply" ? r.text : r.holdingMessage,
      });
      expect(true).toBe(true); // a failing scenario is a result to report, not a test failure
    });
  });

  it("writes the comparison", () => {
    const summary = (rows: Row[]) => ({
      scenarios: rows.length,
      passed: rows.filter((x) => x.passed).length,
      firstDraftBrokeAGuard: rows.filter((x) => x.firstDraftBroke.length > 0).length,
      handedToAPerson: rows.filter((x) => x.handedOff).length,
      avgCostUsdCents: rows.reduce((n, x) => n + x.costCents, 0) / Math.max(1, rows.length),
      avgSeconds: rows.reduce((n, x) => n + x.ms, 0) / Math.max(1, rows.length) / 1000,
    });
    writeFileSync(out!, JSON.stringify({ groq: { summary: summary(results.groq), rows: results.groq }, claude: { summary: summary(results.claude), rows: results.claude } }, null, 2));
  });
});
