import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/outreach-mail", () => ({ sendAdminAlert: async () => {} }));
const { usageHold, HOURLY_EVENT_LIMIT } = await import("./usage-costs");

const now = new Date("2026-10-21T10:00:00Z");

describe("usageHold", () => {
  it("lets normal usage through", () => {
    expect(usageHold({ weekCents: 1000, monthlyBudgetCents: 15000, hourEvents: 20, now })).toBeNull();
  });
  it("holds for a day once a week's spend passes 40% of the monthly budget", () => {
    expect(usageHold({ weekCents: 6000, monthlyBudgetCents: 15000, hourEvents: 0, now })).toBeNull();
    const h = usageHold({ weekCents: 6001, monthlyBudgetCents: 15000, hourEvents: 0, now });
    expect(h).toEqual({ reason: "weekly", until: new Date("2026-10-22T10:00:00Z") });
  });
  it("holds for an hour when actions run away", () => {
    expect(usageHold({ weekCents: 0, monthlyBudgetCents: 15000, hourEvents: HOURLY_EVENT_LIMIT, now })).toBeNull();
    expect(usageHold({ weekCents: 0, monthlyBudgetCents: 15000, hourEvents: HOURLY_EVENT_LIMIT + 1, now })).toEqual({ reason: "hourly", until: new Date("2026-10-21T11:00:00Z") });
  });
});
