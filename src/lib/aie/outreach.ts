export const VARIABLES = [
  { key: "first_name", label: "Their first name" },
  { key: "business", label: "Their business" },
  { key: "city", label: "Their city" },
  { key: "your_name", label: "Your name" },
  { key: "your_company", label: "Your company" },
  { key: "address", label: "Your postal address" },
] as const;

export type VarKey = (typeof VARIABLES)[number]["key"];

/** Replaces {variables} that have a value; leaves the rest visible so nothing is sent half-filled. */
export function fillTemplate(text: string, values: Partial<Record<VarKey, string>>): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const v = (values as Record<string, string | undefined>)[key]?.trim();
    return v ? v : whole;
  });
}

export function missingVariables(text: string): string[] {
  return [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!))];
}

/** Legal minimums for a commercial email (CAN-SPAM, PECR): a postal address and a way to opt out. */
export function complianceChecks(body: string, values: Partial<Record<VarKey, string>>) {
  return {
    hasAddress: Boolean(values.address?.trim()) && body.includes(values.address!.trim()),
    hasOptOut: /reply\s+"?stop"?|unsubscribe|opt out/i.test(body),
    complete: missingVariables(body).length === 0,
  };
}
