import type { PackageFields } from "./structured";

/* Quotes written in code. Once we know WHICH package and HOW MANY travellers (from this message or from what the chat
   already told us), the total, deposit and balance are worked out here and handed to the model as a ready sentence,
   and the guards check every figure in the reply against the same numbers. The model has repeatedly put a per-person
   figure where the group figure belongs (and the other way round), so it is not trusted with the sums. */

export const MAX_PARTY = 8;
export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Totals for one package: price x party, deposit x party, and what is left after the deposit. */
export function quoteFor(p: Pick<PackageFields, "pricePerPerson" | "deposit">, party: number) {
  const total = round2(p.pricePerPerson * party);
  const deposit = p.deposit === null ? null : round2(p.deposit * party);
  return { total, deposit, balance: deposit === null ? null : round2(total - deposit) };
}

export type QuotePackage = Pick<PackageFields, "name" | "type" | "pricePerPerson" | "deposit" | "priceBasis">;

const gbp = (n: number) => `£${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
const WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
const ONE_OR_MORE = `(\\d+|${Object.keys(WORDS).join("|")})`;

/** How many are travelling, when the text says so ("for 2", "the two of us", "3 people", "both of us"). */
export function detectParty(text: string): number | null {
  const t = text.toLowerCase();
  const n = (raw: string) => (WORDS[raw] ?? Number(raw));
  const patterns: [RegExp, (m: RegExpMatchArray) => number][] = [
    [new RegExp(`\\b${ONE_OR_MORE}\\s+(?:of us|people|persons|travellers?|travelers?|adults|pax|passengers|guests)\\b`), (m) => n(m[1])],
    [new RegExp(`\\bfor\\s+${ONE_OR_MORE}\\b(?!\\s*(?:nights?|days?|weeks?))`), (m) => n(m[1])],
    [/\bboth of us\b|\bme and my (?:mom|mum|mother|dad|father|wife|husband|friend|brother|sister|partner)\b/, () => 2],
    [/\bjust me\b|\bsolo\b|\bby myself\b|\bon my own\b/, () => 1],
  ];
  for (const [re, f] of patterns) {
    const m = t.match(re);
    if (m) {
      const p = f(m);
      if (p >= 1 && p <= MAX_PARTY) return p;
    }
  }
  return null;
}

const STOP = new Set(["the", "a", "an", "one", "package", "umrah", "trip", "for", "of", "and", "i", "we", "to", "on", "in", "it", "my", "our"]);
const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));

/** Whether two words differ by at most one inserted, missing or changed letter. */
function withinOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else {
      if (++edits > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else {
        i++;
        j++;
      }
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** The one package a message points at ("the ramadan one", "economy", "10 night premium"), or null when it names none
    or fits several equally. Scores by how many of the package's distinctive words the message uses. */
export function matchPackage<T extends QuotePackage>(text: string, packages: T[]): T | null {
  const said = [...new Set(tokens(text))];
  // A word counts if the customer wrote it, or a one-letter slip of it ("ramadhan" for "ramadan"). A bare number (a
  // year, "10") is shared by many packages, so it counts for little: it only breaks a tie, it never picks a package.
  const hit = (w: string) => said.some((s) => s === w || (w.length >= 5 && s.length >= 5 && withinOne(s, w)));
  const weight = (w: string) => (/^\d+$/.test(w) ? 0.25 : 1);
  const scored = packages
    .map((p) => ({ p, score: [...new Set(tokens(`${p.name} ${p.type}`))].filter(hit).reduce((n, w) => n + weight(w), 0) }))
    .filter((x) => x.score >= 1);
  if (scored.length === 0) return null;
  const best = Math.max(...scored.map((x) => x.score));
  const top = scored.filter((x) => x.score === best);
  return top.length === 1 ? top[0].p : null;
}

/** The worked-out quote as one sentence, e.g. "Ramadan Umrah 2027 for 2 travellers: £7,900 in total (£3,950 per
    person, twin sharing). Deposit £1,500 (£750 per person). Balance after the deposit £6,400." */
export function quoteSentence(p: QuotePackage, party: number): string {
  const q = quoteFor(p, party);
  const basis = p.priceBasis ? `, ${p.priceBasis}` : "";
  const parts = [`${p.name} for ${party} ${party === 1 ? "traveller" : "travellers"}: ${gbp(q.total)} in total (${gbp(p.pricePerPerson)} per person${basis}).`];
  if (q.deposit !== null && q.balance !== null && p.deposit !== null) {
    parts.push(`Deposit ${gbp(q.deposit)}${party > 1 ? ` (${gbp(p.deposit)} per person)` : ""}.`, `Balance after the deposit ${gbp(q.balance)}.`);
  }
  return parts.join(" ");
}

/** The quote for this customer, when the package and the party size can both be told from what they wrote and what
    we already know about them. A mixed party (children, infants) is priced from the package text, not by this sum. */
export function quoteRequest(input: { message: string; knownPackage?: string; knownTravellers?: number }, packages: QuotePackage[]): { pkg: QuotePackage; party: number; sentence: string } | null {
  if (/\b(child|children|infants?|kids?|baby|babies|toddlers?)\b/i.test(input.message)) return null;
  const party = detectParty(input.message) ?? input.knownTravellers ?? null;
  const pkg = matchPackage(input.message, packages) ?? (input.knownPackage ? matchPackage(input.knownPackage, packages) : null);
  if (!pkg || !party || !(pkg.pricePerPerson > 0)) return null;
  return { pkg, party, sentence: quoteSentence(pkg, party) };
}
