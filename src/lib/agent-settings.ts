/* Client-adjustable agent behavior ("Request a change"), as fixed options
   rather than free text, so code applies every change the moment it's saved
   with no human or AI in the loop. Each option maps to pre-written wording
   or a concrete rule the agent's engine reads. Every "default" reproduces
   the wording/behavior the engines had before this existed, word for word.
   Stored as one JSON object on ServiceProject.agentSettings. Pure module:
   safe to import from client components. */

export type SettingKey =
  | "messageTone"
  | "followUpSchedule"
  | "leadNotifications"
  | "callbackPromise"
  | "receptionistTone"
  | "receptionistBooking"
  | "receptionistCallLength"
  | "inboxTone"
  | "inboxLength"
  | "inboxSignOff"
  | "renewalLeadDays"
  | "renewalRepeat"
  | "tcReminderDays"
  | "tcClientUpdates"
  | "dbDormantAfter";

type Option = { value: string; label: string; hint: string };
type SettingDef = { label: string; question: string; options: Option[] };

export const SETTINGS: Record<SettingKey, SettingDef> = {
  messageTone: {
    label: "Message tone",
    question: "How should your texts and emails sound?",
    options: [
      { value: "friendly", label: "Friendly", hint: "Relaxed and upbeat. This is the default." },
      { value: "professional", label: "Professional", hint: "Polished and formal." },
      { value: "warm", label: "Warm", hint: "Extra caring and reassuring." },
      { value: "brief", label: "Brief", hint: "As short as possible." },
    ],
  },
  followUpSchedule: {
    label: "Follow-up schedule",
    question: "How often should leads who go quiet get a check-in text?",
    options: [
      { value: "standard", label: "Standard", hint: "3 check-ins: 1 day, then 3 days, then 7 days apart. This is the default." },
      { value: "gentle", label: "Gentle", hint: "2 check-ins: 2 days, then 5 days apart." },
      { value: "persistent", label: "Persistent", hint: "4 check-ins inside a week." },
      { value: "off", label: "Off", hint: "No follow-up texts. Only the first instant reply." },
    ],
  },
  leadNotifications: {
    label: "Lead emails to you",
    question: "Which new leads should we email you about?",
    options: [
      { value: "all", label: "Every lead", hint: "A copy of every new lead. This is the default." },
      { value: "qualified", label: "Qualified only", hint: "Only leads that match your qualification rules." },
    ],
  },
  callbackPromise: {
    label: "Callback promise",
    question: "What should a missed caller be told about hearing back?",
    options: [
      { value: "tomorrow", label: "Call tomorrow", hint: "\"We'll book a call for tomorrow.\" This is the default." },
      { value: "today", label: "Call back today", hint: "\"We'll call you back today.\"" },
      { value: "none", label: "No time promised", hint: "\"We'll get right back to you.\"" },
    ],
  },
  receptionistTone: {
    label: "Receptionist voice",
    question: "How should your receptionist come across on calls?",
    options: [
      { value: "friendly", label: "Friendly", hint: "Relaxed and helpful. This is the default." },
      { value: "professional", label: "Professional", hint: "Polished, formal phone manner." },
      { value: "warm", label: "Warm", hint: "Extra caring and reassuring." },
    ],
  },
  receptionistBooking: {
    label: "Booking on calls",
    question: "Should the receptionist book appointments during the call?",
    options: [
      { value: "on", label: "Book on the call", hint: "Books straight into your calendar. This is the default." },
      { value: "off", label: "Take a message instead", hint: "Takes their details; your team schedules them." },
    ],
  },
  receptionistCallLength: {
    label: "Call length",
    question: "How long should calls run?",
    options: [
      { value: "normal", label: "Normal", hint: "Answers fully. This is the default." },
      { value: "brief", label: "Keep it brief", hint: "Short answers, wraps up quickly." },
    ],
  },
  inboxTone: {
    label: "Reply tone",
    question: "How should drafted email replies sound?",
    options: [
      { value: "professional", label: "Professional", hint: "Clear and businesslike. This is the default." },
      { value: "friendly", label: "Friendly", hint: "Relaxed and personable." },
      { value: "formal", label: "Formal", hint: "Traditional, formal business English." },
    ],
  },
  inboxLength: {
    label: "Reply length",
    question: "How long should drafted replies be?",
    options: [
      { value: "short", label: "Short", hint: "A few lines. This is the default." },
      { value: "detailed", label: "Detailed", hint: "Fuller replies that cover every point." },
    ],
  },
  inboxSignOff: {
    label: "Sign-off",
    question: "How should drafted replies end?",
    options: [
      { value: "none", label: "No sign-off", hint: "You add your own. This is the default." },
      { value: "best", label: "Best regards", hint: "Ends with \"Best regards,\" and your business name." },
      { value: "thanks", label: "Thanks", hint: "Ends with \"Thanks,\" and your business name." },
      { value: "kind", label: "Kind regards", hint: "Ends with \"Kind regards,\" and your business name." },
    ],
  },
  renewalLeadDays: {
    label: "Reminder timing",
    question: "How long before a policy renews should the reminder go out?",
    options: [
      { value: "45", label: "45 days before", hint: "Most time to shop and review." },
      { value: "30", label: "30 days before", hint: "This is the default." },
      { value: "14", label: "14 days before", hint: "Two weeks' notice." },
      { value: "7", label: "7 days before", hint: "One week's notice." },
    ],
  },
  tcReminderDays: {
    label: "Deadline reminders",
    question: "How far ahead should we remind you about each deadline?",
    options: [
      { value: "1", label: "1 day before", hint: "The day before it's due." },
      { value: "3", label: "3 days before", hint: "This is the default." },
      { value: "7", label: "7 days before", hint: "A full week's notice." },
    ],
  },
  tcClientUpdates: {
    label: "Document reminders to your client",
    question: "Should we email your buyer or seller about documents still missing?",
    options: [
      { value: "on", label: "Yes, chase for me", hint: "Up to 3 friendly reminders, 3 days apart. Replies come to you. This is the default." },
      { value: "off", label: "No, I'll chase myself", hint: "You still see what's missing on the checklist." },
    ],
  },
  dbDormantAfter: {
    label: "Who counts as dormant",
    question: "After how long without contact should someone get a check-in?",
    options: [
      { value: "90", label: "3 months", hint: "Reach out sooner." },
      { value: "180", label: "6 months", hint: "This is the default." },
      { value: "365", label: "12 months", hint: "Only truly quiet contacts." },
    ],
  },
  renewalRepeat: {
    label: "Reminder repeats",
    question: "Should clients get more than one reminder?",
    options: [
      { value: "weekly", label: "Weekly until renewal", hint: "Every 7 days until the renewal date. This is the default." },
      { value: "once", label: "Just once", hint: "One reminder per renewal." },
    ],
  },
};

