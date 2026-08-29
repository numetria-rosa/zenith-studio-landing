import { getService, SERVICE_PAGE_BY_ID } from "@/lib/services";
import { PAID_AUDIT_BOOKING_URL } from "@/lib/paid-audit";

export type ServicePageFaq = { q: string; a: string };

export type ServicePageContent = {
  slug: string;
  serviceId: string;
  title: string;
  heroLine: string;
  eyebrow: string;
  whoFor: string;
  problem: string;
  howItWorks: string[];
  features: string[];
  afterSetup: string[];
  included: string[];
  workflow: { step: string; detail: string }[];
  faqs: ServicePageFaq[];
  setupDisplay: string;
  monthlyDisplay: string;
};

const SHARED_FAQS: ServicePageFaq[] = [
  {
    q: "Do I need to change my tools?",
    a: "No. We connect to the inbox, forms, calendar, or phone tools you already use.",
  },
  {
    q: "How long does setup take?",
    a: "Most systems are live in 2–7 days after we have access and a short kickoff.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. Monthly covers hosting, monitoring, and improvements and can be cancelled anytime. Work already delivered stays yours.",
  },
  {
    q: "Is this a chatbot we drop on the site?",
    a: "No. This is a done-for-you system we build, host, and maintain for your actual workflow.",
  },
];

