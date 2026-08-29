import { getService, servicePagePath } from "@/lib/services";
import { catalogPricesForService } from "@/lib/service-pages";

export const NOT_PUBLICLY_FOUND = "Not publicly found";

export type VerifiedResearch = {
  name: string;
  city: string;
  country: string;
  niche: string;
  area?: string;
  website?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  observedSignals: string[];
};

export type ProspectResearch = {
  verified: VerifiedResearch;
  inferences: string[];
};

export type RecommendedOffer = "FREE_WRITTEN_AUDIT" | "PAID_AUDIT_CALL";

export type OutreachPathId = "PROPOSAL" | "FREE_AUDIT" | "PAID_AUDIT_CALL";

export type EligibilityInput = {
  businessName: string;
  city: string;
  country: string;
  niche: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  contactName: string | null;
  prospectScore: number;
  recommendedServiceId: string;
  recommendedOffer: RecommendedOffer;
  personalizationSignal: string;
  opportunity: string;
  buyingSignal: string | null;
  research: ProspectResearch;
  alreadyContacted: boolean;
  previouslyNegative: boolean;
  unsubscribed: boolean;
  suppressed: boolean;
  hasOpenProposal: boolean;
};

export type HardFilterResult = {
  ok: boolean;
  failures: string[];
};

export type EligibilityResult = {
  outreachScore: number;
  priority: "A" | "B" | "C" | "SKIP";
  path: OutreachPathId;
  autoPrepare: boolean;
  hard: HardFilterResult;
};

const BANNED_PHRASES = [
  "revolutionary ai",
  "10x your",
  "guaranteed results",
  "replace your employees",
  "you're losing thousands",
  "you are losing thousands",
  "losing thousands",
];

const GENERIC_OPENERS = [
  "we help businesses automate",
  "i noticed your company is growing",
  "hope this email finds you",
  "leverage ai to scale",
];

export function isPublicEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  if (!v || v === NOT_PUBLICLY_FOUND.toLowerCase()) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return false;
  if (v.endsWith("@example.com") || v.includes("mailservice.com")) return false;
  return true;
}

export function isPublicWebsite(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  return /^https?:\/\//i.test(v);
}

export function outreachPriority(score: number): "A" | "B" | "C" | "SKIP" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "SKIP";
}

export function defaultServiceForNiche(niche: string): string {
  const n = niche.toLowerCase();
  if (n.includes("law") || n.includes("personal injury") || n.includes("attorney")) return "law-firms";
  if (n.includes("estat") || n.includes("broker") || n.includes("real estate") || n.includes("realtor")) {
    return "brokerages";
  }
  if (n.includes("account") || n.includes("bookkeep")) return "ai-inbox-manager";
  if (n.includes("aesthetic") || n.includes("med spa") || n.includes("dermatolog")) return "ai-receptionist";
  if (n.includes("dental") || n.includes("dentist") || n.includes("orthodont")) return "ai-lead-capture";
  return "ai-lead-capture";
}

export function serviceAllowedForNiche(serviceId: string, niche: string): boolean {
  if (serviceId === "law-firms") {
    const n = niche.toLowerCase();
    return n.includes("law") || n.includes("attorney") || n.includes("legal") || n.includes("personal injury");
  }
  if (serviceId === "brokerages") {
    const n = niche.toLowerCase();
    return n.includes("estat") || n.includes("broker") || n.includes("real estate") || n.includes("realtor");
  }
  return Boolean(getService(serviceId));
}