export type AgentSettings = Record<SettingKey, string>;

export const DEFAULT_SETTINGS: AgentSettings = {
  messageTone: "friendly",
  followUpSchedule: "standard",
  leadNotifications: "all",
  callbackPromise: "tomorrow",
  receptionistTone: "friendly",
  receptionistBooking: "on",
  receptionistCallLength: "normal",
  inboxTone: "professional",
  inboxLength: "short",
  inboxSignOff: "none",
  renewalLeadDays: "30",
  renewalRepeat: "weekly",
  tcReminderDays: "3",
  tcClientUpdates: "on",
  dbDormantAfter: "180",
};

/** Normalizes stored JSON: unknown keys dropped, invalid values fall back to defaults. */
export function readSettings(raw: unknown): AgentSettings {
  const out: AgentSettings = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== "object") return out;
  for (const key of Object.keys(SETTINGS) as SettingKey[]) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === "string" && SETTINGS[key].options.some((o) => o.value === v)) out[key] = v;
  }
  return out;
}

/** Which settings each agent exposes. Agents with nothing adjustable return []. */
export function adjustableSettings(agentId: string): SettingKey[] {
  switch (agentId) {
    case "intake":
    case "isa":
    case "lead-capture":
      return ["messageTone", "followUpSchedule", "leadNotifications"];
    case "text-back":
      return ["messageTone", "callbackPromise", "followUpSchedule"];
    case "follow-up-clerk":
      return ["followUpSchedule", "messageTone"];
    case "receptionist":
      return ["receptionistTone", "receptionistBooking", "receptionistCallLength"];
    case "inbox":
      return ["inboxTone", "inboxLength", "inboxSignOff"];
    case "renewals":
      return ["messageTone", "renewalLeadDays", "renewalRepeat"];
    case "tc":
      return ["tcReminderDays", "tcClientUpdates", "messageTone"];
    case "db":
      return ["dbDormantAfter", "messageTone"];
    default:
      return [];
  }
}

