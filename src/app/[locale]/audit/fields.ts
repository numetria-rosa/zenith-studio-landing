// Field/step definitions for the free automation audit intake form. Every
// question except contact details is a fixed choice, so audit-matcher.ts can
// turn a submission straight into a priced proposal with no human review.
// Option strings are matched verbatim by audit-matcher.ts: renaming one here
// means updating it there too (audit-matcher.test.ts catches a mismatch).

export type FieldType = "text" | "email" | "tel" | "textarea" | "single" | "multi";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

export type StepDef = {
  id: string;
  title: string;
  description: string;
  fields: FieldDef[];
};

export type AuditAnswers = Record<string, string | string[]>;

export const STEPS: StepDef[] = [
  {
    id: "business",
    title: "Your business",
    description: "The basics, so we know who we're talking to.",
    fields: [
      { key: "companyName", label: "Company name", type: "text", required: true },
      { key: "website", label: "Website", type: "text", placeholder: "https://" },
      {
        key: "industry",
        label: "Industry",
        type: "single",
        required: true,
        options: [
          "Law firm",
          "Insurance agency",
          "Real estate / brokerage",
          "Dental / medical clinic",
          "Med spa / aesthetics",
          "Home services (trades)",
          "Accounting / bookkeeping",
          "Agency / consulting",
          "Other",
        ],
      },
      {
        key: "teamSize",
        label: "Team size",
        type: "single",
        required: true,
        options: ["Just me", "2-5", "6-15", "16-50", "50+"],
      },
      {
        key: "country",
        label: "Country",
        type: "single",
        required: true,
        options: ["United States", "Canada", "United Kingdom", "Other"],
      },
      { key: "location", label: "City", type: "text", required: true },
      { key: "contactName", label: "Your name", type: "text", required: true },
      { key: "contactEmail", label: "Your email", type: "email", required: true },
      { key: "contactPhone", label: "Your phone (optional)", type: "tel" },
    ],
  },
  {
    id: "operations",
    title: "Current operations",
    description: "How things run today, before any automation.",
    fields: [
      {
        key: "leadSources",
        label: "Where do your leads and enquiries come from?",
        type: "multi",
        required: true,
        options: [
          "Phone calls",
          "Website form",
          "Google / Google Maps",
          "Referrals",
          "Social media DMs",
          "Email",
          "Paid ads",
          "Walk-ins",
        ],
      },
      {
        key: "leadVolume",
        label: "Roughly how many leads or enquiries do you get per month?",
        type: "single",
        required: true,
        options: ["Under 20", "20-50", "50-150", "150-500", "500+"],
      },
      {
        key: "crm",
        label: "Where do you keep track of clients and leads?",
        type: "single",
        required: true,
        options: [
          "Nothing / a spreadsheet",
          "HubSpot",
          "Salesforce",
          "Industry software (Clio, EZLynx, Follow Up Boss, etc.)",
          "Another CRM",
        ],
      },
      {
        key: "emailTools",
        label: "Which email do you use for work?",
        type: "single",
        required: true,
        options: ["Gmail (personal account)", "Google Workspace", "Outlook / Microsoft 365", "Yahoo Mail", "Zoho Mail", "Other"],
      },
      {
        key: "bookingSystem",
        label: "How do people book with you today?",
        type: "single",
        required: true,
        options: [
          "By phone, booked by hand",
          "Online booking tool (Calendly, Cal.com, etc.)",
          "Email back-and-forth",
          "No appointments / walk-ins",
        ],
      },
      {
        key: "currentAutomation",
        label: "Any automation already in place?",
        type: "single",
        required: true,
        options: ["None", "Basic auto-replies", "Some Zapier / Make workflows", "A chatbot on our website"],
      },
      {
        key: "repetitiveTasks",
        label: "Which repetitive tasks eat the most time each week?",
        type: "multi",
        required: true,
        options: [
          "Answering the same questions on calls",
          "Replying to new enquiries",
          "Chasing leads who went quiet",
          "Booking and rescheduling appointments",
          "Sending reminders",
          "Sorting and replying to email",
          "Chasing documents and paperwork",
          "Typing data into our CRM",
          "Tracking time and billing",
        ],
      },
    ],
  },
  {
    id: "problems",
    title: "Problems",
    description: "Where it actually hurts today.",
    fields: [
      {
        key: "biggestBottleneck",
        label: "What's the single biggest bottleneck right now?",
        type: "single",
        required: true,
        options: [
          "Missed calls and after-hours enquiries",
          "Slow replies to new leads",
          "Leads going cold without follow-up",
          "Booking and scheduling back-and-forth",
          "Too much email",
          "Paperwork and admin",
        ],
      },
      {
        key: "responseTime",
        label: "How fast do you usually reply to a new lead?",
        type: "single",
        required: true,
        options: ["Under 5 minutes", "Within an hour", "Same day", "Next day or later", "Not sure"],
      },
      {
        key: "afterHours",
        label: "Do calls outside business hours get answered?",
        type: "single",
        required: true,
        options: ["Yes, always", "Sometimes", "No, they go to voicemail"],
      },
      {
        key: "followUpProblems",
        label: "How often do leads go cold without a follow-up?",
        type: "single",
        required: true,
        options: ["Rarely", "Sometimes", "Often", "Not sure"],
      },
      {
        key: "noShows",
        label: "Do no-shows or missed appointments cost you?",
        type: "single",
        required: true,
        options: ["Not an issue", "Sometimes", "Often", "We don't book appointments"],
      },
      {
        key: "adminWorkload",
        label: "How would you describe the admin workload right now?",
        type: "single",
        required: true,
        options: ["Manageable", "Heavy, but we cope", "Overwhelming, we need help now"],
      },
    ],
  },
  {
    id: "goals",
    title: "Goals",
    description: "What a win looks like for you.",
    fields: [
      {
        key: "whatToAutomate",
        label: "What would you most want handled for you?",
        type: "multi",
        required: true,
        options: [
          "Answering calls and booking appointments",
          "Texting back missed calls",
          "Replying to and following up with every lead",
          "Appointment reminders",
          "Sorting and drafting replies to email",
          "Chasing documents and paperwork",
          "Time tracking and billing",
        ],
      },
      {
        key: "desiredOutcomes",
        label: "What outcomes matter most?",
        type: "multi",
        required: true,
        options: [
          "Faster replies to leads",
          "Fewer missed calls",
          "More booked appointments",
          "Fewer no-shows",
          "Hours back every week",
          "Less time in email",
        ],
      },
      {
        key: "timeline",
        label: "When would you like this running?",
        type: "single",
        required: true,
        options: ["ASAP", "Within 30 days", "1-3 months", "3-6 months", "Just exploring"],
      },
      {
        key: "budgetRange",
        label: "Monthly budget",
        type: "single",
        required: true,
        options: ["Under $500/mo", "$500-1,500/mo", "$1,500-3,000/mo", "$3,000+/mo", "Not sure yet"],
      },
      {
        key: "anythingElse",
        label: "Anything else we should know? (optional)",
        type: "textarea",
      },
    ],
  },
];

export function answerList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}