export const SERVICE_PAGES: ServicePageContent[] = [
  {
    slug: "ai-inbox-manager",
    serviceId: "ai-inbox-manager",
    title: "AI Inbox Manager",
    heroLine: "Wake up to an inbox that is already handled.",
    eyebrow: "For teams buried in email",
    whoFor:
      "Accountants, bookkeepers, and other professional firms that spend a large part of the day sorting mail, chasing documents, and answering the same client questions.",
    problem:
      "Routine email (document requests, scheduling, ‘did you get this?’) crowds out the work you actually bill for. Nothing is broken. It is just repetitive.",
    howItWorks: [
      "We connect to the inbox you already use (Gmail or Outlook).",
      "Incoming mail is sorted and tagged by type.",
      "Routine replies are drafted for you to send or auto-send on rules you approve.",
      "Anything unusual is left for a human.",
    ],
    features: [
      "Email sorting and prioritization",
      "Drafts for routine replies",
      "Works with Gmail and Outlook",
      "Escalation rules you control",
    ],
    afterSetup: [
      "You review a short set of examples in week one.",
      "We tune categories and tone from real mail.",
      "Hosting, monitoring, and small improvements are included in the monthly fee.",
    ],
    included: [
      "Inbox connection and sorting rules",
      "Routine reply drafts",
      "Handoff notes for your team",
      "Hosting and monitoring",
    ],
    workflow: [
      { step: "Mail arrives", detail: "A client email hits your existing inbox." },
      { step: "Sorted", detail: "It is classified (document request, scheduling, billing, other)." },
      { step: "Drafted or queued", detail: "Routine items get a draft; exceptions stay for you." },
      { step: "You decide", detail: "Send, edit, or ignore. You stay in control." },
    ],
    faqs: SHARED_FAQS,
    setupDisplay: "$190",
    monthlyDisplay: "$150/month",
  },
  {
    slug: "ai-lead-capture-follow-up",
    serviceId: "ai-lead-capture",
    title: "AI Lead Capture & Follow-Up",
    heroLine: "Every enquiry gets a reply. Then a follow-up. Until they book.",
    eyebrow: "For businesses that live on enquiries",
    whoFor:
      "Dental clinics, consultants, and any appointment or quote-driven business where a slow reply loses the job.",
    problem:
      "Websites that invite consultations, quotes, or new-patient forms create a follow-up job. If that job is manual, evenings and weekends go unanswered.",
    howItWorks: [
      "We capture enquiries from the forms and channels you already advertise.",
      "Each lead is qualified against simple rules you set.",
      "Email and SMS follow-up continues until they book or opt out.",
      "You see what came in and what is still open.",
    ],
    features: [
      "Capture from web forms and listed channels",
      "Qualification rules you approve",
      "Email and SMS follow-up",
      "Stops on booking or opt-out",
    ],
    afterSetup: [
      "New enquiries get a first response without waiting for staff to be free.",
      "Open leads stay in a follow-up sequence instead of a spreadsheet.",
      "We monitor delivery and adjust copy from real replies.",
    ],
    included: [
      "Lead capture wiring",
      "Qualification + follow-up sequence",
      "Email/SMS sending setup",
      "Hosting and monitoring",
    ],
    workflow: [
      { step: "Enquiry", detail: "Someone submits a consult, quote, or new-patient form." },
      { step: "First reply", detail: "They get a prompt, on-brand response with a clear next step." },
      { step: "Follow-up", detail: "If they do not book, they get a short reminder sequence." },
      { step: "Booked or closed", detail: "The sequence stops when they schedule or ask to stop." },
    ],
    faqs: SHARED_FAQS,
    setupDisplay: "$270",
    monthlyDisplay: "$200/month",
  },
  {
    slug: "ai-receptionist-booking",
    serviceId: "ai-receptionist",
    title: "AI Receptionist & Booking",
    heroLine: "The phone still rings after hours. The calendar still fills.",
    eyebrow: "For appointment-heavy businesses",
    whoFor:
      "Aesthetic clinics, dental offices, and other practices that take a lot of phone and booking traffic during and after hours.",
    problem:
      "When the main booking channel is a phone number or a ‘book now’ button, missed evenings and lunch hours are missed appointments, not a marketing problem.",
    howItWorks: [
      "We cover the common questions you already answer on the site and by phone.",
      "Appointments book into the calendar you already use.",
      "Reminders go out so fewer people no-show.",
      "Anything the system should not handle is escalated.",
    ],
    features: [
      "After-hours and overflow answering",
      "Common-question handling",
      "Calendar booking",
      "Reminders",
    ],
    afterSetup: [
      "Callers and web bookers can schedule without waiting on hold.",
      "You keep a human path for clinical or sensitive questions.",
      "We watch missed bookings and tune the scripts from real traffic.",
    ],
    included: [
      "Answering + booking flow",
      "Calendar connection",
      "Reminder messages",
      "Hosting and monitoring",
    ],
    workflow: [
      { step: "Contact", detail: "A patient calls, texts, or uses the booking page." },
      { step: "Answer", detail: "Routine questions are handled; clinical ones go to staff." },
      { step: "Book", detail: "An open slot is offered and written to your calendar." },
      { step: "Remind", detail: "They get a reminder before the visit." },
    ],
    faqs: SHARED_FAQS,
    setupDisplay: "$360",
    monthlyDisplay: "$300/month",
  },
  {
    slug: "law-firm-ai-team",
    serviceId: "law-firms",
    title: "Law Firm AI Team",
    heroLine: "Intake, follow-up, and the clerk work, as one system.",
    eyebrow: "For law firms only",
    whoFor:
      "Personal injury and similar practices that run intake, qualification, follow-up, and billing as separate manual jobs.",
    problem:
      "Intake forms and ‘free case evaluation’ pages create a queue. Unworked leads and late time entries are operational, not hypothetical.",
    howItWorks: [
      "New enquiries are captured and qualified against your case criteria.",
      "Follow-up continues until they book a consult or are closed.",
      "Administrative and billing-clerk style tasks are automated where the evidence supports it.",
      "Attorneys keep the work that requires judgment.",
    ],
    features: [
      "AI client intake",
      "Lead qualification",
      "Follow-up",
      "Billing clerk functionality",
      "Administrative automation",
    ],
    afterSetup: [
      "Intake is no longer a shared inbox.",
      "Consults are booked from qualified enquiries.",
      "We tune qualification rules with your intake staff.",
    ],
    included: [
      "Intake + qualification + follow-up",
      "Admin automation scoped at kickoff",
      "Hosting and monitoring",
    ],
    workflow: [
      { step: "Enquiry", detail: "A potential client submits a case evaluation or calls." },
      { step: "Qualify", detail: "Rules you set decide if it is in-scope." },
      { step: "Follow-up", detail: "In-scope leads are worked until a consult is booked." },
      { step: "Admin", detail: "Repeat paperwork and billing reconstruction run in the background." },
    ],
    faqs: SHARED_FAQS,
    setupDisplay: "",
    monthlyDisplay: "$1,200/month",
  },
  {
    slug: "brokerage-ai-team",
    serviceId: "brokerages",
    title: "Brokerage AI Team",
    heroLine: "New leads get a viewing. The database does not go quiet.",
    eyebrow: "For real-estate brokerages and estate agencies only",
    whoFor:
      "Agencies with listing enquiries, valuation forms, viewing booking, and a database that goes quiet between campaigns.",
    problem:
      "Buyer and seller forms, plus viewing requests, are a follow-up and coordination job. Agents should not be the CRM.",
    howItWorks: [
      "New listing and valuation enquiries are captured and qualified.",
      "Viewings are booked into the calendar you already use.",
      "Transaction coordination checklists stay visible.",
      "Dormant database contacts can be re-opened with sequences you approve.",
    ],
    features: [
      "AI inside sales",
      "Lead qualification",
      "Appointment / viewing booking",
      "Transaction coordination",
      "Database management",
    ],
    afterSetup: [
      "Enquiries get a same-day path to a viewing or valuation.",
      "Agents see what is booked vs still open.",
      "We adjust scripts from real listing traffic.",
    ],
    included: [
      "Lead + viewing booking flows",
      "Coordination workspace",
      "Database follow-up sequences you approve",
      "Hosting and monitoring",
    ],
    workflow: [
      { step: "Enquiry", detail: "A buyer, seller, or tenant submits a form or calls." },
      { step: "Qualify", detail: "Budget, area, and intent are captured." },
      { step: "Book", detail: "A viewing or valuation is offered on the calendar." },
      { step: "Coordinate", detail: "Open tasks on the file stay in one place." },
    ],
    faqs: SHARED_FAQS,
    setupDisplay: "",
    monthlyDisplay: "$1,200/month",
  },
];

export function getServicePage(slug: string): ServicePageContent | undefined {
  return SERVICE_PAGES.find((p) => p.slug === slug);
}

export function allServicePageSlugs(): string[] {
  return SERVICE_PAGES.map((p) => p.slug);
}

export function catalogPricesForService(serviceId: string): { setupCents: number; monthlyCents: number } {
  const service = getService(serviceId);
  return {
    setupCents: dollarsToCents(service?.setupPriceDisplay ?? ""),
    monthlyCents: dollarsToCents(service?.monthlyPriceDisplay ?? ""),
  };
}

function dollarsToCents(display: string): number {
  const n = display.replace(/[^0-9]/g, "");
  if (!n) return 0;
  return Number(n) * 100;
}

export { PAID_AUDIT_BOOKING_URL };
