import { describe, expect, it, vi } from "vitest";

const chunkRows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, documentId: `d${i}`, content: `Package ${i}` }));
const findMany = vi.fn();
const queryRaw = vi.fn();
vi.mock("@/lib/db", () => ({ db: { waKbChunk: { findMany: (a: unknown) => findMany(a) }, $queryRaw: (...a: unknown[]) => queryRaw(...a) } }));
vi.mock("./normalize", () => ({ normalizeForRetrieval: async (t: string) => ({ ok: true, text: t }) }));
const embed = vi.fn();
vi.mock("./voyage", () => ({ embed: (...a: unknown[]) => embed(...a), toVectorLiteral: () => "[0]" }));
import { loadKbChunks } from "./retrieve";

describe("loadKbChunks", () => {
  it("gives the model every package, then the closest FAQ and policy chunks", async () => {
    findMany.mockResolvedValue(chunkRows(3));
    embed.mockResolvedValue({ ok: true, embeddings: [[0]] });
    queryRaw.mockResolvedValue([{ id: "f1", documentId: "faq", content: "FAQ", distance: 0.2 }]);
    const r = await loadKbChunks("agency-a", "anything in March?");
    expect(r.ok && r.chunks.map((c) => c.id)).toEqual(["p0", "p1", "p2", "f1"]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { agencyId: "agency-a", document: { kind: "PACKAGE" } } }));
  });

  it("still answers from the packages when the embedding service is down", async () => {
    findMany.mockResolvedValue(chunkRows(2));
    embed.mockResolvedValue({ ok: false, error: "voyage down" });
    const r = await loadKbChunks("agency-a", "price?");
    expect(r.ok && r.chunks.map((c) => c.id)).toEqual(["p0", "p1"]);
  });

  it("fails when there are no packages and no embeddings", async () => {
    findMany.mockResolvedValue([]);
    embed.mockResolvedValue({ ok: false, error: "voyage down" });
    expect((await loadKbChunks("agency-a", "price?")).ok).toBe(false);
  });

  it("falls back to similarity search over everything once there are too many packages for one prompt", async () => {
    findMany.mockResolvedValue(chunkRows(31));
    embed.mockResolvedValue({ ok: true, embeddings: [[0]] });
    queryRaw.mockResolvedValue([{ id: "x", documentId: "d", content: "x", distance: 0.1 }]);
    const r = await loadKbChunks("agency-a", "price?");
    expect(r.ok && r.chunks.map((c) => c.id)).toEqual(["x"]);
  });
});
