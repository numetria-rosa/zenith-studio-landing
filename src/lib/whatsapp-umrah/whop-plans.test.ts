import { describe, expect, it, beforeEach } from "vitest";
import { waPlanForWhopPlanId } from "./whop-plans";

describe("waPlanForWhopPlanId", () => {
  beforeEach(() => {
    process.env.WHATSAPP_UMRAH_STARTER_PLAN_ID = "plan_starter";
    process.env.WHATSAPP_UMRAH_FOUNDING_PLAN_ID = "plan_founding";
  });

  it("resolves the Starter plan id to STARTER with no founding offer", () => {
    expect(waPlanForWhopPlanId("plan_starter")).toEqual({ plan: "STARTER", foundingOffer: false });
  });

  it("resolves the Founding plan id to STARTER with the founding offer flag", () => {
    expect(waPlanForWhopPlanId("plan_founding")).toEqual({ plan: "STARTER", foundingOffer: true });
  });

  it("returns null for an unrelated or missing plan id", () => {
    expect(waPlanForWhopPlanId("plan_something_else")).toBeNull();
    expect(waPlanForWhopPlanId(null)).toBeNull();
    expect(waPlanForWhopPlanId(undefined)).toBeNull();
  });
});