export function optionLabel(key: SettingKey, value: string): string {
  return SETTINGS[key].options.find((o) => o.value === value)?.label ?? value;
}

type Tone = "friendly" | "professional" | "warm" | "brief";
const tone = (s: AgentSettings) => s.messageTone as Tone;

// ---------- Lead replies (Lead Capture, Inside Sales Agent, Intake Agent) ----------

export function instantReplySms(s: AgentSettings, b: string): string {
  return {
    friendly: `Thanks for reaching out to ${b}! We received your message and will be in touch shortly.`,
    professional: `Thank you for contacting ${b}. We have received your enquiry and a member of our team will respond shortly.`,
    warm: `Hi, thank you so much for reaching out to ${b}. We got your message and we'll be in touch very soon.`,
    brief: `${b}: got your message, we'll be in touch shortly.`,
  }[tone(s)];
}

export function instantReplyEmail(s: AgentSettings, b: string, name?: string): { subject: string; body: string } {
  const hi = `Hi${name ? ` ${name}` : ""},`;
  const line = {
    friendly: "We received your message and will be in touch shortly.",
    professional: "Thank you for your enquiry. A member of our team will respond shortly.",
    warm: "Thank you so much for reaching out. We got your message and we'll be in touch very soon.",
    brief: "Got your message, we'll be in touch shortly.",
  }[tone(s)];
  return { subject: `Thanks for reaching out to ${b}`, body: `${hi}\n\n${line}\n\n${b}` };
}

// ---------- Follow-up check-ins ----------

/** Gap in days since the previous text, one entry per check-in. */
export function followUpGaps(s: AgentSettings): number[] {
  return { standard: [1, 3, 7], gentle: [2, 5], persistent: [1, 1, 2, 3], off: [] }[s.followUpSchedule as "standard"] ?? [1, 3, 7];
}

export function followUpMessage(s: AgentSettings, b: string, stepIndex: number, totalSteps: number): string {
  const t = {
    friendly: {
      first: `Hi, this is ${b} again. Just checking in after your call, would you like us to schedule a consult?`,
      middle: `Following up from ${b}. We'd still love to help, reply here or call us back when you get a chance.`,
      nudge: `Hi again from ${b}. Still happy to help whenever you're ready, just reply to this text.`,
      last: `This is ${b}'s last check-in. If you still need help, reply and we'll get you booked. Otherwise we won't reach out again.`,
    },
    professional: {
      first: `This is ${b} following up on your enquiry. Would you like us to schedule a consultation?`,
      middle: `${b} following up. We would be glad to assist, please reply here or call us at your convenience.`,
      nudge: `${b} checking in once more. Please reply if you would like to arrange a time to speak.`,
      last: `This is a final follow-up from ${b}. If you still require assistance, reply and we will arrange a time. Otherwise we will not contact you again.`,
    },
    warm: {
      first: `Hi, it's ${b}! Just checking in, we'd really love to help. Would you like to set up a time to talk?`,
      middle: `Hi from ${b}, just thinking of you. We're here whenever you're ready, just reply or give us a call.`,
      nudge: `Hi again from ${b}. No pressure at all, we're still here if you need us.`,
      last: `This is our last check-in from ${b}. If you ever need us, just reply and we'll take care of you. Wishing you the best!`,
    },
    brief: {
      first: `${b}: want us to book a time to talk? Just reply.`,
      middle: `${b}: still happy to help. Reply anytime.`,
      nudge: `${b}: checking in. Reply if you need us.`,
      last: `${b}: last check-in. Reply if you still need help.`,
    },
  }[tone(s)];
  if (stepIndex === totalSteps - 1) return t.last;
  if (stepIndex === 0) return t.first;
  return stepIndex === 1 ? t.middle : t.nudge;
}

// ---------- Missed Call Text-Back ----------

