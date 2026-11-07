import { describe, expect, it } from "vitest";
import { SCENARIOS } from "./scenarios";
import { checkScenario } from "./check";
import { runAgentPipeline } from "../pipeline";

/* The live run: the same scenarios, sent to the REAL model against a real agency's data (the demo agency, whose four
   packages match fixture.ts). It costs a few model calls and needs the database and model keys, so it only runs when
   EVAL_AGENCY_ID is set:

     node --env-file=.env ./node_modules/vitest/vitest.mjs run src/lib/whatsapp-umrah/agent/scenarios/scenarios.live.test.ts

   with EVAL_AGENCY_ID=<the agency id> in that environment (the id is in the dashboard URL). Nothing is sent to
   WhatsApp. A model's wording varies, so the live run checks facts and behaviour, not phrasing: the action
   (reply or hand-off), the language, readyToBook, anything that must NOT appear, and the must-include strings that
   hold a figure or a date (the ones containing a digit). */

const agencyId = process.env.EVAL_AGENCY_ID;
const only = process.env.EVAL_ONLY; // optional: a category or a scenario id

describe.skipIf(!agencyId)("live agent scenarios", () => {
  const picked = SCENARIOS.filter((s) => !s.languages && (!only || s.category === only || s.id === only)); // scenarios that switch a language off need a scripted agency
  it.each(picked.map((s) => [s.id, s] as const))("%s", { timeout: 90_000 }, async (_id, s) => {
    const result = await runAgentPipeline({ agencyId: agencyId!, customerMessage: s.message, conversationHistory: s.history, knownDetails: s.known });
    const live = { ...s, expect: { ...s.expect, includes: (s.expect.includes ?? []).filter((t) => /\d/.test(t)), guards: undefined, promptIncludes: undefined, noModel: false } };
    expect(checkScenario(live, result)).toEqual([]);
  });
});
