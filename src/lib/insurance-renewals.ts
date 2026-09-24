import { Resend } from "resend";
import { db } from "@/lib/db";

/* Active Renewal Agent: tracks renewal dates from a manually-uploaded CSV
   (no AMS access needed) and emails a reminder once a policy is inside the
   reminder window. Reuses Resend, same as the rest of the app - no new
   paid service. SMS (SignalWire) is deliberately left out for now since
   the account needs funding for production traffic; email-only is enough
   to test the agent end to end. */

const FROM_ADDRESS = "Zenith Studio <hello@zenith-studio.site>";
const REMINDER_WINDOW_DAYS = 30;
const RESEND_COOLDOWN_DAYS = 7;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export type ImportPolicyInput = {
  agencyName: string;
  clientName: string;
  phone?: string | null;
  email?: string | null;
  policyType?: string | null;
  renewalDate: Date;
};

export async function importPolicies(rows: ImportPolicyInput[], projectId?: string | null) {
  let created = 0;
  for (const row of rows) {
    await db.insurancePolicy.create({
      data: {
        projectId: projectId || null,
        agencyName: row.agencyName,
        clientName: row.clientName,
        phone: row.phone || null,
        email: row.email || null,
        policyType: row.policyType || null,
        renewalDate: row.renewalDate,
      },
    });
    created += 1;
  }
  return { created };
}

export async function listPolicies() {
  return db.insurancePolicy.findMany({ orderBy: { renewalDate: "asc" } });
}

export async function listPoliciesForProject(projectId: string) {
  return db.insurancePolicy.findMany({ where: { projectId }, orderBy: { renewalDate: "asc" } });
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/** Finds policies renewing within the window that haven't been reminded
    recently, and emails the client directly. `force: true` (used by the
    manual test button) ignores the window/cooldown so you can see it fire
    without waiting for a real renewal date. */
export async function sendDueRenewalReminders(opts: { force?: boolean } = {}) {
  const client = getResendClient();
  if (!client) return { ok: false as const, error: "RESEND_API_KEY is not configured" };

  const policies = await db.insurancePolicy.findMany();
  const now = Date.now();
  const results: { policyId: string; clientName: string; sent: boolean; reason?: string }[] = [];

  for (const policy of policies) {
    const withinWindow = opts.force || daysUntil(policy.renewalDate) <= REMINDER_WINDOW_DAYS;
    const offCooldown =
      opts.force ||
      !policy.lastReminderSentAt ||
      now - policy.lastReminderSentAt.getTime() > RESEND_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

    if (!withinWindow || !offCooldown) {
      results.push({ policyId: policy.id, clientName: policy.clientName, sent: false, reason: !withinWindow ? "not due yet" : "reminded recently" });
      continue;
    }
    if (!policy.email) {
      results.push({ policyId: policy.id, clientName: policy.clientName, sent: false, reason: "no email on file" });
      continue;
    }

    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to: policy.email,
      subject: `Your ${policy.policyType ?? "policy"} renewal is coming up`,
      text: `Hi ${policy.clientName},

This is a reminder from ${policy.agencyName}: your ${policy.policyType ?? "policy"} is due for renewal on ${policy.renewalDate.toDateString()}. Reply to this email or give us a call to review your coverage before it renews.

${policy.agencyName}`,
    });

    if (error) {
      results.push({ policyId: policy.id, clientName: policy.clientName, sent: false, reason: error.message });
      continue;
    }

    await db.insurancePolicy.update({ where: { id: policy.id }, data: { lastReminderSentAt: new Date() } });
    results.push({ policyId: policy.id, clientName: policy.clientName, sent: true });
  }

  return { ok: true as const, results };
}
