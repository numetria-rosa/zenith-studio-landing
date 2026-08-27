"use server";

import { db } from "@/lib/db";
import { STEPS } from "./fields";

export type SubmitAuditResult = { ok: true } | { ok: false; error: string };

/* Writes one AuditRequest row per submission. Deliberately not tied to any
   signed-in user — this is a public, no-account-needed intake form, keyed
   by the email the visitor types in (see AuditRequest's own comment in
   prisma/schema.prisma: clientProfileId is intentionally omitted, no
   ClientProfile model exists yet).

   Server-side validation here is defense in depth, not the primary UX —
   AuditForm.tsx already blocks advancing past a step with an empty required
   field. This still re-checks required fields and a plausible email shape
   before writing, since a client could bypass the UI entirely. */
export async function submitAuditRequest(answers: Record<string, string>): Promise<SubmitAuditResult> {
  const requiredKeys = STEPS.flatMap((step) => step.fields.filter((f) => f.required).map((f) => f.key));
  for (const key of requiredKeys) {
    if (!answers[key] || !answers[key].trim()) {
      return { ok: false, error: "Please fill in all required fields." };
    }
  }

  const email = (answers.contactEmail || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  // Strip out any keys that aren't real fields (defensive against a tampered
  // client payload) and trim every value before storing.
  const knownKeys = new Set(STEPS.flatMap((step) => step.fields.map((f) => f.key)));
  const cleanAnswers: Record<string, string> = {};
  for (const [key, value] of Object.entries(answers)) {
    if (knownKeys.has(key) && typeof value === "string") {
      cleanAnswers[key] = value.trim();
    }
  }

  await db.auditRequest.create({
    data: {
      email,
      name: cleanAnswers.contactName || null,
      companyName: cleanAnswers.companyName || null,
      formAnswers: cleanAnswers,
    },
  });

  return { ok: true };
}
