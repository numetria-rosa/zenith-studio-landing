import { answerList, type AuditAnswers } from "@/app/[locale]/audit/fields";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FindingDraft = {
  title: string;
  severity: Severity;
  description: string;
  currentImpact: string;
  recommendedSolution: string;
};

export type ServiceMatch = { slug: string; reasons: string[] };

export type AuditMatch = {
  services: ServiceMatch[];
  findings: FindingDraft[];
  /** Things they asked for that we can't deliver to them yet, stated plainly in the proposal. */
  notIncluded: string[];
};

const NICHE_BUNDLES: Record<string, string> = {
  "Law firm": "law-firms",
  "Insurance agency": "insurance-ai-team",
  "Real estate / brokerage": "brokerages",
};

// Phone/SMS provisioning (Vapi, SignalWire) is US/Canada only today.
const PHONE_COUNTRIES = new Set(["United States", "Canada"]);
// AI Inbox Manager connects via app password; Outlook/M365 and Workspace aren't supported.
const INBOX_PROVIDERS = new Set(["Gmail (personal account)", "Yahoo Mail", "Zoho Mail"]);

export function matchAudit(answers: AuditAnswers): AuditMatch {
  const one = (k: string) => (typeof answers[k] === "string" ? (answers[k] as string) : "");
  const many = (k: string) => new Set(answerList(answers[k]));

  const automate = many("whatToAutomate");
  const bottleneck = one("biggestBottleneck");
  const afterHours = one("afterHours");
  const responseTime = one("responseTime");
  const followUp = one("followUpProblems");
  const noShows = one("noShows");
  const admin = one("adminWorkload");
  const emailTool = one("emailTools");

  const callReasons: string[] = [];
  if (automate.has("Answering calls and booking appointments")) callReasons.push("You want calls answered and appointments booked for you");
  if (automate.has("Appointment reminders")) callReasons.push("You want appointment reminders sent automatically");
  if (bottleneck === "Missed calls and after-hours enquiries") callReasons.push("Missed and after-hours calls are your biggest bottleneck");
  if (bottleneck === "Booking and scheduling back-and-forth") callReasons.push("Booking back-and-forth is your biggest bottleneck");
  if (afterHours === "No, they go to voicemail") callReasons.push("After-hours calls currently go to voicemail");
  if (noShows === "Often") callReasons.push("No-shows happen often");

  const leadReasons: string[] = [];
  if (automate.has("Texting back missed calls")) leadReasons.push("You want every missed call texted back");
  if (automate.has("Replying to and following up with every lead")) leadReasons.push("You want every lead replied to and followed up");
  if (bottleneck === "Slow replies to new leads") leadReasons.push("Slow lead replies are your biggest bottleneck");
  if (bottleneck === "Leads going cold without follow-up") leadReasons.push("Leads going cold is your biggest bottleneck");
  if (responseTime === "Next day or later") leadReasons.push("New leads usually wait until the next day for a reply");
  if (followUp === "Often") leadReasons.push("Leads often go cold without a follow-up");

  const nicheReasons: string[] = [];
  if (automate.has("Chasing documents and paperwork")) nicheReasons.push("You want document and paperwork chasing handled");
  if (automate.has("Time tracking and billing")) nicheReasons.push("You want time tracking and billing handled");
  if (bottleneck === "Paperwork and admin") nicheReasons.push("Paperwork and admin is your biggest bottleneck");

  const inboxReasons: string[] = [];
  if (automate.has("Sorting and drafting replies to email")) inboxReasons.push("You want email sorted and replies drafted");
  if (bottleneck === "Too much email") inboxReasons.push("Email overload is your biggest bottleneck");

  const phoneOk = PHONE_COUNTRIES.has(one("country"));
  const services: ServiceMatch[] = [];
  const notIncluded: string[] = [];

  const bundle = NICHE_BUNDLES[one("industry")];
  const bundleReasons = [...callReasons, ...leadReasons, ...nicheReasons];
  const wantsPhone = callReasons.length > 0 || leadReasons.length > 0 || (bundle !== undefined && nicheReasons.length > 0);

  if (wantsPhone && !phoneOk) {
    notIncluded.push("Call answering, text-back and SMS follow-up: these currently run on US and Canadian phone numbers only.");
  } else if (bundle && bundleReasons.length > 0) {
    services.push({ slug: bundle, reasons: bundleReasons });
  } else {
    if (callReasons.length > 0) services.push({ slug: "ai-receptionist", reasons: callReasons });
    if (leadReasons.length > 0) services.push({ slug: "ai-lead-capture", reasons: leadReasons });
  }

  if (inboxReasons.length > 0) {
    if (INBOX_PROVIDERS.has(emailTool)) services.push({ slug: "ai-inbox-manager", reasons: inboxReasons });
    else notIncluded.push(`AI Inbox Manager: it connects to Gmail (personal accounts), Yahoo Mail and Zoho Mail, and ${emailTool || "your email provider"} isn't supported yet.`);
  }

  return { services, findings: buildFindings({ afterHours, responseTime, followUp, noShows, admin, bottleneck }), notIncluded };
}

