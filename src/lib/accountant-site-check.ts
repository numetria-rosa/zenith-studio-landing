/* Website check for accountant prospects (AI Document Chaser outreach): reads a firm's own pages and
   says whether they look like they chase clients for documents by hand. Pure, no network, so the lead
   pull script and tests share it. Kept free of TS-only runtime syntax so `node --experimental-strip-types`
   can import it directly from scripts/.

   Signals, from what the firm itself publishes:
   - a client portal vendor link (TaxDome, Karbon, ...) means they already have a tool: scored down,
     not dropped, since many firms have a portal their clients ignore.
   - a "documents we need" / checklist / "email us your documents" page means manual chasing: scored up.
   - personal tax / self-assessment work means many individual clients to chase: scored up.
   - UK only: Ltd / LLP / company number, because cold email to sole traders and ordinary partnerships
     needs prior consent under PECR. */

export type SiteCheck = {
  emails: string[];
  portalVendor: string | null;
  genericPortal: boolean;
  docChecklist: boolean;
  personalTax: boolean;
  corporateUk: boolean;
  solo: boolean;
  score: number;
  reasons: string[];
};

const PORTAL_VENDORS: [string, RegExp][] = [
  ["TaxDome", /taxdome/i],
  ["Karbon", /karbonhq|karbon\.app/i],
  ["Canopy", /canopytax|canopy\.tax|app\.canopytax/i],
  ["SmartVault", /smartvault/i],
  ["Content Snare", /contentsnare/i],
  ["FileInvite", /fileinvite/i],
  ["ShareFile", /sharefile/i],
  ["Liscio", /liscio/i],
  ["Financial Cents", /financial-cents|financialcents/i],
  ["Suralink", /suralink/i],
  ["CCH Axcess Portal", /cchaxcess|portal\.cchaxcess|netclientcs|cch ifirm|ifirm\.com/i],
  ["Verifyle", /verifyle/i],
  ["Senta", /senta\.co/i],
  ["IRIS OpenSpace", /openspace|iris\.co\.uk\/portal/i],
  ["Pixie", /pixie\.co\.uk|usepixie/i],
  ["AccountancyManager", /accountancymanager/i],
  ["TaxCalc portal", /taxcalc.*portal|portal.*taxcalc/i],
  ["Clinked", /clinked/i],
  ["Firm360", /firm360/i],
  ["Ignition", /ignitionapp/i],
];

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const JUNK_EMAIL = /(example\.|sentry|wixpress|domain\.com|email\.com|yourdomain|\.(png|jpe?g|gif|webp|svg)$|^u00|godaddy|squarespace|wordpress)/i;

function text(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

/** Emails a firm publishes, same-domain ones first. Decodes mailto: and the common "[at]" obfuscation. */
export function extractEmails(html: string, siteHost: string): string[] {
  const raw = html.replace(/\s*(\[at\]|\(at\))\s*/gi, "@").replace(/\s*(\[dot\]|\(dot\))\s*/gi, ".");
  const found = new Set<string>();
  for (const m of raw.matchAll(EMAIL)) {
    const e = m[0].toLowerCase().replace(/^mailto:/, "").replace(/\.$/, "");
    if (!JUNK_EMAIL.test(e) && e.length <= 80) found.add(e);
  }
  const host = siteHost.replace(/^www\./, "").toLowerCase();
  return [...found].sort((a, b) => Number(b.endsWith("@" + host) || b.endsWith("." + host)) - Number(a.endsWith("@" + host) || a.endsWith("." + host)));
}

export function analyzeAccountantSite(pages: { url: string; html: string }[], opts: { country: "UK" | "US"; businessName: string }): SiteCheck {
  const html = pages.map((p) => p.html).join("\n");
  const body = text(html);
  const host = pages[0] ? new URL(pages[0].url).hostname : "";
  const reasons: string[] = [];

  const vendor = PORTAL_VENDORS.find(([, re]) => re.test(html))?.[0] ?? null;
  const genericPortal = !vendor && /client (portal|login|log in)|secure (portal|upload|file)|portal login/i.test(body);
  const docChecklist =
    /(documents|information|paperwork) (we|you'?ll) need|what (to|you need to) (bring|send|provide)|(tax|year[- ]end|document) (organi[sz]er|checklist)|checklist|e-?mail (us )?(your|the) (documents|paperwork|records)|send (us )?(your|the) (documents|paperwork|records)/i.test(
      body,
    );
  const personalTax = /self[- ]assessment|personal tax|individual (tax|returns?)|tax returns? for individuals|\b1040\b|sole traders?|landlords?/i.test(body);
  const corporateUk = /\b(ltd|limited|llp)\b|company (no|number|registration)|registered in (england|scotland|wales)|registration (no|number)/i.test(body + " " + opts.businessName);
  const firmWords = /&|\band\b|associates|group|partners|llp|ltd|limited|inc|services|accountants|accounting|tax|bookkeeping|consult/i;
  const personName = /^[A-Z][a-z]+( [A-Z]\.?)? [A-Z][a-zA-Z'-]+(,? (CPA|EA|CA|ACA|ACCA|FCCA))*$/.test(opts.businessName.trim());
  const solo = (personName && !firmWords.test(opts.businessName)) || /sole practitioner|\bI am a (chartered|certified|cpa|qualified)|\bI'm a (chartered|certified|cpa)|my clients/i.test(body);

  let score = 50;
  if (vendor) (score -= 40), reasons.push(`uses ${vendor}`);
  else if (genericPortal) (score -= 15), reasons.push("mentions a client portal");
  else (score += 10), reasons.push("no client portal found");
  if (docChecklist) (score += 20), reasons.push("publishes a documents checklist or asks clients to send documents");
  if (personalTax) (score += 15), reasons.push("does personal tax / self-assessment");
  if (solo) (score += 5), reasons.push("solo practitioner");
  const emails = extractEmails(html, host);
  if (emails.length === 0) (score -= 100), reasons.push("no public email");
  if (opts.country === "UK" && !corporateUk) (score -= 100), reasons.push("not a limited company or LLP (UK cold email needs consent)");

  return { emails, portalVendor: vendor, genericPortal, docChecklist, personalTax, corporateUk, solo, score: Math.max(0, Math.min(100, score)), reasons };
}

/** Same-site links worth a second look for emails and checklists. */
export function followUpLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const out = new Set<string>();
  for (const m of html.matchAll(/href=["']([^"'#]+)["']/gi)) {
    let u: URL;
    try {
      u = new URL(m[1]!, base);
    } catch {
      continue;
    }
    if (u.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) continue;
    if (/contact|about|team|checklist|documents|what-we-need|new-client|tax-return|self-assessment|personal-tax/i.test(u.pathname)) out.add(u.origin + u.pathname);
  }
  return [...out].slice(0, 3);
}