export function missedCallSms(s: AgentSettings, b: string): string {
  const p = {
    tomorrow: "we'll book a call for tomorrow so there's no delay.",
    today: "we'll call you back today.",
    none: "we'll get right back to you.",
  }[s.callbackPromise as "tomorrow"];
  return {
    friendly: `Hi, this is ${b}. Sorry we missed your call. Reply and let us know what you need, ${p}`,
    professional: `This is ${b}. We're sorry we missed your call. Please reply with how we can help, and ${p}`,
    warm: `Hi, it's ${b}. So sorry we missed you! Just reply and tell us what you need, ${p}`,
    brief: `${b}: sorry we missed your call. Reply with what you need, ${p}`,
  }[tone(s)];
}

export function missedCallSpoken(s: AgentSettings, b: string): string {
  const p = {
    tomorrow: ", and get a call scheduled for tomorrow.",
    today: ", and call you back today.",
    none: ".",
  }[s.callbackPromise as "tomorrow"];
  return {
    friendly: `Thank you for calling ${b}. We're unable to take your call right now, but we'll text you shortly to find out how we can help${p}`,
    professional: `Thank you for calling ${b}. No one is available to take your call, but we will text you shortly to find out how we can help${p}`,
    warm: `Thanks so much for calling ${b}. We can't pick up right now, but we'll text you in a moment to see how we can help${p}`,
    brief: `You've reached ${b}. We'll text you shortly to see how we can help${p}`,
  }[tone(s)];
}

// ---------- AI Receptionist ----------

export function receptionistFirstMessage(s: AgentSettings, b: string): string {
  return {
    friendly: `Thanks for calling ${b}, how can I help?`,
    professional: `Thank you for calling ${b}. How may I help you today?`,
    warm: `Hi there, thanks so much for calling ${b}! How can I help you today?`,
  }[s.receptionistTone as "friendly"];
}

/** Extra instructions appended to the receptionist's fixed prompt. Empty at defaults. */
export function receptionistPromptLines(s: AgentSettings): string[] {
  const lines: string[] = [];
  if (s.receptionistTone === "professional") lines.push("Speak in a polished, professional manner at all times.");
  if (s.receptionistTone === "warm") lines.push("Be especially warm, patient, and reassuring with every caller.");
  if (s.receptionistCallLength === "brief") lines.push("Keep every answer short and wrap the call up efficiently once the caller's question is handled.");
  return lines;
}

export function receptionistBooks(s: AgentSettings): boolean {
  return s.receptionistBooking !== "off";
}

// ---------- AI Inbox Manager ----------

export function inboxReplyStyle(s: AgentSettings): string {
  const length = s.inboxLength === "detailed" ? "thorough" : "short";
  const toneWord = { professional: "professional", friendly: "friendly", formal: "formal" }[s.inboxTone as "professional"];
  return `${length}, ${toneWord}`;
}

/** Appended by code after drafting, never left to the model. */
export function inboxSignOff(s: AgentSettings, businessName: string): string {
  const word = { none: "", best: "Best regards,", thanks: "Thanks,", kind: "Kind regards," }[s.inboxSignOff as "none"];
  return word ? `\n\n${word}\n${businessName}` : "";
}

// ---------- Renewal Reminders ----------

export function renewalWindowDays(s: AgentSettings): number {
  return Number(s.renewalLeadDays) || 30;
}

export function renewalRepeats(s: AgentSettings): boolean {
  return s.renewalRepeat !== "once";
}

export function renewalEmail(s: AgentSettings, p: { clientName: string; agencyName: string; policyType: string; date: string }): string {
  const { clientName: c, agencyName: a, policyType: t, date: d } = p;
  return {
    friendly: `Hi ${c},

This is a reminder from ${a}: your ${t} is due for renewal on ${d}. Reply to this email or give us a call to review your coverage before it renews.

${a}`,
    professional: `Dear ${c},

This is a courtesy reminder from ${a} that your ${t} renews on ${d}. Please reply to this email or call our office to review your coverage before the renewal date.

Kind regards,
${a}`,
    warm: `Hi ${c},

Just a friendly heads-up from all of us at ${a}: your ${t} renews on ${d}. We'd love to make sure you're still getting the best coverage, so reply or give us a call whenever suits you.

Warmly,
${a}`,
    brief: `Hi ${c}, your ${t} with ${a} renews on ${d}. Reply or call us to review it.

${a}`,
  }[tone(s)];
}

// ---------- Brokerage: Transaction Coordinator ----------

export function tcReminderDays(s: AgentSettings): number {
  return Number(s.tcReminderDays) || 3;
}

