import { DRAFT_SYSTEM_PROMPT, DRAFT_SYSTEM_PROMPT_VERSION } from "../../../prompts/whatsapp-umrah/draft-system-v9";
import { TRAVEL_PROMPT_VERSION, TRAVEL_SYSTEM_PROMPT } from "../../../prompts/whatsapp-travel/draft-system-v1";
import { db } from "@/lib/db";
import { OFF_TOPIC_REPLIES, TRAVEL_OFF_TOPIC_REPLIES } from "./agent/fixed-replies";
import type { Language } from "./agent/types";

/* What kind of agency is on the other end. "umrah" is the original product (Umrah and Hajj, with the fiqh rule and
   Umrah wording); "travel" is a general travel agency (holidays, city breaks, flights plus hotel). Everything else
   in the pipeline is shared: the knowledge base, quotes, guards, hand-offs and the dashboard do not care. Stored on
   WaAgency.vertical, default "umrah" so every existing agency is unchanged. */

export const VERTICALS = ["umrah", "travel"] as const;
export type Vertical = (typeof VERTICALS)[number];

export const asVertical = (value: unknown): Vertical => (value === "travel" ? "travel" : "umrah");

export function systemPromptFor(vertical: Vertical): { text: string; version: string } {
  return vertical === "travel" ? { text: TRAVEL_SYSTEM_PROMPT, version: TRAVEL_PROMPT_VERSION } : { text: DRAFT_SYSTEM_PROMPT, version: DRAFT_SYSTEM_PROMPT_VERSION };
}

export const offTopicRepliesFor = (vertical: Vertical): Record<Language, string> => (vertical === "travel" ? TRAVEL_OFF_TOPIC_REPLIES : OFF_TOPIC_REPLIES);

export async function loadVertical(agencyId: string): Promise<Vertical> {
  const agency = await db.waAgency.findUnique({ where: { id: agencyId }, select: { vertical: true } });
  return asVertical(agency?.vertical);
}