export function runHardFilters(input: EligibilityInput): HardFilterResult {
  const failures: string[] = [];
  if (!input.businessName.trim()) failures.push("missing business name");
  if (!input.niche.trim()) failures.push("missing niche");
  if (!input.city.trim()) failures.push("missing city");
  if (!isPublicEmail(input.email)) failures.push("no public business email");
  if (!input.buyingSignal?.trim() && input.research.verified.observedSignals.length === 0) {
    failures.push("no buying signal");
  }
  if (!input.personalizationSignal.trim() && input.research.verified.observedSignals.length === 0) {
    failures.push("no personalization evidence");
  }
  if (!serviceAllowedForNiche(input.recommendedServiceId, input.niche)) {
    failures.push("service does not match niche");
  }
  if (!servicePagePath(input.recommendedServiceId)) failures.push("no service page");
  if (!getService(input.recommendedServiceId)) failures.push("unknown service");
  if (input.alreadyContacted) failures.push("duplicate outreach");
  if (input.previouslyNegative) failures.push("previous negative response");
  if (input.unsubscribed) failures.push("unsubscribed");
  if (input.suppressed) failures.push("suppressed");
  if (input.prospectScore < 70) failures.push("prospect score below 70");
  return { ok: failures.length === 0, failures };
}

export function chooseOutreachPath(input: EligibilityInput): OutreachPathId {
  if (input.recommendedOffer === "PAID_AUDIT_CALL") return "PAID_AUDIT_CALL";
  const signals = input.research.verified.observedSignals.length;
  if (input.prospectScore >= 85 && signals >= 1 && isPublicWebsite(input.website)) return "PROPOSAL";
  return "FREE_AUDIT";
}

export function evaluateEligibility(input: EligibilityInput): EligibilityResult {
  const hard = runHardFilters(input);
  const priority = outreachPriority(input.prospectScore);
  const path = chooseOutreachPath(input);
  const outreachScore = input.prospectScore;
  const autoPrepare = hard.ok && outreachScore >= 80 && (priority === "A" || priority === "B");
  return { outreachScore, priority, path, autoPrepare, hard };
}

export type GeneratedEmail = {
  subject: string;
  bodyText: string;
  greeting: string;
  observation: string;
  factsUsed: string[];
};

function pickSubject(name: string, signal: string): string {
  const variants = [
    `Quick idea for ${name}`,
    `${name}: one follow-up idea`,
    `Question about your ${shortSignal(signal)}`,
  ];
  let hash = 0;
  for (const ch of name) hash = (hash + ch.charCodeAt(0)) % variants.length;
  return variants[hash]!;
}

function shortSignal(signal: string): string {
  const s = signal.toLowerCase();
  if (s.includes("book") || s.includes("appointment") || s.includes("schedule")) return "online booking";
  if (s.includes("consult")) return "consultation form";
  if (s.includes("callback") || s.includes("call")) return "callback requests";
  if (s.includes("invisalign") || s.includes("aligner")) return "Invisalign consults";
  if (s.includes("implant")) return "implant consults";
  if (s.includes("emergency")) return "emergency enquiries";
  if (s.includes("valuation")) return "valuation form";
  if (s.includes("case evaluation")) return "case evaluations";
  return "enquiry form";
}

function primarySignal(input: EligibilityInput): string {
  return (
    input.research.verified.observedSignals[0] ||
    input.personalizationSignal.trim() ||
    input.buyingSignal?.trim() ||
    ""
  );
}

export function generateOutreachEmail(input: EligibilityInput, path: OutreachPathId): GeneratedEmail {
  const name = input.businessName.trim();
  const greeting = input.contactName?.trim()
    ? `Hi ${input.contactName.trim()},`
    : `Hi ${name} team,`;
  const signal = primarySignal(input);
  const service = getService(input.recommendedServiceId);
  const serviceTitle = service?.title ?? "automation system";
  const observation = signal
    ? `I was looking at your public site and noticed ${signal.replace(/\.$/, "")}.`
    : `I was looking at how ${name} takes new enquiries in ${input.city}.`;

  const opportunity =
    path === "PAID_AUDIT_CALL"
      ? `That kind of workflow is usually easier to map on a short call than from the website alone.`
      : `That usually creates repetitive first replies and follow-up until someone books.`;

  const solution = `We build a done-for-you ${serviceTitle} for businesses in this situation. Setup and monthly pricing are listed on the service page, with no long contract.`;

  const cta =
    path === "PAID_AUDIT_CALL"
      ? `If it would help, I can do a 20-minute paid audit call ($35) and map the actual intake path with you.`
      : path === "PROPOSAL"
        ? `I put a short proposal together for ${name} based only on what is visible publicly. If it is off, ignore it.`
        : `If it would help, I can send a free written audit of the public enquiry path: findings and a quote, no call required.`;

  const bodyText = `${greeting}

${observation} ${opportunity}

${solution}

${cta}

You can reply to this email either way.

Thanks,
Zenith Studio`;

  return {
    subject: pickSubject(name, signal),
    bodyText: bodyText.trim(),
    greeting,
    observation,
    factsUsed: [name, input.city, signal].filter(Boolean),
  };
}

