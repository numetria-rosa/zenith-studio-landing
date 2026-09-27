import { describe, expect, it } from "vitest";
import { areaCodeOf, faqGroups, faqText, hoursText, qualificationGroups, qualificationRulesText, readChoices } from "./setup-options";

const form = (entries: [string, string][]) => (name: string) => entries.filter(([k]) => k === name).map(([, v]) => v);

describe("setup options", () => {
  it("turns insurance picks into rules and drops values that aren't options", () => {
    const r = readChoices(qualificationGroups("insurance-ai-team"), form([["want", "Auto"], ["want", "Home"], ["want", "hacked"], ["also", "is currently insured"]]));
    expect(r.ok && qualificationRulesText(r.picks)).toBe("A lead is worth pursuing if they want Auto or Home. They should also meet these: the lead is currently insured.");
  });

  it("rejects a required group with nothing picked", () => {
    expect(readChoices(qualificationGroups("brokerages"), form([])).ok).toBe(false);
  });

  it("collapses consecutive days and lists closed ones", () => {
    const h = hoursText({ allDay: false, days: ["Fri", "Mon", "Tue", "Wed"], open: "9am", close: "5pm" });
    expect(h.ok && h.text).toBe("Mon-Wed, Fri 9am-5pm, closed Thu, Sat, Sun");
    expect(hoursText({ allDay: false, days: [], open: "9am", close: "5pm" }).ok).toBe(false);
  });

  it("builds law-firm FAQ lines", () => {
    const r = readChoices(faqGroups("law-firms"), form([["practice", "car accidents"], ["practice", "wrongful death"], ["consult", "The first consultation is free."], ["clients", "We are accepting new clients."], ["lang", "English"], ["lang", "Spanish"]]));
    expect(r.ok && faqText(r.picks)).toBe(
      "We handle car accidents and wrongful death. For anything else, take a message.\nThe first consultation is free.\nWe are accepting new clients.\nOur team speaks English and Spanish."
    );
  });

  it("reads US area codes", () => {
    expect(areaCodeOf("(615) 555-0142")).toBe("615");
    expect(areaCodeOf("+1 213 451 4165")).toBe("213");
    expect(areaCodeOf("555-0142")).toBeNull();
  });
});
