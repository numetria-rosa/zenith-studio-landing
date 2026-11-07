import type { PipelineResult } from "../types";
import type { Scenario } from "./scenarios";

/** The message the customer would actually receive: the reply, or the holding message on a hand-off. */
export const finalText = (r: PipelineResult) => (r.action === "reply" ? r.text : r.holdingMessage);

/** Compares a pipeline result with a scenario's expectations. Returns what went wrong, empty when it all held.
    `prompt` is the text the model was given (only known in the scripted run). */
export function checkScenario(s: Scenario, r: PipelineResult, opts: { modelCalled?: boolean; prompt?: string } = {}): string[] {
  const e = s.expect;
  const bad: string[] = [];
  const text = finalText(r);
  if (r.action !== e.action) bad.push(`expected ${e.action}, got ${r.action}${r.action === "handoff" ? ` (${r.reason})` : ""}`);
  for (const g of e.guards ?? []) if (!r.guardsTriggered.includes(g)) bad.push(`guard "${g}" did not fire (fired: ${r.guardsTriggered.join(", ") || "none"})`);
  for (const t of e.includes ?? []) if (!text.includes(t)) bad.push(`reply is missing "${t}"`);
  for (const t of e.excludes ?? []) if (text.includes(t)) bad.push(`reply contains "${t}"`);
  if (e.language && r.language !== e.language) bad.push(`expected language ${e.language}, got ${r.language}`);
  if (e.readyToBook !== undefined && (r.action === "reply" && r.readyToBook === true) !== e.readyToBook) bad.push(`readyToBook should be ${e.readyToBook}`);
  if (e.noModel && opts.modelCalled) bad.push("the model ran, but this message must be answered without it");
  if (opts.prompt !== undefined) for (const t of e.promptIncludes ?? []) if (!opts.prompt.includes(t)) bad.push(`the prompt is missing "${t}"`);
  return bad;
}