export function generateFollowUp(
  step: 1 | 2 | 3,
  input: EligibilityInput,
  originalObservation: string
): { subject: string; bodyText: string } {
  const name = input.businessName.trim();
  const greeting = input.contactName?.trim() ? `Hi ${input.contactName.trim()},` : `Hi ${name} team,`;
  if (step === 1) {
    return {
      subject: `Following up: ${name}`,
      bodyText: `${greeting}

Just bumping this in case it landed at a busy time. The note was about ${originalObservation.replace(/^I was looking at (your public site and noticed )?/, "").replace(/\.$/, "")}.

Happy to send the short audit, or stop here if it is not useful.

Thanks,
Zenith Studio`,
    };
  }
  if (step === 2) {
    const extra = input.research.verified.observedSignals[1] || input.research.verified.observedSignals[0] || "the public enquiry path";
    return {
      subject: `One more thought for ${name}`,
      bodyText: `${greeting}

One extra observation from the public site: ${extra}. If you ever want that first response handled without adding staff hours, the same system covers it.

No need to reply if the timing is wrong.

Thanks,
Zenith Studio`,
    };
  }
  return {
    subject: `Last note for ${name}`,
    bodyText: `${greeting}

I'll close the loop here so I'm not adding noise. If you want the written audit or the short proposal later, just reply.

Thanks,
Zenith Studio`,
  };
}

export type FactCheckResult = {
  passed: boolean;
  notes: string[];
  unverifiedClaims: string[];
};

