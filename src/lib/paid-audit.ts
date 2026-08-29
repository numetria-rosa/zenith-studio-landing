import { db } from "@/lib/db";
import type { PaidAuditStatus, Prisma } from "@prisma/client";

/* $35, 20-minute paid audit call tracking.
   Payment + booking happen inside Cal.com Cal Pay
   (cal.com/zenith-studio-ai/paid-automation-audit). Rows are created:
     1. Automatically by /api/webhooks/cal (BOOKING_CREATED / BOOKING_PAID /
        BOOKING_RESCHEDULED / BOOKING_CANCELLED), and/or
     2. Manually by an admin at /admin/paid-audits (fallback / corrections).
   Admin write helpers do not call requireAdmin themselves — every caller
   re-checks independently, matching tasks-admin.ts. */

export const PAID_AUDIT_BOOKING_URL = "https://cal.com/zenith-studio-ai/paid-automation-audit";

/** Cal.com event type id for the paid audit (live event, Cal Pay ON_BOOKING). */
export const PAID_AUDIT_CAL_EVENT_TYPE_ID = 6851441;

/** Event-type slug fragment used when eventTypeId is absent from a payload. */
export const PAID_AUDIT_CAL_EVENT_SLUG = "paid-automation-audit";

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

/** True when this Cal.com payload is for the paid audit event specifically —
    user-level webhooks fire for every event type on the account, so free
    audit bookings and anything else must be filtered out here. */
export function isPaidAuditCalEvent(payload: {
  eventTypeId?: number | null;
  type?: string | null;
}): boolean {
  if (payload.eventTypeId === PAID_AUDIT_CAL_EVENT_TYPE_ID) return true;
  if (typeof payload.type === "string" && payload.type.includes(PAID_AUDIT_CAL_EVENT_SLUG)) {
    return true;
  }
  return false;
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

/** Resolves the email to a real User — admin manual create still requires an
    existing account so staff don't accidentally invent users. The Cal.com
    webhook path uses find-or-create instead (attendees may never have signed
    in). */
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

export type CalBookingWebhookPayload = {
  uid?: string | null;
  eventTypeId?: number | null;
  type?: string | null;
  startTime?: string | null;
  attendees?: Array<{ email?: string | null; name?: string | null }> | null;
  responses?: {
    email?: { value?: unknown };
    name?: { value?: unknown };
  } | null;
};

type UpsertFromCalResult =
  | { ok: true; id: string; action: "created" | "updated" | "ignored" }
  | { ok: false; error: string };

/** Upsert a PaidAudit from a verified Cal.com booking webhook. Idempotent on
    calBookingUid. Ignores non-paid-audit event types. Called from
    /api/webhooks/cal after signature verification. */
export async function upsertPaidAuditFromCalWebhook(
  triggerEvent: string,
  payload: CalBookingWebhookPayload,
  tx: Prisma.TransactionClient = db
): Promise<UpsertFromCalResult> {
  if (!isPaidAuditCalEvent(payload)) {
    return { ok: true, id: "", action: "ignored" };
  }

  let status: PaidAuditStatus;
  if (triggerEvent === "BOOKING_CANCELLED" || triggerEvent === "BOOKING_REJECTED") {
    status = "CANCELLED";
  } else if (
    triggerEvent === "BOOKING_CREATED" ||
    triggerEvent === "BOOKING_PAID" ||
    triggerEvent === "BOOKING_RESCHEDULED"
  ) {
    // Cal Pay ON_BOOKING: a booking only exists after payment succeeds, so
    // CREATED and PAID both mean a real paid booking.
    status = "BOOKED";
  } else {
    return { ok: true, id: "", action: "ignored" };
  }

  const uid = typeof payload.uid === "string" ? payload.uid.trim() : "";
  if (!uid) return { ok: false, error: "missing booking uid" };

  const emailFromAttendee = payload.attendees?.[0]?.email?.trim().toLowerCase() ?? "";
  const emailFromResponses =
    typeof payload.responses?.email?.value === "string"
      ? payload.responses.email.value.trim().toLowerCase()
      : "";
  const email = emailFromAttendee || emailFromResponses;
  if (!email) return { ok: false, error: "missing attendee email" };

  const nameFromAttendee = payload.attendees?.[0]?.name?.trim() || null;
  const nameFromResponses =
    typeof payload.responses?.name?.value === "string" ? payload.responses.name.value.trim() : null;
  const name = nameFromAttendee || nameFromResponses;

  let scheduledAt: Date | null = null;
  if (payload.startTime) {
    const parsed = new Date(payload.startTime);
    if (!Number.isNaN(parsed.getTime())) scheduledAt = parsed;
  }

  let user = await tx.user.findUnique({ where: { email } });
  if (!user) {
    user = await tx.user.create({ data: { email, name: name ?? undefined } });
  } else if (name && !user.name) {
    user = await tx.user.update({ where: { id: user.id }, data: { name } });
  }

  const existing = await tx.paidAudit.findFirst({ where: { calBookingUid: uid } });
  if (existing) {
    // Don't clobber an admin's later lifecycle status with a late BOOKED
    // retry (e.g. BOOKING_PAID after staff already marked COMPLETED).
    const preserveStatus =
      status === "BOOKED" && ["COMPLETED", "FOLLOW_UP", "REFUNDED"].includes(existing.status);

    await tx.paidAudit.update({
      where: { id: existing.id },
      data: {
        userId: user.id,
        email,
        ...(preserveStatus ? {} : { status }),
        ...(scheduledAt ? { scheduledAt } : {}),
      },
    });
    return { ok: true, id: existing.id, action: "updated" };
  }

  const created = await tx.paidAudit.create({
    data: {
      userId: user.id,
      email,
      status,
      scheduledAt,
      calBookingUid: uid,
      amountCents: 3500,
      currency: "usd",
    },
  });
  return { ok: true, id: created.id, action: "created" };
}
