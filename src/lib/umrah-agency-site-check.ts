// The .ts extension is what `node --experimental-strip-types` needs when the lead scripts import this file.
// @ts-expect-error TS5097: allowImportingTsExtensions is off for the app build
import { extractEmails } from "./accountant-site-check.ts";

/* Reads a UK travel agency's website for the WhatsApp AI Agent outreach list: does it sell Umrah or Hajj, does it use
   WhatsApp for customers, and does it already run an AI assistant or chatbot (in which case it is a poor prospect).
   Looks only at public page HTML. It cannot see whether a WhatsApp number auto-replies; that needs a human to check. */

export type AgencySiteCheck = {
  sellsUmrah: boolean;
  whatsapp: "link" | "mention" | "none";
  whatsappNumber: string;
  aiSignals: string[];
  liveChat: string[];
  atol: boolean;
  atolNumber: string;
  title: string;
  emails: string[];
  reasons: string[];
  score: number;
};

const AI_VENDORS: [string, RegExp][] = [
  ["Botpress", /botpress/i],
  ["Landbot", /landbot/i],
  ["ManyChat", /manychat/i],
  ["Chatfuel", /chatfuel/i],
  ["Voiceflow", /voiceflow/i],
  ["Chatbase", /chatbase/i],
  ["Wati", /wati\.io/i],
  ["Respond.io", /respond\.io/i],
  ["Gupshup", /gupshup/i],
  ["Interakt", /interakt/i],
  ["Dialogflow", /dialogflow/i],
  ["Kommunicate", /kommunicate/i],
  ["Intercom", /widget\.intercom\.io|intercomcdn/i],
  ["Drift", /js\.driftt\.com|drift\.com\/(?:include|embed)/i],
  ["Tidio", /code\.tidio\.co|tidiochat/i],
  ["chatbot wording", /\b(chat-?bot|ai (?:assistant|agent|chat)|virtual assistant|ask our ai|powered by (?:ai|gpt|openai))\b/i],
];

const LIVE_CHAT: [string, RegExp][] = [
  ["tawk.to", /tawk\.to/i],
  ["LiveChat", /livechatinc/i],
  ["Crisp", /crisp\.chat/i],
  ["Smartsupp", /smartsupp/i],
  ["Olark", /olark/i],
  ["Zendesk", /zopim|zdassets|zendesk/i],
  ["HubSpot chat", /js\.usemessages\.com|hs-scripts/i],
  ["Zoho SalesIQ", /salesiq/i],
  ["Freshchat", /freshchat/i],
];

const text = (html: string) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");

export function analyzeAgencySite(pages: { url: string; html: string }[]): AgencySiteCheck {
  const html = pages.map((p) => p.html).join("\n");
  const body = text(html);
  const host = pages[0] ? new URL(pages[0].url).hostname : "";
  const reasons: string[] = [];

  const sellsUmrah = /\b(umrah|umra|hajj|haj)\b/i.test(body);
  const waLink = html.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\/?\?(?:[^"'\s>]*&)?phone=|web\.whatsapp\.com\/send\/?\?(?:[^"'\s>]*&)?phone=)\+?(\d{8,15})/i);
  const whatsapp = waLink ? "link" : /whatsapp/i.test(html) ? "mention" : "none";
  const aiSignals = AI_VENDORS.filter(([, re]) => re.test(html)).map(([n]) => n);
  const liveChat = LIVE_CHAT.filter(([, re]) => re.test(html)).map(([n]) => n);
  const atol = /\batol\b/i.test(body);
  const atolNumber = body.match(/\bATOL\s*(?:no\.?|number|licen[cs]e(?: number)?|protected)?\s*[:#-]?\s*(\d{3,5})\b/i)?.[1] ?? "";
  const title = (pages[0]?.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim().slice(0, 90);
  const emails = extractEmails(html, host);

  let score = 0;
  if (sellsUmrah) (score += 30), reasons.push("sells Umrah/Hajj");
  else reasons.push("no Umrah/Hajj mention");
  if (whatsapp === "link") (score += 30), reasons.push(`WhatsApp link${waLink ? " (+" + waLink[1] + ")" : ""}`);
  else if (whatsapp === "mention") (score += 15), reasons.push("mentions WhatsApp");
  else reasons.push("no WhatsApp found");
  if (aiSignals.length === 0) (score += 25), reasons.push("no AI/chatbot found");
  else reasons.push(`already has: ${aiSignals.join(", ")}`);
  if (liveChat.length > 0) reasons.push(`live chat widget: ${liveChat.join(", ")}`);
  if (atol) (score += 5), reasons.push("mentions ATOL");
  if (emails.length > 0) score += 10;
  return { sellsUmrah, whatsapp, whatsappNumber: waLink?.[1] ?? "", aiSignals, liveChat, atol, atolNumber, title, emails, reasons, score: Math.min(100, score) };
}
