import { db } from "@/lib/db";
import { packageFromJson, type PackageFields } from "./structured";

/* Price maths done in code, not by the model. For every package the agent is handed the totals, deposits and
   balances for 1 to MAX_PARTY travellers, worked out here from the package's own price and deposit, so a quote is a
   figure copied from a table rather than a sum a language model might get wrong. (Mixed parties, such as adults plus
   children, still use the per-person prices in the package text and the grounding check's arithmetic allowance.) */

export const MAX_PARTY = 8;

const gbp = (n: number) => `£${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
const round2 = (n: number) => Math.round(n * 100) / 100;
const sizes = Array.from({ length: MAX_PARTY }, (_, i) => i + 1);
const people = (n: number) => `${n} ${n === 1 ? "traveller" : "travellers"}`;

/** Totals for one package: price x party, deposit x party, and what is left after the deposit. */
export function quoteFor(p: Pick<PackageFields, "pricePerPerson" | "deposit">, party: number) {
  const total = round2(p.pricePerPerson * party);
  const deposit = p.deposit === null ? null : round2(p.deposit * party);
  return { total, deposit, balance: deposit === null ? null : round2(total - deposit) };
}

/** The quotes table as prompt text. Empty when the agency has no priced package. */
export function quotesPrompt(packages: PackageFields[]): string {
  const priced = packages.filter((p) => p.name && p.pricePerPerson > 0);
  if (priced.length === 0) return "";
  const lines = priced.flatMap((p) => {
    const rows = sizes.map((n) => ({ n, ...quoteFor(p, n) }));
    const out = [`- ${p.name} (${gbp(p.pricePerPerson)} per person): total for ${rows.map((r) => `${people(r.n)} ${gbp(r.total)}`).join("; ")}.`];
    if (p.deposit !== null) {
      out.push(`  Deposit: ${rows.map((r) => `${r.n} ${gbp(r.deposit ?? 0)}`).join("; ")}. Balance after deposit: ${rows.map((r) => `${r.n} ${gbp(r.balance ?? 0)}`).join("; ")}.`);
    }
    return out;
  });
  return [`QUOTES (already worked out, for 1 to ${MAX_PARTY} travellers at the per-person price. Copy these figures for totals, deposits and balances, never do the sums yourself):`, ...lines].join("\n");
}

export async function loadQuotes(agencyId: string): Promise<string> {
  const docs = await db.waKbDocument.findMany({ where: { agencyId, kind: "PACKAGE" }, orderBy: { createdAt: "asc" }, take: 30, select: { fields: true } });
  return quotesPrompt(docs.map((d) => packageFromJson(d.fields)));
}
