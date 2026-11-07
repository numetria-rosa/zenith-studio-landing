import { describe, expect, it, vi } from "vitest";
import type { AgentDraft } from "../types";
import { FIXTURE_CHUNKS, FIXTURE_OCCASIONS, FIXTURE_PACKAGES } from "./fixture";
import { SCENARIOS, type Scenario } from "./scenarios";
import { checkScenario } from "./check";

// The scripted run: the real pipeline, guards and formatting, with the model's reply scripted per scenario.
const run = vi.hoisted(() => ({ scenario: null as Scenario | null, modelCalled: false, prompt: "" }));

vi.mock("@/lib/db", async () => {
  const f = await import("./fixture");
  const docs: Record<string, { id: string; kind: string; title: string }> = Object.fromEntries([
    ...f.FIXTURE_PACKAGES.map((p, i) => [`p${i + 1}`, { id: `d${i + 1}`, kind: "PACKAGE", title: p.name }]),
    ["f1", { id: "df1", kind: "FAQ", title: f.FIXTURE_FAQ.question }],
  ]);
  return {
    db: {
      waAgency: { findUnique: async () => ({ name: "Zenith Demo Travel", agentSettings: { tone: "WARM", emojiEnabled: false, signOff: "on", languagesEnabled: run.scenario?.languages ?? ["en", "ar", "tr", "ur"] } }) },
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
vi.mock("../draft", () => ({
  todayLine: () => "TODAY: Saturday 7 November 2026",
  draftReply: async (input: { kbContext: string; extraContext?: string; conversationHistory: string }) => {
    run.modelCalled = true;
    run.prompt = `${input.kbContext}\n${input.extraContext ?? ""}\n${input.conversationHistory}`;
    const d = run.scenario?.draft;
    return d ? { ok: true, draft: d, latencyMs: 1 } : { ok: false, error: "the model must not run", latencyMs: 0 };
  },
}));
vi.mock("../escalate", () => ({
  escalateDraft: async () => {
    const s = run.scenario;
    const d: AgentDraft | undefined = s?.retry ?? s?.draft;
    return d ? { ok: true, draft: d, latencyMs: 1 } : { ok: false, error: "no retry scripted", latencyMs: 0 };
  },
}));

import { runAgentPipeline } from "../pipeline";

describe("the suite itself", () => {
  it("has at least 60 scenarios with unique ids, across every area that matters", () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
    const cats = new Set(SCENARIOS.map((s) => s.category));
    for (const c of ["sensitive", "pricing", "dates", "occasions", "vague", "handoff", "knowledge gap", "scope", "injection", "languages", "booking", "memory", "format", "identity"]) expect(cats.has(c)).toBe(true);
  });
  it("fixture packages are the four the scenarios assume", () => {
    expect(FIXTURE_PACKAGES).toHaveLength(4);
    expect(FIXTURE_CHUNKS).toHaveLength(5);
    expect(FIXTURE_OCCASIONS.map((o) => o.name)).toContain("Ramadan 2027");
  });
});

describe.each([...new Set(SCENARIOS.map((s) => s.category))])("scenarios: %s", (category) => {
  it.each(SCENARIOS.filter((s) => s.category === category).map((s) => [s.id, s] as const))("%s", async (_id, s) => {
    run.scenario = s;
    run.modelCalled = false;
    run.prompt = "";
    const result = await runAgentPipeline({ agencyId: "demo", customerMessage: s.message, conversationHistory: s.history, knownDetails: s.known });
    expect(checkScenario(s, result, { modelCalled: run.modelCalled, prompt: run.prompt })).toEqual([]);
  });
});