function buildFindings(a: Record<string, string>): FindingDraft[] {
  const f: FindingDraft[] = [];
  if (a.afterHours === "No, they go to voicemail" || a.afterHours === "Sometimes") {
    f.push({
      title: "After-hours calls go unanswered",
      severity: a.afterHours === "Sometimes" ? "MEDIUM" : "HIGH",
      description: "Calls outside business hours don't reliably reach a person.",
      currentImpact: "Most callers who hit voicemail try the next business on Google instead of leaving a message.",
      recommendedSolution: "Answer or text back every call within seconds, 24/7, and capture the caller's details.",
    });
  }
  if (a.responseTime === "Next day or later" || a.responseTime === "Same day") {
    f.push({
      title: "Slow first reply to new leads",
      severity: a.responseTime === "Same day" ? "MEDIUM" : "HIGH",
      description: `New enquiries usually get a first reply ${a.responseTime.toLowerCase()}.`,
      currentImpact: "The business that replies first usually wins the job; hours of delay hand leads to competitors.",
      recommendedSolution: "Reply to every new enquiry automatically within a minute, then qualify it.",
    });
  }
  if (a.followUp === "Often" || a.followUp === "Sometimes") {
    f.push({
      title: "Leads going cold without follow-up",
      severity: a.followUp === "Often" ? "HIGH" : "MEDIUM",
      description: "Leads that don't book on first contact rarely hear from you again.",
      currentImpact: "Revenue already paid for in marketing is lost to silence.",
      recommendedSolution: "Automatic follow-up by email and SMS until each lead books or opts out.",
    });
  }
  if (a.noShows === "Often" || a.noShows === "Sometimes") {
    f.push({
      title: "No-shows and missed appointments",
      severity: a.noShows === "Often" ? "HIGH" : "MEDIUM",
      description: "Booked appointments are regularly missed.",
      currentImpact: "Every no-show is an empty slot that could have gone to another client.",
      recommendedSolution: "Automatic reminders before each appointment, with easy rescheduling.",
    });
  }
  if (a.admin === "Overwhelming, we need help now" || a.admin === "Heavy, but we cope") {
    f.push({
      title: "Admin workload crowding out revenue work",
      severity: a.admin === "Heavy, but we cope" ? "MEDIUM" : "HIGH",
      description: `You described the admin workload as "${a.admin.toLowerCase()}".`,
      currentImpact: "Skilled staff spend hours a week on repetitive tasks instead of clients.",
      recommendedSolution: "Hand the repetitive intake, follow-up and inbox work to an AI system that runs every day.",
    });
  }
  if (a.bottleneck === "Too much email") {
    f.push({
      title: "Inbox overload",
      severity: "MEDIUM",
      description: "Email volume is the biggest bottleneck in the business.",
      currentImpact: "Important messages get buried and replies are slow.",
      recommendedSolution: "Sort and prioritize every email automatically and draft replies to the routine ones.",
    });
  }
  return f;
}
