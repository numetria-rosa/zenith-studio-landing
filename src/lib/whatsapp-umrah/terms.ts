/* What the agency owner must accept before using the dashboard. Bump TERMS_VERSION whenever the DPA, terms or any
   statement below materially changes: every agency is then asked to accept again, and the audit log keeps the version
   each owner accepted. The wording is plain on purpose; it is not legal advice and has not been reviewed by a solicitor. */

export const TERMS_VERSION = "2026-11";

export const TERMS_ITEMS = [
  { id: "dpa", text: "I have read the Data Processing Agreement. My agency is the data controller of its customers' data and Zenith Studio is the processor." },
  { id: "ai", text: "I understand the agent is an AI assistant. It answers only from the packages and policies I enter, and I am responsible for keeping them accurate. It never makes or confirms a booking." },
  { id: "optin", text: "I will tell my customers they are messaging a virtual assistant (the wording is on the DPA page) and I will honour STOP requests and data requests." },
  { id: "meta", text: "I understand WhatsApp messages are billed by Meta to my own WhatsApp Business Account, on my own payment method, and that my use of WhatsApp follows Meta's Business and Commerce policies, including the ban on general-purpose AI chat." },
] as const;

export const needsTerms = (agency: { termsAcceptedAt: Date | null; termsVersion: string | null }) =>
  !agency.termsAcceptedAt || agency.termsVersion !== TERMS_VERSION;

/** Every box ticked (the form posts the ids of the ticked items). */
export const allAccepted = (ticked: string[]) => TERMS_ITEMS.every((i) => ticked.includes(i.id));
