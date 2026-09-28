import { describe, expect, it } from "vitest";
import { confidenceCheck, groundingCheck, hedgeCheck, lengthCheck, noKbSourceCheck, runGuards, scopeGuard } from "./guards";
import type { AgentDraft } from "./types";

const baseDraft = (overrides: Partial<AgentDraft> = {}): AgentDraft => ({
  reply: "Thanks for reaching out!",
  language: "en",
  intent: "package_info",
  leadFields: null,
  handoffReason: null,
  confidence: 0.9,
  kbIdsUsed: [],
  ...overrides,
});

describe("groundingCheck", () => {
  it("passes when every number in the reply appears in the KB text", () => {
    const draft = baseDraft({ reply: "Our Economy package is £950 for 10 nights." });
    expect(groundingCheck(draft, "Economy package: £950, 10 nights, breakfast included.")).toBeNull();
  });

  it("fails when the reply states a price not present in the retrieved KB text", () => {
    const draft = baseDraft({ reply: "That package is £1200." });
    const result = groundingCheck(draft, "Economy package: £950, 10 nights.");
    expect(result?.guard).toBe("grounding");
    expect(result?.detail).toContain("1200");
  });

  it("ignores single-digit numbers (too noisy to be worth checking)", () => {
    const draft = baseDraft({ reply: "We have 5-star hotels." });
    expect(groundingCheck(draft, "Nothing relevant retrieved.")).toBeNull();
  });
});

describe("scopeGuard", () => {
  it("hands off on every hard-handoff intent regardless of reply content", () => {
    for (const intent of ["complaint", "payment_dispute", "fiqh_question", "visa_question", "emergency", "person_request"] as const) {
      const result = scopeGuard(baseDraft({ intent, reply: "This looks like a fine, normal reply." }));
      expect(result?.guard).toBe("scope");
    }
  });

  it("hands off on off-topic intent", () => {
    expect(scopeGuard(baseDraft({ intent: "off_topic" }))?.guard).toBe("scope");
  });

  it("passes ordinary business intents", () => {
    expect(scopeGuard(baseDraft({ intent: "package_info" }))).toBeNull();
    expect(scopeGuard(baseDraft({ intent: "pricing" }))).toBeNull();
  });
});

describe("lengthCheck", () => {
  it("fails on an empty reply", () => {
    expect(lengthCheck(baseDraft({ reply: "   " }))?.guard).toBe("length");
  });
  it("fails on an implausibly long reply", () => {
    expect(lengthCheck(baseDraft({ reply: "a".repeat(1001) }))?.guard).toBe("length");
  });
  it("passes a normal reply", () => {
    expect(lengthCheck(baseDraft())).toBeNull();
  });
});

describe("confidenceCheck", () => {
  it("forces a handoff when the model reports low confidence, even with a polite reply", () => {
    const draft = baseDraft({ confidence: 0.2, reply: "I'll check on that for you." });
    expect(confidenceCheck(draft)?.guard).toBe("confidence");
  });
  it("passes a confident draft", () => {
    expect(confidenceCheck(baseDraft({ confidence: 0.95 }))).toBeNull();
  });
});

describe("hedgeCheck", () => {
  it("catches a hedged reply even when the model reports high confidence", () => {
    const draft = baseDraft({ confidence: 0.9, reply: "I'm not sure about that one, let me check and get back to you." });
    expect(hedgeCheck(draft)?.guard).toBe("hedge");
  });
  it("catches the same hedge with typographic apostrophes, as models commonly emit", () => {
    const draft = baseDraft({ reply: "I’m sorry, I don’t have that information right now. I’ll check with our team." });
    expect(hedgeCheck(draft)?.guard).toBe("hedge");
  });
  it("passes a direct answer", () => {
    expect(hedgeCheck(baseDraft({ reply: "It's £950 for 10 nights." }))).toBeNull();
  });
});

describe("noKbSourceCheck", () => {
  it("fails a business-info reply with no vague filler wording but no cited KB source either", () => {
    const draft = baseDraft({ intent: "pricing", kbIdsUsed: [], reply: "I'm checking the details and will get back to you shortly." });
    expect(noKbSourceCheck(draft)?.guard).toBe("no_kb_source");
  });
  it("passes when a KB chunk is cited", () => {
    expect(noKbSourceCheck(baseDraft({ intent: "pricing", kbIdsUsed: ["chunk1"] }))).toBeNull();
  });
  it("does not apply to non-info-seeking intents", () => {
    expect(noKbSourceCheck(baseDraft({ intent: "complaint", kbIdsUsed: [] }))).toBeNull();
  });
});

describe("runGuards", () => {
  it("returns every failing guard, not just the first", () => {
    const draft = baseDraft({ intent: "off_topic", reply: "It costs £5000 and has 4.5 stars." });
    const failures = runGuards(draft, "no relevant KB text");
    expect(failures.map((f) => f.guard).sort()).toEqual(["grounding", "scope"]);
  });
  it("returns nothing for a clean, grounded, in-scope draft that cites its KB source", () => {
    const draft = baseDraft({ reply: "It's £950 for 10 nights.", kbIdsUsed: ["chunk1"] });
    expect(runGuards(draft, "£950, 10 nights")).toEqual([]);
  });
});
