import { describe, expect, it } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("splits on paragraph breaks", () => {
    const chunks = chunkText("First package details go here with enough words to count as a real chunk.\n\nSecond package details also with enough words to be kept as a chunk.");
    expect(chunks).toHaveLength(2);
  });

  it("drops near-empty fragments", () => {
    const chunks = chunkText("A real paragraph with plenty of words to survive the minimum length filter easily.\n\nHi\n\n");
    expect(chunks).toHaveLength(1);
  });

  it("splits an oversized paragraph by word count", () => {
    const longParagraph = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
    const chunks = chunkText(longParagraph);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.split(/\s+/).length <= 180)).toBe(true);
  });

  it("returns nothing for empty input", () => {
    expect(chunkText("   \n\n  ")).toEqual([]);
  });
});
