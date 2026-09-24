// Content for the AI agent files animation. Edit copy here, not in the component.
export type AgentKey = "billing" | "missed" | "follow";

export type FileAgent = {
  key: AgentKey;
  num: string;
  name: string;
  /** Label printed on the folder */
  short: string;
  desc: string;
  stat?: { value: string; caption: string };
  note?: { text: string; size: number };
};

export const FILE_AGENTS: FileAgent[] = [
  {
    key: "billing",
    num: "01",
    name: "AI Billing Clerk",
    short: "Billing Clerk",
    desc: "Reconstructs billable time from your calendar, email, and documents, drafts entries with real narratives, and gets invoices out inside the 14 day window where write-downs run 6% instead of 18%.",
    stat: { value: "6%", caption: "write-downs inside the 14 day window, instead of 18%" },
    note: { text: "Priced on what it recovers.", size: 15 },
  },
  {
    key: "missed",
    num: "02",
    name: "AI Missed Call Text-Back",
    short: "Missed Call Text-Back",
    desc: "The moment a call goes unanswered, the caller gets a text back in seconds, qualifies against your case criteria, and books the consult, so a missed call never turns into a call to the firm down the street.",
    stat: { value: "34%", caption: "of callers who reach voicemail never call your firm again." },
  },
  {
    key: "follow",
    num: "03",
    name: "AI Follow-Up Clerk",
    short: "Follow-Up Clerk",
    desc: "Works the leads that did not retain on the first call.",
    note: { text: "You already paid for every one of them, and most firms never touch them again.", size: 18 },
  },
];
