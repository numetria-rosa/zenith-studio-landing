import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
import { isReadyToGoLive } from "./live";

describe("isReadyToGoLive", () => {
  const ready = { whatsappConnected: true, kbHasContent: true, subscriptionActive: true };
  it("needs a connected number, knowledge base content and an active subscription", () => {
    expect(isReadyToGoLive(ready)).toBe(true);
    expect(isReadyToGoLive({ ...ready, whatsappConnected: false })).toBe(false);
    expect(isReadyToGoLive({ ...ready, kbHasContent: false })).toBe(false);
    expect(isReadyToGoLive({ ...ready, subscriptionActive: false })).toBe(false);
  });
});
