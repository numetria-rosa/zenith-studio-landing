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
  largeFirm: boolean;
  notAccounting: boolean;
  /** First name of the owner/partner if the site names one, for "Hi Sarah" instead of an unaddressed info@ email. */
  contactFirstName: string | null;
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
// Real TLDs only: any two-letter country code, or a common generic one. Drops scrambled anti-bot addresses
// like "vasb@psnctebhc.pbz" (ROT13 of a real one).
const GENERIC_TLDS = new Set(["com", "net", "org", "biz", "info", "co", "us", "uk", "pro", "cpa", "tax", "accountant", "accountants", "email", "online", "site", "law", "group", "services", "finance", "financial", "solutions", "consulting", "business", "io", "me"]);
const realTld = (email: string) => {
  const tld = email.split(".").pop() ?? "";
  return tld.length === 2 || GENERIC_TLDS.has(tld);
};
export const FREEMAIL = /@(gmail|googlemail|yahoo|aol|hotmail|outlook|live|msn|icloud|me|btinternet|sky|virginmedia|talktalk|comcast|att|verizon|sbcglobal|bellsouth|charter)\./i;

/** Big networks and multi-office firms: they have their own systems and won't buy this from a cold email. */
const LARGE_FIRM_NAMES =
  /haines watts|hwca\.com|azets|\buhy\b|scrutton bland|\bbdo\b|grant thornton|\brsm\b|kpmg|deloitte|\bpwc\b|ernst|crowe|mazars|forvis|menzies|moore kingston|bishop fleming|saffery|french duncan|johnston carmichael|duncan & toplis|xeinadin|\bdains\b|cooper parry|kreston|baker tilly|\bcbiz\b|cohnreznick|plante moran|cliftonlarsonallen|claconnect|eide bailly|wipfli|swanson ?reed|h ?& ?r block|jackson hewitt|liberty tax|taxassist|tax assist/i;
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
    if (!JUNK_EMAIL.test(e) && e.length <= 80 && realTld(e)) found.add(e);
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
  // A dedicated service page or heading, not a passing mention of "sole traders" in a footer.
  const personalTax =
    /href=["'][^"']*(self-?assessment|personal-tax|individual-tax|tax-returns?|1040|individual-returns?)[^"']*["']/i.test(html) ||
    /<h[1-4][^>]*>[^<]*(self[- ]assessment|personal tax|individual tax|tax returns? for individuals|personal (income )?tax returns?)/i.test(html);
  const corporateUk = /\b(ltd|limited|llp)\b|company (no|number|registration)|registered in (england|scotland|wales)|registration (no|number)/i.test(body + " " + opts.businessName);
  const firmWords = /&|\band\b|associates|group|partners|llp|ltd|limited|inc|services|accountants|accounting|tax|bookkeeping|consult/i;
  const personName = /^[A-Z][a-z]+( [A-Z]\.?)? [A-Z][a-zA-Z'-]+(,? (CPA|EA|CA|ACA|ACCA|FCCA))*$/.test(opts.businessName.trim());
  const solo = (personName && !firmWords.test(opts.businessName)) || /sole practitioner|\bI am a (chartered|certified|cpa|qualified)|\bI'm a (chartered|certified|cpa)|my clients/i.test(body);

  const largeFirm =
    LARGE_FIRM_NAMES.test(opts.businessName) ||
    LARGE_FIRM_NAMES.test(host) ||
    /\b(\d{2,}|ten|twelve|twenty)\s+(offices|locations|branches)\b|offices (across|throughout) the (uk|country|us)|nationwide network/i.test(body);
  const notAccounting =
    /\b(wealth|invest(ment|ing|ments)?|r ?& ?d|payroll|mortgages?|insurance|financial planning|cfo)\b/i.test(opts.businessName) &&
    !/account|tax|cpa|bookkeep|chartered/i.test(opts.businessName);

  let score = 50;
  if (vendor) (score -= 40), reasons.push(`uses ${vendor}`);
  else if (genericPortal) (score -= 15), reasons.push("mentions a client portal");
  else (score += 10), reasons.push("no client portal found");
  if (docChecklist) (score += 20), reasons.push("publishes a documents checklist or asks clients to send documents");
  if (personalTax) (score += 15), reasons.push("does personal tax / self-assessment");
  if (solo) (score += 5), reasons.push("solo practitioner");
  const emails = extractEmails(html, host);
  const contactFirstName = findContactFirstName(body, emails[0]);
  if (emails.length === 0) (score -= 100), reasons.push("no public email");
  if (largeFirm) (score -= 100), reasons.push("large or multi-office firm");
  if (notAccounting) (score -= 100), reasons.push("not an accounting practice");
  if (emails[0] && !FREEMAIL.test(emails[0]) && !sameSite(emails[0], host)) (score -= 10), reasons.push("email is on a different domain from the website");
  if (contactFirstName) (score += 5), reasons.push(`contact: ${contactFirstName}`);
  if (opts.country === "UK" && !corporateUk) (score -= 100), reasons.push("not a limited company or LLP (UK cold email needs consent)");

  return { emails, portalVendor: vendor, genericPortal, docChecklist, personalTax, corporateUk, solo, largeFirm, notAccounting, contactFirstName, score: Math.max(0, Math.min(100, score)), reasons };
}

/** Email and website belong to the same business: same domain, or the same name on another TLD (whitefieldtax.com vs .co.uk). */
export function sameSite(email: string, host: string): boolean {
  const d = (email.split("@")[1] ?? "").toLowerCase();
  const h = host.replace(/^www\./, "").toLowerCase();
  const name = (x: string) => x.replace(/\.(co|org|ac|gov|com)\.[a-z]{2}$|\.[a-z]{2,}$/i, "").split(".").pop() ?? x;
  return d === h || d.endsWith("." + h) || h.endsWith("." + d) || name(d) === name(h);
}

const ROLE = "(?:Managing Director|Managing Partner|Co-Founder|Founder|Director|Owner|Principal|Partner|Proprietor)";
const PERSON = "([A-Z][a-z]{1,15})(?: [A-Z]\\.)? ([A-Z][a-zA-Z'-]{1,20})";
// "Numerawise Solutions" and "Emerging Businesses" look like "First Last" but the second word gives them away.
const BUSINESS_WORD = /^(Solutions|Group|Tax|Taxes|Accounting|Accountants?|CPAs?|LLC|LLP|Ltd|Limited|Inc|Services|Associates|Bookkeeping|Consulting|Financial|Partners|Company|Advisors|Advisory|Businesses|Business|Clients|Firm|Office|Practice|Team|Payroll|Audit)$/;
const QUALS = "(?:,? (?:FCCA|ACCA|ACA|FCA|CTA|ATT|CPA|EA|MAAT|AAT))*";
const NAME_THEN_ROLE = new RegExp(`${PERSON}${QUALS}\\s*[,\\-|(]?\\s*${ROLE}\\b`);
const ROLE_THEN_NAME = new RegExp(`\\b${ROLE}\\s*[:\\-|,]?\\s*${PERSON}`);
// Capitalised words that sit next to a role in marketing copy but aren't names.
const NOT_FIRST_NAMES =
  /^(The|Our|Your|Meet|About|Contact|Tax|Taxes|Accounts|Accounting|Business|Company|Client|Clients|Senior|Junior|Associate|Office|Chartered|Certified|Practice|Team|Read|View|More|Home|Services|Managing|Finance|Finances|Financial|Founder|Founders|Firm|Owner|Owners|Partner|Partners|Director|Directors|Principal|President|Last|First|Next|Now|With|And|For|From|Trusted|Affordable|Expert|Experts|Professional|Quality|Personal|Small|Local|Free|Call|Get|Book|Schedule|Welcome|Hello|Dear|Best|New|Year|Our|Why|How|What|When|Who|Since|Founded|Family|Owned|Award|Winning|Leading|Experienced|Qualified|Registered|Licensed|Full|Learn|Join|Ask|Talk|Speak|Email|Phone|Message|Visit|See|Find|Payroll|Bookkeeping|Audit|Advisory|Consulting|Wealth|Group|Firm's|Company's|Elite|Platinum|Premier|Complete|Total|Simple|Smart|Better|Real|True|Proud|Dedicated|Helping|Serving|Solutions|Emerging|Growing|Startup|Startups|Individual|Individuals|Corporate|Nonprofit|Nonprofits|Industries|Industry)$/;
const ROLE_INBOX = /^(info|admin|office|hello|enquiries|enquiry|contact|mail|reception|tax|taxes|accounts|accounting|bookkeeping|support|help|team|clients?|service|sales|billing|payroll|cpa|staff|frontdesk|inquiries|general)$/i;

/** First name of whoever runs the practice. Prefers a name that matches the email itself ("sarah@" and "Sarah
    Jones" on the site); otherwise a name the site puts next to a role ("Sarah Jones, Director"). */
export function findContactFirstName(body: string, email?: string): string | null {
  const local = (email ?? "").split("@")[0]!.split(/[._-]/)[0] ?? "";
  if (/^[a-z]{3,12}$/i.test(local) && !ROLE_INBOX.test(local)) {
    const cap = local[0]!.toUpperCase() + local.slice(1).toLowerCase();
    for (const m of body.matchAll(new RegExp(`\\b${cap} ([A-Z][a-zA-Z'-]{1,20})`, "g")))
      if (!BUSINESS_WORD.test(m[1]!) && !NOT_FIRST_NAMES.test(cap) && FIRST_NAMES.has(local.toLowerCase())) return cap;
  }
  for (const re of [NAME_THEN_ROLE, ROLE_THEN_NAME]) {
    const m = body.match(re);
    if (m?.[1] && FIRST_NAMES.has(m[1].toLowerCase()) && !BUSINESS_WORD.test(m[2]!)) return m[1];
  }
  return null;
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

/* Common given names (UK, US, South Asian, Arabic, other common in UK/US accountancy), lowercase. Used to
   accept a scraped "contact name" only when it's a real first name: a missing name just means the email
   isn't personalised, a wrong one ("Hi Xero") wrecks it. ponytail: a fixed list, so rare names are missed. */
const FIRST_NAMES = new Set(
  `aaron abby abdul abigail adam adeel adil adrian ahmad ahmed aidan aiden aileen aisha alan alana albert alex alexander alexandra alexis ali alice alicia alison alistair allan allison alyssa amal amanda amber amelia amir amit amy ana andrea andrew andy angela angus anil anita ann anna anne annette anthony antonio april archie arjun arthur arun asad ashley ashok asif asim aslam audrey austin ayesha
  barbara barry beatrice becky belinda ben benjamin bernard beth bethany betty beverley beverly bilal bill billy blake bob bobby bonnie brad bradley brandon brenda brendan brett brian bridget brittany bruce bryan
  callum calum cameron carl carla carly carol caroline carolyn carrie casey catherine cathy charles charlie charlotte chelsea cheryl chloe chris christian christina christine christopher cindy claire clare clark claudia clive colin connie connor craig crystal cynthia
  dale dan dana daniel danielle danny darren dave david dawn dean debbie deborah debra declan deepak denise dennis derek diana diane dina dominic don donald donna doris dorothy doug douglas duncan dylan
  eamon ed eddie edward eileen elaine eleanor elizabeth ella ellen ellie emily emma eric erica erin ethan eugene eve evelyn
  faisal faiza farah farhan farid farooq fatima fiona frances francesca francis frank fraser fred freddie frederick
  gail gareth garry gary gavin gemma geof geoff geoffrey george georgia gerald geraldine gerry gillian gina glen glenn gloria gordon grace graeme graham grant greg gregory gurpreet
  hamid hamza hannah harjit harold harpreet harriet harry harvey hasan hassan hayley heather heidi helen henry holly howard hugh hussain
  iain ian imran irene isaac isabel isabella ishan jack jackie jacob jacqueline jade jake james jamie jan jane janet janice jason jasmine jaspreet jay jayne jean jeff jeffrey jenna jennifer jenny jeremy jessica jill jim jimmy jo joan joanna joanne jodie joe joel john johnny jon jonathan jordan joseph josh joshua joyce judith judy julia julian julie june justin
  kamal kamran karen karl kate katherine kathleen kathryn kathy katie kay keith kelly kellie ken kenneth kerry kevin khalid kieran kim kimberly kirsty kishan kris kristen kumar kyle
  lara laura lauren lawrence leah lee leon leslie liam lily linda lindsay lindsey lisa liz lorna lorraine louise lucy luke lydia lynn lynne
  madison mahmood malcolm mandy manaf manish manoj marc marcus margaret maria marian marie marilyn mark martin martyn mary matt matthew maureen max megan melanie melissa mia michael michele michelle mike mitchell mo mohammed mohammad mohamed mohsin molly monica muhammad murray
  nadeem nadia naeem naomi nasir natalie nathan naveed naz neil nick nicholas nichola nicola nicole nigel nikhil nina noah noel nora norman
  oliver olivia omar oscar owen paige pam pamela patricia patrick paul paula pauline peggy penny peter phil philip phillip phoebe pradeep priya rachel rahul raj rajesh rajiv ralph ramesh ravi raymond rebecca reece rehan richard rick rob robert robin robyn rod roger ronald rory rosa rose rosemary ross roy ruby rupert russell ruth ryan
  sadia saeed sajid salim sally sam samantha samir samuel sandeep sandra sanjay sara sarah sarfraz scott sean shabana shahid shahzad shane shanna shannon sharon shaun sheila shelley sherry shirley shona simon sophie stacey stanley stephanie stephen steve steven stewart stuart sue sukhdeep sunil susan suzanne sylvia
  tahir tanya tara tariq ted teddy teresa terry thomas tim timothy tina toby todd tom tommy tony tracey tracy trevor tyler umar usman valerie vanessa victor victoria vijay vikram vincent vivek waqas wayne wendy will william yasmin yusuf zach zachary zahid zara zoe`.split(/\s+/),
);
