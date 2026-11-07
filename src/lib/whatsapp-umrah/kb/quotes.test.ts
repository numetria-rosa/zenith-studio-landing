import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
import { quoteFor, quotesPrompt } from "./quotes";
import { PACKAGE_FORM_DEFAULTS, type PackageFields } from "./structured";
import { groundingCheck } from "../agent/guards";

const pkg = (over: Partial<PackageFields>): PackageFields => ({ ...PACKAGE_FORM_DEFAULTS, ...over });
const ramadan = pkg({ name: "Ramadan Umrah 2027", pricePerPerson: 3950, deposit: 750 });

describe("quoteFor", () => {
  it("multiplies the price and the deposit, and leaves the balance", () => {
    expect(quoteFor(ramadan, 2)).toEqual({ total: 7900, deposit: 1500, balance: 6400 });
  });
  it("has no deposit or balance when the package has none", () => {
    expect(quoteFor(pkg({ pricePerPerson: 1295, deposit: null }), 3)).toEqual({ total: 3885, deposit: null, balance: null });
  });
  it("does not drift on pence", () => {
    expect(quoteFor(pkg({ pricePerPerson: 199.99, deposit: 20.1 }), 3)).toEqual({ total: 599.97, deposit: 60.3, balance: 539.67 });
  });
});

describe("quotesPrompt", () => {
  it("is empty with no priced package", () => {
    expect(quotesPrompt([])).toBe("");
    expect(quotesPrompt([pkg({ name: "Unpriced" })])).toBe("");
  });
  it("lists totals, deposits and balances for 1 to 8 travellers", () => {
    const text = quotesPrompt([ramadan]);
    expect(text).toContain("Ramadan Umrah 2027 (£3,950 per person)");
    expect(text).toContain("2 travellers £7,900");
    expect(text).toContain("8 travellers £31,600");
    expect(text).toContain("1 traveller £3,950");
    expect(text).toContain("Deposit: 1 £750; 2 £1,500");
    expect(text).toContain("Balance after deposit: 1 £3,200; 2 £6,400");
  });
  it("makes the quoted figures pass the grounding check, with no model arithmetic involved", () => {
    const kb = quotesPrompt([ramadan]);
    const draft = { reply: "For two that is £7,900, with a £1,500 deposit and £6,400 to pay later.", language: "en" as const, intent: "pricing" as const, leadFields: null, handoffReason: null, confidence: 0.9, kbIdsUsed: ["c1"] };
    expect(groundingCheck(draft, kb)).toBeNull();
    expect(groundingCheck({ ...draft, reply: "For two that is £7,000." }, kb)?.guard).toBe("grounding");
  });
});
