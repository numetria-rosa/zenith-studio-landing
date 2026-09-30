import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { debugMessage, debugScore, finalScore, gradeDebugAnswer, gradeDesign, type CapstoneContent, type CapstoneText } from "./capstone";

const dir = path.join(process.cwd(), "content/ai-engineering/capstone");
const content: CapstoneContent = JSON.parse(readFileSync(path.join(dir, "capstone.json"), "utf8"));
const text: CapstoneText = JSON.parse(readFileSync(path.join(dir, "text.json"), "utf8"));
const norm = (s: string) => s.toLowerCase().replace(/&[a-z]+;/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

describe("capstone wording", () => {
  it("does not reword anything: every message is in the old page", () => {
    const source = norm(readFileSync(path.join(process.cwd(), "courses/ai-engineering/module-08.html"), "utf8"));
    const all = [...Object.values(text.design), ...Object.values(text.debug), ...Object.values(text.final)];
    const invented = all.flatMap((s) => s.split(/\{\w+\}/)).map(norm).filter((s) => s.length > 3 && !source.includes(s));
    expect(invented).toEqual([]);
  });
});

describe("gradeDesign", () => {
  const good: Record<string, string> = {
    structured: "We validate every model response against a schema, and repair it first by stripping fences and trailing commas before we parse it again, and if it still fails we raise an error.",
    context: "The token budget is 6000 tokens: we keep chunks with overlap under the context window and truncate the least relevant first, always leaving room for output.",
    retrieval: "We embed the query, rank by cosine similarity, take top-k with k=3, and apply a 0.4 threshold so nothing relevant means we say so honestly.",
    tools: "Every ticket call carries a stable call id, and a cached result is returned on a retry so a duplicate ticket is never filed twice for the same request.",
    agent: "The loop has a step limit of 6 and detects stuck repeat actions, and it terminates on success or when the bound is hit, so it stops cleanly.",
    reliability: "The model call does retries with exponential backoff and jitter, 3 attempts, then one fallback model if the primary is still failing after that.",
    eval: "We keep a labeled eval set including unanswerable test cases, record a baseline, and compare against it before shipping to catch any regression at all.",
  };
  it("passes a complete design and fails an empty one", () => {
    const g = gradeDesign(content.design.fields, good, text.design);
    expect(Object.entries(g.statuses).filter(([, v]) => v.state !== "pass")).toEqual([]);
    expect(g.score).toBe(100);
    expect(gradeDesign(content.design.fields, {}, text.design).score).toBe(0);
  });
  it("asks for a number where the mechanism needs one", () => {
    const r = gradeDesign(content.design.fields, { ...good, retrieval: good.retrieval!.replace(/\d/g, "x") }, text.design);
    expect(r.statuses.retrieval).toMatchObject({ state: "fail", message: text.design.noNumber });
    expect(r.score).toBe(86);
  });
  it("is not passed by a bare keyword list", () => {
    expect(gradeDesign(content.design.fields, { tools: "idempotent cache duplicate" }, text.design).statuses.tools?.state).toBe("fail");
  });
});

describe("gradeDebugAnswer", () => {
  it("needs the problem, the fix, enough words and a sentence", () => {
    expect(gradeDebugAnswer("It retries instantly in a tight loop, so I would add exponential backoff with jitter before each retry.").pass).toBe(true);
    expect(gradeDebugAnswer("no delay instant hammering backoff jitter sleep wait immediately retry").pass).toBe(false);
    expect(debugMessage(gradeDebugAnswer("add backoff and jitter to the retry so it waits between attempts"), text.debug)).toBe(text.debug.noProblem);
    expect(debugMessage(gradeDebugAnswer("short"), text.debug)).toBe(text.debug.brief);
  });
});

describe("finalScore", () => {
  it("averages the three parts and completes at the pass mark", () => {
    expect(finalScore({ design: 100, impl: 100, debug: 50 }, 80)).toEqual({ total: 83, complete: true });
    expect(finalScore({ design: 100, impl: null, debug: null }, 80)).toEqual({ total: 33, complete: false });
    expect(finalScore({ design: null, impl: null, debug: null }, 80)).toEqual({ total: 0, complete: false });
    expect(debugScore(true, false)).toBe(50);
  });
});
