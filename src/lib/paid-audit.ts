import { db } from "@/lib/db";
import type { PaidAuditStatus } from "@prisma/client";

/* Manual admin tracking for the $35, 20-minute paid audit call — see the
   doc comment on the PaidAudit model in prisma/schema.prisma for the full
   rationale. Payment and booking both happen inside Cal.com's own "Cal
   Pay" flow (cal.com/zenith-studio-ai/paid-automation-audit); there is no
   webhook back to this app, so every row here is created and updated by an
   admin after they see a real booking land in their Cal.com calendar.
   Every write here re-checks requireAdmin() independently in its own
   caller, matching tasks-admin.ts's convention — this file does not call
   requireAdmin itself. */

export const PAID_AUDIT_BOOKING_URL = "https://cal.com/zenith-studio-ai/paid-automation-audit";

export const PAID_AUDIT_STATUSES: PaidAuditStatus[] = [
  "PAYMENT_PENDING",
  "PAID",
  "BOOKING_PENDING",
  "BOOKED",
  "COMPLETED",
  "FOLLOW_UP",
  "CANCELLED",
  "REFUNDED",
];

export const PAID_AUDIT_STATUS_LABELS: Record<PaidAuditStatus, string> = {
  PAYMENT_PENDING: "Payment pending",
  PAID: "Paid",
  BOOKING_PENDING: "Booking pending",
  BOOKED: "Booked",
  COMPLETED: "Completed",
  FOLLOW_UP: "Follow-up",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export function isPaidAuditStatus(value: string): value is PaidAuditStatus {
  return (PAID_AUDIT_STATUSES as string[]).includes(value);
}

export async function listPaidAuditsForAdmin() {
  return db.paidAudit.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ createdAt: "desc" }],
  });
}

/** Paid audits for one signed-in client's dashboard — scoped to their own
    userId only, never a client-supplied id. */
export async function listPaidAuditsForUser(userId: string) {
  return db.paidAudit.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
  });
}

type WriteResult = { ok: true; id?: string } | { ok: false; error: string };

export type PaidAuditInput = {
  email: string;
  companyName?: string;
  status?: string;
  scheduledAt?: string;
  calBookingUid?: string;
  adminNote?: string;
  followUpNote?: string;
};

/** Resolves the email to a real User — a PaidAudit always belongs to a real
    account, it is never created for an email with no User row, matching
    how every other admin-facing model here is anchored to a real FK. */
async function resolveUser(email: string): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "email is required" };
  const user = await db.user.findUnique({ where: { email: trimmed }, select: { id: true } });
  if (!user) return { ok: false, error: `no account found for ${trimmed} — the client must sign in at least once first` };
  return { ok: true, userId: user.id };
}

function parseOptionalDate(value: string | undefined): { ok: true; date: Date | null } | { ok: false; error: string } {
  if (!value || !value.trim()) return { ok: true, date: null };
  const parsed = new Date(value.trim());
  if (Number.isNaN(parsed.getTime())) return { ok: false, error: "invalid scheduledAt" };
  return { ok: true, date: parsed };
}

export async function createPaidAudit(input: PaidAuditInput): Promise<WriteResult> {
  const resolved = await resolveUser(input.email);
  if (!resolved.ok) return resolved;

  const status = input.status && input.status.trim() ? input.status.trim() : "BOOKED";
  if (!isPaidAuditStatus(status)) return { ok: false, error: `invalid status "${status}"` };

  const scheduled = parseOptionalDate(input.scheduledAt);
  if (!scheduled.ok) return scheduled;

  const record = await db.paidAudit.create({
    data: {
      userId: resolved.userId,
      email: input.email.trim().toLowerCase(),
      companyName: input.companyName?.trim() || null,
      status,
      scheduledAt: scheduled.date,
      calBookingUid: input.calBookingUid?.trim() || null,
      adminNote: input.adminNote?.trim() || null,
      followUpNote: input.followUpNote?.trim() || null,
    },
  });
  return { ok: true, id: record.id };
}

export async function updatePaidAudit(id: string, input: PaidAuditInput): Promise<WriteResult> {
  const existing = await db.paidAudit.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: "not_found" };

  const resolved = await resolveUser(input.email);
  if (!resolved.ok) return resolved;

  const status = input.status && input.status.trim() ? input.status.trim() : "BOOKED";
  if (!isPaidAuditStatus(status)) return { ok: false, error: `invalid status "${status}"` };

  const scheduled = parseOptionalDate(input.scheduledAt);
  if (!scheduled.ok) return scheduled;

  await db.paidAudit.update({
    where: { id },
    data: {
      userId: resolved.userId,
      email: input.email.trim().toLowerCase(),
      companyName: input.companyName?.trim() || null,
      status,
      scheduledAt: scheduled.date,
      calBookingUid: input.calBookingUid?.trim() || null,
      adminNote: input.adminNote?.trim() || null,
      followUpNote: input.followUpNote?.trim() || null,
    },
  });
  return { ok: true };
}
