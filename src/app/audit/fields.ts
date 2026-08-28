// Field/step definitions for the free automation audit intake form (Slice 3
// of the service-platform build, 2026-08-28). Content spec per the business
// brief's Phase 2: BUSINESS, CURRENT OPERATIONS, PROBLEMS, GOALS, plus one
// optional free-text field standing in for the (deferred) file-attachment
// section — no file-storage infrastructure exists yet, see
// SERVICE_PLATFORM_ARCHITECTURE.md §8.
//
// Kept data-driven (one array the form renders from) rather than hand-writing
// four separate JSX step components, so a future question tweak doesn't need
// new step markup — this is also why formAnswers is stored as one JSON blob
// rather than a column per field on AuditRequest.

export type FieldType = "text" | "email" | "tel" | "textarea" | "select";

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
        type: "select",
        required: true,
        options: [
          "Law firm",
          "Real estate / brokerage",
          "Home services (trades)",
          "Healthcare / clinic",
          "E-commerce",
          "Agency / consulting",
          "SaaS / software",
          "Other",
        ],
      },
      {
        key: "teamSize",
        label: "Team size",
        type: "select",
        required: true,
        options: ["Just me", "2-5", "6-15", "16-50", "50+"],
      },
      { key: "location", label: "Location (city, country)", type: "text", required: true },
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
        label: "Where do your leads/enquiries come from?",
        type: "textarea",
        required: true,
        placeholder: "e.g. website form, phone calls, referrals, Instagram DMs",
      },
      {
        key: "leadVolume",
        label: "Roughly how many leads/enquiries do you get per month?",
        type: "select",
        required: true,
        options: ["Under 20", "20-50", "50-150", "150-500", "500+"],
      },
      { key: "crm", label: "What CRM do you use, if any?", type: "text", required: true, placeholder: "e.g. HubSpot, Salesforce, spreadsheet, none" },
      { key: "emailTools", label: "What email / inbox tools do you use?", type: "text", required: true, placeholder: "e.g. Gmail, Outlook" },
      { key: "bookingSystem", label: "How do people book with you today?", type: "text", required: true, placeholder: "e.g. Calendly, phone, walk-in" },
      { key: "phoneSystem", label: "What phone system do you use, if any?", type: "text" },
      { key: "currentAutomation", label: "Any automation already in place?", type: "textarea" },
      {
        key: "repetitiveTasks",
        label: "What repetitive tasks eat the most time each week?",
        type: "textarea",
        required: true,
      },
      { key: "manualProcesses", label: "What manual processes would you most like off your plate?", type: "textarea", required: true },
    ],
  },
  {
    id: "problems",
    title: "Problems",
    description: "Where it actually hurts today.",
    fields: [
      { key: "biggestBottleneck", label: "What's the single biggest bottleneck in your business right now?", type: "textarea", required: true },
      { key: "timeLostWhere", label: "Where do you feel the most time is being lost?", type: "textarea", required: true },
      { key: "responseTimeProblems", label: "Any problems with response time to leads/customers?", type: "textarea" },
      { key: "followUpProblems", label: "Any problems with following up (leads going cold, no-shows)?", type: "textarea" },
      { key: "bookingProblems", label: "Any problems with booking/scheduling?", type: "textarea" },
      { key: "adminWorkload", label: "How would you describe the administrative workload right now?", type: "textarea", required: true },
    ],
  },
  {
    id: "goals",
    title: "Goals",
    description: "What a win looks like for you.",
    fields: [
      { key: "whatToAutomate", label: "What would you most want automated?", type: "textarea", required: true },
      { key: "desiredOutcomes", label: "What outcome are you hoping for?", type: "textarea", required: true, placeholder: "e.g. faster response times, fewer missed leads, hours back per week" },
      {
        key: "timeline",
        label: "Expected timeline",
        type: "select",
        required: true,
        options: ["ASAP", "Within 30 days", "1-3 months", "3-6 months", "Just exploring"],
      },
      {
        key: "budgetRange",
        label: "Budget range",
        type: "select",
        required: true,
        options: ["Under $500/mo", "$500-1,500/mo", "$1,500-3,000/mo", "$3,000+/mo", "Not sure yet"],
      },
      {
        key: "anythingElse",
        label: "Anything else — links to docs, workflows, or examples you can describe",
        type: "textarea",
      },
    ],
  },
];