export function factCheckEmail(bodyText: string, input: EligibilityInput): FactCheckResult {
  const notes: string[] = [];
  const unverifiedClaims: string[] = [];
  const allowed = new Set(
    [
      input.businessName,
      input.city,
      input.country,
      input.niche,
      input.website ?? "",
      ...input.research.verified.observedSignals,
      input.personalizationSignal,
      input.buyingSignal ?? "",
      getService(input.recommendedServiceId)?.title ?? "",
      "done-for-you",
      "written audit",
      "20-minute",
      "$35",
      "proposal",
      "service page",
    ]
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

  const lower = bodyText.toLowerCase();
  for (const banned of BANNED_PHRASES) {
    if (lower.includes(banned)) {
      unverifiedClaims.push(`banned phrase: ${banned}`);
    }
  }

  const growthClaims = ["is growing", "losing leads", "staff are slow", "receptionist is overwhelmed"];
  for (const claim of growthClaims) {
    if (lower.includes(claim) && !input.research.verified.observedSignals.some((s) => s.toLowerCase().includes(claim))) {
      unverifiedClaims.push(`unverified claim: ${claim}`);
    }
  }

  if (input.contactName && !bodyText.includes(input.contactName)) {
    notes.push("contact name available but not used");
  }

  const observationOk = input.research.verified.observedSignals.some((s) => lower.includes(s.toLowerCase().slice(0, 24)));
  if (input.research.verified.observedSignals.length > 0 && !observationOk && !lower.includes(input.personalizationSignal.toLowerCase().slice(0, 24))) {
    unverifiedClaims.push("observation does not match research signals");
  }

  void allowed;
  return { passed: unverifiedClaims.length === 0, notes, unverifiedClaims };
}

export type QualityBreakdown = {
  personalization: number;
  relevance: number;
  specificity: number;
  clarity: number;
  cta: number;
  naturalness: number;
  total: number;
};

export function scoreEmailQuality(email: GeneratedEmail, input: EligibilityInput, fact: FactCheckResult): QualityBreakdown {
  const body = email.bodyText.toLowerCase();
  let personalization = 0;
  if (body.includes(input.businessName.toLowerCase())) personalization += 15;
  if (email.subject.toLowerCase().includes(input.businessName.toLowerCase())) personalization += 5;
  if (input.research.verified.observedSignals.some((s) => body.includes(s.toLowerCase().slice(0, 18)))) {
    personalization += 5;
  }
  personalization = Math.min(25, personalization);

  let relevance = 0;
  if (serviceAllowedForNiche(input.recommendedServiceId, input.niche)) relevance += 15;
  if (body.includes((getService(input.recommendedServiceId)?.title ?? "").toLowerCase())) relevance += 10;
  relevance = Math.min(25, relevance);

  let specificity = 0;
  if (primarySignal(input)) specificity += 15;
  if (email.observation.length > 40) specificity += 5;
  specificity = Math.min(20, specificity);

  const words = email.bodyText.split(/\s+/).length;
  let clarity = 0;
  if (words <= 180) clarity += 10;
  if (words >= 40) clarity += 5;
  clarity = Math.min(15, clarity);

  let cta = 0;
  if (body.includes("audit") || body.includes("proposal") || body.includes("reply")) cta += 10;

  let naturalness = 5;
  if (GENERIC_OPENERS.some((g) => body.includes(g))) naturalness = 0;
  if (!fact.passed) {
    personalization = Math.min(personalization, 10);
    specificity = Math.min(specificity, 8);
  }

  const total = personalization + relevance + specificity + clarity + cta + naturalness;
  return { personalization, relevance, specificity, clarity, cta, naturalness, total };
}

export type ProposalCopy = {
  executiveSummary: string;
  currentChallenges: string;
  recommendedSolution: string;
  scopeOfWork: string;
  deliverables: string;
  implementationPlan: string;
  timeline: string;
  assumptions: string;
  notIncluded: string;
  nextSteps: string;
  terms: string;
};

export function generateProposalCopy(input: EligibilityInput): ProposalCopy {
  const name = input.businessName.trim();
  const service = getService(input.recommendedServiceId);
  const title = service?.title ?? "automation system";
  const signal = primarySignal(input);
  const prices = catalogPricesForService(input.recommendedServiceId);
  const setup = prices.setupCents ? `$${(prices.setupCents / 100).toLocaleString()}` : "included in monthly";
  const monthly = `$${(prices.monthlyCents / 100).toLocaleString()}/month`;

  return {
    executiveSummary: `This note is based only on ${name}'s public web presence in ${input.city}. ${signal ? `We observed: ${signal}.` : ""} That is a concrete enquiry/booking path, not a claim about your internal staffing.`,
    currentChallenges: signal
      ? `Observed: ${signal}.\n\nInference (not a verified internal problem): this kind of public path typically creates first-response and follow-up work after hours.`
      : `Observed: ${name} operates in ${input.city} in ${input.niche}.\n\nWe do not claim an internal bottleneck we have not seen.`,
    recommendedSolution: `${title}. ${service?.description ?? ""}\n\nThis is the catalog service that matches the observed enquiry/booking path. It can be swapped if a call shows a better fit.`,
    scopeOfWork: `In scope:\n• Connect the public enquiry/booking path already advertised\n• First response + follow-up rules you approve\n• Handoff notes for your team\n• Hosting and monitoring under the monthly plan`,
    deliverables: `• Live ${title} connected to the channels we agree at kickoff\n• Short handoff of how to review and override\n• Project workspace for requests after go-live`,
    implementationPlan: `1. Kickoff and collect access\n2. Build against the observed public path\n3. QA on real enquiry examples you provide\n4. Go-live\n5. Monthly monitoring`,
    timeline: `Typically 2–7 days from kickoff, depending on access.`,
    assumptions: `• Public observations in this proposal are the starting point, not a full operations audit\n• You can provide access to the tools that receive enquiries\n• Scope matches the line items; extra work is quoted separately`,
    notIncluded: `• Replacing staff\n• Clinical or legal advice\n• Third-party SaaS fees\n• Work outside the listed service`,
    nextSteps: `Approve this proposal and complete payment to start. Or reply if you would rather begin with a free written audit or a $35 mapping call.`,
    terms: `Setup (${setup}) is due on approval. Monthly (${monthly}) covers hosting, monitoring, and improvements and can be cancelled anytime. Catalog prices are not discounted in this outbound proposal.`,
  };
}

export function runOutreachSelfTest(): { name: string; ok: boolean; detail?: string }[] {
  const results: { name: string; ok: boolean; detail?: string }[] = [];
  const research: ProspectResearch = {
    verified: {
      name: "Contemporary Dentistry Dallas",
      city: "Dallas",
      country: "USA",
      niche: "Dental clinics",
      website: "https://cddallas.com/",
      email: "info@cddallas.com",
      observedSignals: ["online booking", "same-day emergency visits"],
    },
    inferences: ["staff might be busy"],
  };
  const input: EligibilityInput = {
    businessName: "Contemporary Dentistry Dallas",
    city: "Dallas",
    country: "USA",
    niche: "Dental clinics",
    website: "https://cddallas.com/",
    email: "info@cddallas.com",
    phone: "(214) 366-4646",
    contactName: null,
    prospectScore: 91,
    recommendedServiceId: "ai-lead-capture",
    recommendedOffer: "FREE_WRITTEN_AUDIT",
    personalizationSignal: "online booking and same-day emergency visits",
    opportunity: "Potential follow-up because the site advertises online booking.",
    buyingSignal: "online booking",
    research,
    alreadyContacted: false,
    previouslyNegative: false,
    unsubscribed: false,
    suppressed: false,
    hasOpenProposal: false,
  };

  const eligible = evaluateEligibility(input);
  results.push({
    name: "priority A emailable prospect is auto-prepared",
    ok: eligible.autoPrepare && eligible.priority === "A" && eligible.hard.ok,
    detail: JSON.stringify(eligible),
  });

  const noEmail = evaluateEligibility({ ...input, email: null, prospectScore: 91 });
  results.push({
    name: "missing email is blocked",
    ok: !noEmail.hard.ok && noEmail.hard.failures.includes("no public business email"),
  });

  const lawOnDental = evaluateEligibility({ ...input, recommendedServiceId: "law-firms" });
  results.push({
    name: "law firm team is not offered to a dental clinic",
    ok: !lawOnDental.hard.ok,
  });

  const weak = evaluateEligibility({ ...input, prospectScore: 55 });
  results.push({ name: "score below 70 is skipped", ok: weak.priority === "SKIP" });

  const email = generateOutreachEmail(input, "PROPOSAL");
  const fact = factCheckEmail(email.bodyText, input);
  const quality = scoreEmailQuality(email, input, fact);
  results.push({ name: "email fact-check passes on verified signals", ok: fact.passed, detail: fact.unverifiedClaims.join("; ") });
  results.push({ name: "email quality is at least 85", ok: quality.total >= 85, detail: String(quality.total) });
  results.push({
    name: "email names the business and the observed booking signal",
    ok: email.bodyText.includes("Contemporary Dentistry Dallas") && email.bodyText.toLowerCase().includes("online booking"),
  });

  const spam = factCheckEmail("You're losing thousands because your receptionist is overwhelmed.", input);
  results.push({ name: "spam claims fail fact-check", ok: !spam.passed });

  results.push({
    name: "default dental service is lead capture",
    ok: defaultServiceForNiche("Dental clinics") === "ai-lead-capture",
  });
  results.push({
    name: "default PI service is law team",
    ok: defaultServiceForNiche("Personal injury law") === "law-firms",
  });

  return results;
}

export function htmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function textToSimpleHtml(text: string): string {
  const escaped = htmlEscape(text);
  const paragraphs = escaped.split(/\n\n+/).map((p) => `<p style="margin:0 0 16px;line-height:1.55;color:#111">${p.replace(/\n/g, "<br/>")}</p>`);
  return paragraphs.join("");
}
