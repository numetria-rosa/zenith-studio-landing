import { describe, expect, it } from "vitest";
import { containsSensitiveData, isIdentityQuestion, isOptInMessage, isOptOutMessage } from "./pre-guards";
import { guessLanguage } from "./language";

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

describe("opt-out in four languages, and the way back in", () => {
  it("recognises the whole-message opt-out in Arabic, Turkish and Urdu", () => {
    expect(isOptOutMessage("توقف")).toBe(true);
    expect(isOptOutMessage("Durdur")).toBe(true);
    expect(isOptOutMessage("بند کریں")).toBe(true);
  });
  it("recognises START but not the word inside a sentence", () => {
    expect(isOptInMessage("START")).toBe(true);
    expect(isOptInMessage("start")).toBe(true);
    expect(isOptInMessage("when does the trip start?")).toBe(false);
  });
});

describe("guessLanguage", () => {
  it("tells our four languages apart by script and letters", () => {
    expect(guessLanguage("how much is Umrah in March?")).toBe("en");
    expect(guessLanguage("كم سعر العمرة في رمضان")).toBe("ar");
    expect(guessLanguage("عمرے کا کتنا خرچہ ہے؟ ٹکٹ بھی شامل ہے")).toBe("ur");
    expect(guessLanguage("Umre fiyatları ne kadar, ğ ş ı")).toBe("tr");
  });
});

describe("containsSensitiveData", () => {
  it("flags a passport-number-shaped string", () => {
    expect(containsSensitiveData("my passport is AB1234567")).toBe(true);
  });
  it("flags a card-number-shaped digit run", () => {
    expect(containsSensitiveData("card is 4111 1111 1111 1111")).toBe(true);
  });
  it("does not mistake a long phone number or booking reference for a card (Luhn)", () => {
    expect(containsSensitiveData("call me on 0044 7700 900123")).toBe(false); // 14 digits, fails the card checksum
    expect(containsSensitiveData("booking ref 1234567890123456")).toBe(false);
  });
  it("does not flag an ordinary short question", () => {
    expect(containsSensitiveData("how much for 2 travellers in March?")).toBe(false);
    expect(containsSensitiveData("my number is 07700900000")).toBe(false); // 11 digits, below the 13-digit card threshold
  });
});

describe("isIdentityQuestion", () => {
  it("catches the usual ways of asking whether it's a bot", () => {
    for (const t of ["Wait, am I talking to a real person or a bot?", "are you a bot", "Are you human?", "is this a robot", "are you AI?", "Am I speaking with a person?"]) expect(isIdentityQuestion(t)).toBe(true);
  });
  it("does not treat a request for a person as an identity question", () => {
    for (const t of ["Can I speak to a real person?", "I want to talk to a human", "are you able to put me through to a person?", "how much is the 7 night package?"]) expect(isIdentityQuestion(t)).toBe(false);
  });
});

describe("containsSensitiveData with Arabic and Urdu digits", () => {
  it("catches a card number typed in Arabic-Indic or Urdu digits", () => {
    expect(containsSensitiveData("٤٢٤٢ ٤٢٤٢ ٤٢٤٢ ٤٢٤٢")).toBe(true);
    expect(containsSensitiveData("۴۲۴۲ ۴۲۴۲ ۴۲۴۲ ۴۲۴۲")).toBe(true);
  });
});
