import { db } from "@/lib/db";
import { LANGUAGES, type Language } from "./types";

/* The agency's own settings (name, agent name, tone, emoji, sign-off, languages) as they reach a reply. The
   dashboard offered all of these; the agent used none of them. Tone and names go to the model as a short style
   note; the sign-off, the emoji switch and the language switch are enforced in code afterwards, because a
   model asked nicely to "never use emoji" still sometimes does. The style note only changes how the agent
   sounds: the system prompt's rules still come first. */

export type Persona = { agencyName: string; agentName: string; tone: "WARM" | "FORMAL"; emoji: boolean; signOff: string | null; languages: Language[] };

export const LANGUAGE_NAMES: Record<Language, string> = { en: "English", ar: "Arabic", tr: "Turkish", ur: "Urdu" };

// Owner-written text goes into a prompt, so it is flattened to one short line first.
const oneLine = (text: string, max: number) => text.replace(/\s+/g, " ").trim().slice(0, max);

export function buildPersona(
  agency: { name: string } | null,
  settings: { agentName: string; tone: "WARM" | "FORMAL"; emojiEnabled: boolean; signOff: string | null; languagesEnabled: string[] } | null,
): Persona {
  const languages = (settings?.languagesEnabled ?? []).filter((l): l is Language => (LANGUAGES as readonly string[]).includes(l));
  return {
    agencyName: oneLine(agency?.name ?? "", 80) || "the agency",
    agentName: oneLine(settings?.agentName ?? "", 40) || "Assistant",
    tone: settings?.tone ?? "WARM",
    emoji: settings?.emojiEnabled ?? true,
    signOff: oneLine(settings?.signOff ?? "", 120) || null,
    languages: settings ? (languages.length > 0 ? languages : ["en"]) : [...LANGUAGES],
  };
}

export async function loadPersona(agencyId: string): Promise<Persona> {
  const agency = await db.waAgency.findUnique({
    where: { id: agencyId },
    select: { name: true, agentSettings: { select: { agentName: true, tone: true, emojiEnabled: true, signOff: true, languagesEnabled: true } } },
  });
  return buildPersona(agency, agency?.agentSettings ?? null);
}

/** The style note added to the draft prompt. */
export function personaPrompt(p: Persona): string {
  return [
    "AGENCY STYLE (this changes only how you sound; every rule above still comes first):",
    `- The agency is called "${p.agencyName}". You are its virtual assistant, and your name is "${p.agentName}".`,
    `- Tone: ${p.tone === "FORMAL" ? "formal and polite, no slang" : "warm and friendly, conversational"}.`,
    `- ${p.emoji ? "You may use an occasional emoji where it fits." : "Do not use any emoji."}`,
  ].join("\n");
}

const EMOJI = /[\p{Extended_Pictographic}️‍]/gu;

/** The reply as it is sent: emoji removed if the agency switched them off, and the sign-off appended. */
export function applyPersona(reply: string, p: Persona): string {
  let text = p.emoji ? reply : reply.replace(EMOJI, "").replace(/[ \t]{2,}/g, " ").replace(/ +([.,!?])/g, "$1").trim();
  if (p.signOff && !text.endsWith(p.signOff)) text = `${text}\n\n${p.signOff}`;
  return text;
}

/** Whether the agency replies in the language the customer used. */
export function replyLanguageAllowed(language: Language, p: Persona): boolean {
  return p.languages.includes(language);
}