export function tcDocumentChaseEmail(
  s: AgentSettings,
  p: { clientName: string; business: string; address: string; documents: string[] }
): { subject: string; body: string } {
  const first = p.clientName.split(" ")[0];
  const list = p.documents.map((d) => `- ${d}`).join("\n");
  const open = {
    friendly: `Hi ${first},\n\nQuick reminder on ${p.address}: we're still waiting on a few things to keep your closing on track:`,
    professional: `Dear ${p.clientName},\n\nRegarding ${p.address}, the following items are still outstanding and are needed to keep your closing on schedule:`,
    warm: `Hi ${first},\n\nHope you're doing well! To keep everything on track for ${p.address}, we just need a few more things from you:`,
    brief: `Hi ${first}, still needed for ${p.address}:`,
  }[tone(s)];
  const close = {
    friendly: "Just reply to this email with them, or let us know if you have any questions.",
    professional: "Please reply to this email with the documents, or contact us with any questions.",
    warm: "Whenever you get a moment, just reply with them. We're here if you have any questions at all.",
    brief: "Reply with them when you can.",
  }[tone(s)];
  return { subject: `Documents still needed for ${p.address}`, body: `${open}\n\n${list}\n\n${close}\n\n${p.business}` };
}

// ---------- Brokerage: Database Manager ----------

export function dbDormantDays(s: AgentSettings): number {
  return Number(s.dbDormantAfter) || 180;
}

/** Days to wait before each email of the re-engagement sequence. */
export const DB_SEQUENCE_GAPS = [0, 7, 14];

export function dbEmail(s: AgentSettings, p: { name: string; business: string; step: number; unsubscribeUrl: string }): { subject: string; body: string } {
  const first = p.name.split(" ")[0];
  const b = p.business;
  const t = {
    friendly: [
      [`Checking in from ${b}`, `Hi ${first},\n\nIt's been a while, so I wanted to check in. How are things going? If you're thinking about buying, selling, or just curious what your home is worth in today's market, I'm happy to help, no pressure at all.\n\nJust reply to this email.`],
      [`Quick question from ${b}`, `Hi ${first},\n\nQuick one: would a free, no-strings update on what homes like yours are selling for right now be useful? Reply "yes" and I'll put it together for you.`],
      [`Still here if you need us`, `Hi ${first},\n\nI'll leave it here so I don't crowd your inbox. If you ever need anything real-estate related, just reply to this email and I'll be glad to help.`],
    ],
    professional: [
      [`Checking in from ${b}`, `Dear ${p.name},\n\nIt has been some time since we last spoke, and I wanted to reach out. If you are considering buying or selling, or would like a current valuation of your property, I would be glad to assist.\n\nPlease reply to this email at your convenience.`],
      [`A complimentary market update`, `Dear ${p.name},\n\nWould a complimentary report on recent sales of homes similar to yours be useful? Reply to this email and I will prepare one for you.`],
      [`Our final note`, `Dear ${p.name},\n\nThis will be my last message so as not to fill your inbox. Should you need any real estate assistance in the future, simply reply to this email.`],
    ],
    warm: [
      [`Thinking of you, from ${b}`, `Hi ${first},\n\nYou came to mind and I wanted to say hello! I hope life's been treating you well. If you're ever thinking about a move, or just want to know what your home's worth these days, I'd love to help.\n\nJust hit reply anytime.`],
      [`A little something for you`, `Hi ${first},\n\nWould you like a free update on what homes like yours are selling for right now? It's no trouble at all, just reply "yes" and I'll send it over.`],
      [`Always here for you`, `Hi ${first},\n\nI won't keep filling your inbox, but please know I'm always here if you need anything real-estate related. Just reply whenever you're ready.`],
    ],
    brief: [
      [`Checking in`, `Hi ${first}, it's been a while. Thinking of buying or selling, or curious what your home is worth? Reply and I'll help.`],
      [`Free home value update?`, `Hi ${first}, want a free update on what homes like yours sell for? Reply "yes".`],
      [`Last note`, `Hi ${first}, last email from me. Reply anytime you need help.`],
    ],
  }[tone(s)][Math.min(p.step, 2)];
  return { subject: t[0], body: `${t[1]}\n\n${b}\n\nDon't want these emails? Unsubscribe: ${p.unsubscribeUrl}` };
}
