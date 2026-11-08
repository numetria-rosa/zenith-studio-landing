import { describe, expect, it, beforeEach } from "vitest";
import { COUNTRY_STARTER_PLAN_IDS, currencyForWhopPlanId, marketForWhopPlanId, waPlanForWhopPlanId } from "./whop-plans";

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

describe("currency plans", () => {
  beforeEach(() => {
    process.env.WHATSAPP_UMRAH_STARTER_PLAN_ID = "plan_gbp";
  });

  it("a country plan grants Starter and reports its currency, with no environment setup", () => {
    expect(waPlanForWhopPlanId(COUNTRY_STARTER_PLAN_IDS.USD)).toEqual({ plan: "STARTER", foundingOffer: false });
    expect(currencyForWhopPlanId(COUNTRY_STARTER_PLAN_IDS.USD)).toBe("USD");
    expect(currencyForWhopPlanId(COUNTRY_STARTER_PLAN_IDS.CAD)).toBe("CAD");
    expect(currencyForWhopPlanId(COUNTRY_STARTER_PLAN_IDS.AUD)).toBe("AUD");
    expect(currencyForWhopPlanId(COUNTRY_STARTER_PLAN_IDS.ZAR)).toBe("ZAR");
  });

  it("the UK plan, an unknown plan and no plan are GBP", () => {
    expect(currencyForWhopPlanId("plan_gbp")).toBe("GBP");
    expect(currencyForWhopPlanId("plan_other")).toBe("GBP");
    expect(currencyForWhopPlanId(null)).toBe("GBP");
  });
});

describe("the market tag", () => {
  beforeEach(() => {
    process.env.WHATSAPP_UMRAH_STARTER_PLAN_ID = "plan_gbp";
  });

  it("reads the market and currency from the plan the agency first bought", () => {
    expect(marketForWhopPlanId("plan_gbp")).toEqual({ market: "UK", currency: "GBP" });
    expect(marketForWhopPlanId(COUNTRY_STARTER_PLAN_IDS.USD)).toEqual({ market: "US", currency: "USD" });
    expect(marketForWhopPlanId(COUNTRY_STARTER_PLAN_IDS.CAD)).toEqual({ market: "CA", currency: "CAD" });
    expect(marketForWhopPlanId(COUNTRY_STARTER_PLAN_IDS.AUD)).toEqual({ market: "AU", currency: "AUD" });
    expect(marketForWhopPlanId(COUNTRY_STARTER_PLAN_IDS.ZAR)).toEqual({ market: "ZA", currency: "ZAR" });
  });

  it("shows no tag when there is no plan on record or it is not one of ours", () => {
    expect(marketForWhopPlanId(null)).toBeNull();
    expect(marketForWhopPlanId("plan_something_else")).toBeNull();
  });
});
