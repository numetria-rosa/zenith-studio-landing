import { describe, expect, it } from "vitest";
import { confidenceCheck, groundingCheck, hedgeCheck, lengthCheck, noKbSourceCheck, runGuards, scopeGuard, unsupportedPromiseCheck, falseBookingClaimCheck, perPersonClaimCheck, perPersonFigureCheck } from "./guards";
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

  describe("the 'two of us in Ramadan 2027' question", () => {
    const kb = "7 Night Economy Umrah: £1,295 per person.";
    const message = "i want to go to umrah with my mom in ramadhan 2027, how much will it be the two of us";
    const reply = "The 7 Night Economy Umrah is £1,295 per person, so £2,590 for two of you. I'll note Ramadan 2027 for the team.";

    it("passes the group total and the year the customer typed", () => {
      const draft = baseDraft({ reply });
      expect(groundingCheck(draft, kb, message)).toBeNull();
    });

    it("still rejects a total that is not price x travellers", () => {
      const draft = baseDraft({ reply: "£1,295 per person, so £2,800 for two." });
      expect(groundingCheck(draft, kb, message)?.detail).toContain("2800");
    });

    it("still rejects a year the customer never typed", () => {
      expect(groundingCheck(baseDraft({ reply: "Ramadan 2027 is open." }), kb, "when can we go?")?.detail).toContain("2027");
    });
  });

  describe("arithmetic the agent is expected to do", () => {
    const kb = "7 Night Economy Umrah: £1,295 per person, 7 nights. Deposit £200. Child 2 to 11: £1,150.";
    const ok = (reply: string, message = "") => groundingCheck(baseDraft({ reply }), kb, message);

    it("passes totals for any party size, balance after deposit, adult plus child, and a per-night price", () => {
      expect(ok("For three that is £3,885.")).toBeNull();
      expect(ok("The balance after the £200 deposit is £1,095.")).toBeNull();
      expect(ok("One adult and one child is £2,445.")).toBeNull();
      expect(ok("That works out at about £185 a night.")).toBeNull();
    });

    it("passes date and stay arithmetic from the customer's own numbers", () => {
      // 5 March + 7 nights = 12 March, and 7 + 7 = 14 nights for a double stay
      expect(ok("Leaving 5 March, you would be back on 12 March.", "we fly 5 March for 7 nights")).toBeNull();
      expect(ok("Two weeks is 14 nights.", "")).toBeNull();
    });

    it("still rejects a price that is no arithmetic on anything given", () => {
      expect(ok("It is £1,777 per person.")?.guard).toBe("grounding");
      expect(ok("It is £3,333 for you both.")?.guard).toBe("grounding");
    });
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
    expect(lengthCheck(baseDraft({ reply: "a".repeat(1501) }))?.guard).toBe("length");
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
  it("does not fail a draft that answers from a KB chunk", () => {
    expect(confidenceCheck(baseDraft({ confidence: 0.3, kbIdsUsed: ["chunk1"] }))).toBeNull();
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
  it("lets a KB-backed answer say the team will confirm the rest, and ask a follow-up", () => {
    const reply = "The 7 Night Economy Umrah is £1,295 per person. I'll check Ramadan availability with the team. Which days of Ramadan are you planning to go?";
    expect(hedgeCheck(baseDraft({ reply, kbIdsUsed: ["chunk1"] }))).toBeNull();
    expect(hedgeCheck(baseDraft({ reply }))?.guard).toBe("hedge");
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

describe("Arabic and Urdu digits", () => {
  const kb = "Economy package: £1,295 per person, 7 nights.";
  it("reads Arabic-Indic and Urdu digits, so an invented price in them still fails", () => {
    expect(groundingCheck(baseDraft({ reply: "السعر ٩٩٩٩ جنيه." }), kb)?.detail).toContain("9999");
    expect(groundingCheck(baseDraft({ reply: "قیمت ۹۹۹۹ پاؤنڈ ہے۔" }), kb)?.detail).toContain("9999");
  });
  it("passes a grounded number written in Arabic-Indic digits, separators included", () => {
    expect(groundingCheck(baseDraft({ reply: "السعر £١٬٢٩٥ للشخص لمدة ٧ ليالٍ." }), kb)).toBeNull();
  });
  it("passes arithmetic written in Arabic-Indic digits", () => {
    expect(groundingCheck(baseDraft({ reply: "المجموع £٢٬٥٩٠ لشخصين." }), kb)).toBeNull();
  });
});

describe("unsupportedPromiseCheck", () => {
  const say = (reply: string) => baseDraft({ reply });
  it("rejects a promise the knowledge base never makes", () => {
    expect(unsupportedPromiseCheck(say("Our team will call you shortly."), "Package: Ramadan. Price: £3,950.")?.guard).toBe("unsupported_promise");
    expect(unsupportedPromiseCheck(say("You can pay by bank transfer."), "Deposit to book, full balance due 10 weeks before departure.")?.guard).toBe("unsupported_promise");
    expect(unsupportedPromiseCheck(say("We will send you a payment link."), "Payment terms: deposit to book.")?.guard).toBe("unsupported_promise");
    expect(unsupportedPromiseCheck(say("Pay the deposit by card."), "Payment terms: deposit to book.")?.guard).toBe("unsupported_promise");
  });
  it("is not fooled by the KB merely mentioning the word (call our office, phone number, card details)", () => {
    const kb = "Questions? Call our office on 0800 123 456 or find our phone number on the website. We never take card details on WhatsApp.";
    expect(unsupportedPromiseCheck(say("Our team will call you shortly."), kb)?.guard).toBe("unsupported_promise");
    expect(unsupportedPromiseCheck(say("Pay the deposit by card."), kb)?.guard).toBe("unsupported_promise");
  });
  it("allows the promise when the knowledge base makes it", () => {
    expect(unsupportedPromiseCheck(say("Our team will call you shortly."), "After booking, our team will call you within a day to confirm.")).toBeNull();
    expect(unsupportedPromiseCheck(say("You can pay by bank transfer."), "Pay the deposit by bank transfer to the account we send you.")).toBeNull();
    expect(unsupportedPromiseCheck(say("You can pay by card."), "We accept payment by debit or credit card.")).toBeNull();
  });
  it("leaves ordinary replies alone", () => {
    expect(unsupportedPromiseCheck(say("Our team will be in touch shortly."), "")).toBeNull();
  });
});

describe("falseBookingClaimCheck", () => {
  const say = (reply: string) => baseDraft({ reply });
  it("rejects a reply that says the booking is made or confirmed", () => {
    expect(falseBookingClaimCheck(say("Great! I've booked the Ramadan package."))?.guard).toBe("false_booking_claim");
    expect(falseBookingClaimCheck(say("I’ve booked it for you."))?.guard).toBe("false_booking_claim");
    expect(falseBookingClaimCheck(say("Your booking is confirmed."))?.guard).toBe("false_booking_claim");
    expect(falseBookingClaimCheck(say("We have reserved your seats."))?.guard).toBe("false_booking_claim");
  });
  it("allows noting a request and ordinary mentions of booking", () => {
    expect(falseBookingClaimCheck(say("I've noted your request. Our team will complete the booking."))).toBeNull();
    expect(falseBookingClaimCheck(say("You can book by choosing a package and paying the deposit."))).toBeNull();
  });
});

describe("perPersonFigureCheck", () => {
  const prices = { prices: [1295, 3950], deposits: [200, 750], balances: [1095, 3200] };
  const say = (reply: string, travelers?: number) => baseDraft({ reply, leadFields: travelers ? { travelers } : null });
  it("rejects a per-person price given as the total for a group (the live bug)", () => {
    expect(perPersonFigureCheck(say("For 2 travellers the total is £3,950 and the deposit is £1,500."), prices)?.guard).toBe("per_person_figure");
    expect(perPersonFigureCheck(say("The total for the two of you is £3,950.", 2), prices)?.guard).toBe("per_person_figure");
    expect(perPersonFigureCheck(say("That comes to £1,295 in total.", 3), prices)?.guard).toBe("per_person_figure");
  });
  it("accepts the right total, and a per-person price quoted as such next to the total", () => {
    expect(perPersonFigureCheck(say("For 2 travellers the total is £7,900."), prices)).toBeNull();
    expect(perPersonFigureCheck(say("It is £3,950 per person, so the total for 2 travellers is £7,900."), prices)).toBeNull();
    expect(perPersonFigureCheck(say("£3,950 per person, £7,900 in total for 2 travellers."), prices)).toBeNull();
  });
  it("leaves a single traveller and replies with no party size alone", () => {
    expect(perPersonFigureCheck(say("The total is £3,950 for one traveller.", 1), prices)).toBeNull();
    expect(perPersonFigureCheck(say("The total package price is £3,950."), prices)).toBeNull();
  });
  it("does nothing without any package prices", () => {
    expect(perPersonFigureCheck(say("For 2 travellers the total is £3,950."), { prices: [], deposits: [], balances: [] })).toBeNull();
  });
});

describe("perPersonFigureCheck: deposits and balances", () => {
  const figs = { prices: [1295, 3950], deposits: [200, 750], balances: [1095, 3200] };
  const say = (reply: string, travelers?: number) => baseDraft({ reply, leadFields: travelers ? { travelers } : null });
  it("rejects a per-person deposit or balance given for the group", () => {
    expect(perPersonFigureCheck(say("For 2 travellers the deposit is £750."), figs)?.guard).toBe("per_person_figure");
    expect(perPersonFigureCheck(say("The deposit is £750 to book.", 2), figs)?.detail).toMatch(/deposit/);
    expect(perPersonFigureCheck(say("For 2 travellers the balance is £3,200."), figs)?.detail).toMatch(/balance/);
    expect(perPersonFigureCheck(say("The remaining £1,095 is due 10 weeks before departure.", 2), figs)?.guard).toBe("per_person_figure");
  });
  it("accepts the group figure, and a per-person one that says so", () => {
    expect(perPersonFigureCheck(say("For 2 travellers the deposit is £1,500 and the balance is £6,400."), figs)).toBeNull();
    expect(perPersonFigureCheck(say("The deposit is £750 per person, so £1,500 for 2 travellers."), figs)).toBeNull();
    expect(perPersonFigureCheck(say("£750 deposit each, £1,500 in all for 2 travellers."), figs)).toBeNull();
  });
  it("leaves one traveller alone", () => {
    expect(perPersonFigureCheck(say("The deposit is £750.", 1), figs)).toBeNull();
  });
});

describe("perPersonClaimCheck", () => {
  const kb = "Price: £3,950 per person (twin sharing). Deposit: £750 per person.";
  const say = (reply: string) => baseDraft({ reply });
  it("rejects a group figure labelled per person (the live bug)", () => {
    expect(perPersonClaimCheck(say("The deposit to book is £1,500 per person, so £3,000 in total."), kb)?.guard).toBe("per_person_claim");
    expect(perPersonClaimCheck(say("It is £7,900 per person."), kb)?.guard).toBe("per_person_claim");
    expect(perPersonClaimCheck(say("£1,500 each."), kb)?.guard).toBe("per_person_claim");
  });
  it("accepts a per-person figure that is in the knowledge base", () => {
    expect(perPersonClaimCheck(say("The deposit is £750 per person, so £1,500 for two."), kb)).toBeNull();
    expect(perPersonClaimCheck(say("£3,950 per person, twin sharing."), kb)).toBeNull();
    expect(perPersonClaimCheck(say("£3,950 each."), kb)).toBeNull();
  });
  it("accepts a per-person figure the customer gave (their budget)", () => {
    expect(perPersonClaimCheck(say("Under £2,000 per person we have the Economy package."), kb, "something under 2000 pounds each")).toBeNull();
    expect(perPersonClaimCheck(say("Under £2,000 per person we have the Economy package."), kb, "what do you have?")?.guard).toBe("per_person_claim");
  });
  it("leaves replies that never say per person alone", () => {
    expect(perPersonClaimCheck(say("For two travellers the total is £7,900."), kb)).toBeNull();
  });
});
