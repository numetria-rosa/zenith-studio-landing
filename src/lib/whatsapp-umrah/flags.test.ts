import { describe, expect, it, vi } from "vitest";

const updateMany = vi.fn().mockResolvedValue({ count: 1 });
vi.mock("@/lib/db", () => ({ db: { waMessage: { updateMany: (a: unknown) => updateMany(a) } } }));
import { setReplyFlag } from "./flags";

describe("setReplyFlag", () => {
  it("only touches an AI reply in this agency, so another agency's message id changes nothing", async () => {
    await setReplyFlag("agency-a", "msg-1", true);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "msg-1", agencyId: "agency-a", direction: "OUT", sender: "AI" }, data: { flaggedAt: expect.any(Date) } });
  });
  it("clears the flag", async () => {
    await setReplyFlag("agency-a", "msg-1", false);
    expect(updateMany).toHaveBeenLastCalledWith(expect.objectContaining({ data: { flaggedAt: null } }));
  });
  it("reports nothing changed when no message matched", async () => {
    updateMany.mockResolvedValueOnce({ count: 0 });
    expect(await setReplyFlag("agency-b", "msg-1", true)).toBe(false);
  });
});
