import type { LawFirmSpecialty } from "@prisma/client";

/* Per-specialty behavior for the Billing Clerk (law-firms vertical). One
   registry, read by billing-clerk.ts, instead of scattered if/else branches
   per client. Adding a new specialty means adding one entry here, nothing
   else changes.

   Why this exists: a personal injury firm works on contingency and does
   not bill by the hour at all, unlike family/criminal/corporate practices.
   Forcing every specialty through the same hourly-narrative prompt would
   mean drafting garbage for contingency firms, this registry is what lets
   one engine serve both without hardcoding per client. */

export type BillingModel = "HOURLY" | "CONTINGENCY";

export type LegalSpecialtyProfile = {
  label: string;
  billingModel: BillingModel;
  narrativeSystemPrompt: string;
};

const HOURLY_PROMPT = `You are a legal billing assistant. Given details of a calendar meeting or an email, write ONE professional billing narrative sentence in the style law firms use on invoices (e.g. "Telephone conference with opposing counsel regarding discovery schedule."). Identify a likely matter or client name from the available context; use "General" if none is evident. For emails only, also estimate minutes spent (a quick email is 6-12 minutes, a substantive one 15-30). Respond ONLY with JSON: {"matterName": string, "narrative": string, "estimatedMinutes": number}.`;

const CONTINGENCY_PROMPT = `You are a case-activity assistant for a personal injury firm that works on contingency, not hourly billing. Given details of a calendar meeting or an email, write ONE short case-activity log entry describing what was done (e.g. "Reviewed medical records from client's treating physician regarding ongoing lumbar injury."). Identify a likely matter or client name from the available context; use "General" if none is evident. If this activity involved a specific reimbursable case expense (e.g. ordering medical records, an expert consultation fee), estimate that expense in whole US dollars, otherwise 0. Respond ONLY with JSON: {"matterName": string, "narrative": string, "expenseAmountUsd": number}.`;

export const LEGAL_SPECIALTY_PROFILES: Record<LawFirmSpecialty, LegalSpecialtyProfile> = {
  PERSONAL_INJURY: { label: "Personal Injury", billingModel: "CONTINGENCY", narrativeSystemPrompt: CONTINGENCY_PROMPT },
  FAMILY_LAW: { label: "Family Law", billingModel: "HOURLY", narrativeSystemPrompt: HOURLY_PROMPT },
  CRIMINAL_DEFENSE: { label: "Criminal Defense", billingModel: "HOURLY", narrativeSystemPrompt: HOURLY_PROMPT },
  CORPORATE: { label: "Corporate", billingModel: "HOURLY", narrativeSystemPrompt: HOURLY_PROMPT },
  GENERAL: { label: "General practice", billingModel: "HOURLY", narrativeSystemPrompt: HOURLY_PROMPT },
};

export const LAW_FIRM_SPECIALTIES: LawFirmSpecialty[] = [
  "PERSONAL_INJURY",
  "FAMILY_LAW",
  "CRIMINAL_DEFENSE",
  "CORPORATE",
  "GENERAL",
];

/** Projects with no specialty set yet (the common case until an admin
    assigns one) fall back to GENERAL's hourly behavior, today's original
    default, so nothing breaks for an unset project. */
export function specialtyProfile(specialty: LawFirmSpecialty | null): LegalSpecialtyProfile {
  return LEGAL_SPECIALTY_PROFILES[specialty ?? "GENERAL"];
}
