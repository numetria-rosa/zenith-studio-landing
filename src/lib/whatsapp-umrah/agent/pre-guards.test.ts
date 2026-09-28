import { describe, expect, it } from "vitest";
import { containsSensitiveData, isOptOutMessage } from "./pre-guards";

describe("isOptOutMessage", () => {
  it("matches the exact opt-out word, case-insensitively, with trailing punctuation", () => {
    expect(isOptOutMessage("STOP")).toBe(true);
    expect(isOptOutMessage("stop.")).toBe(true);
    expect(isOptOutMessage("Unsubscribe")).toBe(true);
    expect(isOptOutMessage("opt out")).toBe(true);
  });
  it("does not match the word used mid-sentence", () => {
    expect(isOptOutMessage("please stop worrying, what's the price?")).toBe(false);
    expect(isOptOutMessage("how do I unsubscribe from this")).toBe(false);
  });
});

describe("containsSensitiveData", () => {
  it("flags a passport-number-shaped string", () => {
    expect(containsSensitiveData("my passport is AB1234567")).toBe(true);
  });
  it("flags a card-number-shaped digit run", () => {
    expect(containsSensitiveData("card is 4111 1111 1111 1111")).toBe(true);
  });
  it("does not flag an ordinary short question", () => {
    expect(containsSensitiveData("how much for 2 travellers in March?")).toBe(false);
    expect(containsSensitiveData("my number is 07700900000")).toBe(false); // 11 digits, below the 13-digit card threshold
  });
});
