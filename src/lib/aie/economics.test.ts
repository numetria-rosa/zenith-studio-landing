import { describe, expect, it } from "vitest";
import { clientEconomics } from "./economics";

const model = { provider: "anthropic", id: "m", label: "M", price_in: 1, price_out: 5, context: "", note: "" } as const;

describe("clientEconomics", () => {
  it("works revenue, cost and profit from per-million token prices", () => {
    const e = clientEconomics(model, 150);
    expect(e.perReplyUsd).toBeCloseTo((1500 * 1 + 200 * 5) / 1_000_000);
    expect(e.modelPerClientUsd).toBeCloseTo(2.5);
    expect(e.costPerClientUsd).toBeCloseTo(17.5);
    expect(e.revenueUsd).toBe(450);
    expect(e.profitUsd).toBeCloseTo(450 - 52.5);
    expect(e.margin).toBeCloseTo((450 - 52.5) / 450);
  });
  it("gives zero margin when nothing is charged", () => {
    expect(clientEconomics(model, 0).margin).toBe(0);
  });
});
