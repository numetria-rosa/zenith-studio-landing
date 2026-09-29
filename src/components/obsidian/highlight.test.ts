import { describe, expect, it } from "vitest";
import { highlight, highlightLines } from "./highlight";

const colorOf = (tokens: ReturnType<typeof highlight>, text: string) => tokens.find((t) => t.text.includes(text))?.color;

describe("python highlighter", () => {
  const tokens = highlight('from typing import Literal\nclass Ticket(BaseModel):\n    ok = Ticket.model_validate_json(raw)  # note\n    n = 0\n    s = "a"', "python");

  it("colours keywords, types, calls, strings, numbers and comments", () => {
    expect(colorOf(tokens, "from")).toBe("#C7B0FF");
    expect(colorOf(tokens, "Literal")).toBe("#FFB6C8");
    expect(colorOf(tokens, "Ticket")).toBe("#FFB6C8");
    expect(colorOf(tokens, "model_validate_json")).toBe("#9BDDFF");
    expect(colorOf(tokens, '"a"')).toBe("#7FF0BD");
    expect(colorOf(tokens, "0")).toBe("#FFD27A");
    expect(colorOf(tokens, "# note")).toBe("#6B7180");
  });

  it("keeps indentation and groups tokens per line", () => {
    const lines = highlightLines("class A:\n    x = 1\n", "python");
    expect(lines[1]!.map((t) => t.text).join("")).toBe("    x = 1");
  });
});
