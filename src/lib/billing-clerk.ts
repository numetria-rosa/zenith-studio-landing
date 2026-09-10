import { db } from "@/lib/db";
import { getFreshAccessToken } from "@/lib/oauth-connections";
import {
  fetchGoogleCalendarEvents,
  fetchGoogleRecentEmails,
  type CalendarEventSummary,
  type EmailThreadSummary,
} from "@/lib/oauth-google";
import { fetchMicrosoftCalendarEvents, fetchMicrosoftRecentEmails } from "@/lib/oauth-microsoft";
import { groqChatCompletion } from "@/lib/groq";
import { sendAdminAlert } from "@/lib/outreach-mail";
import type { OAuthConnection } from "@prisma/client";

/* AI Billing Clerk — reconstructs billable time from a firm's own calendar
   and email, drafts a narrative for each, and stops there. Every entry is
   born as DRAFT; nothing becomes billable until approveTimeEntry runs
   (attorney/admin action) — "You approve every entry" is a real status
   gate, not just marketing copy. Runs from /api/cron/billing-clerk. */

const LOOKBACK_DAYS = 14; // matches the vertical's own "14 day write-down window" pitch
const MIN_EVENT_MINUTES = 10; // filters out reminders/holds, not real meetings

const NARRATIVE_SYSTEM_PROMPT = `You are a legal billing assistant. Given details of a calendar meeting or an email, write ONE professional billing narrative sentence in the style law firms use on invoices (e.g. "Telephone conference with opposing counsel regarding discovery schedule."). Identify a likely matter or client name from the available context; use "General" if none is evident. For emails only, also estimate minutes spent (a quick email is 6-12 minutes, a substantive one 15-30). Respond ONLY with JSON: {"matterName": string, "narrative": string, "estimatedMinutes": number}.`;

type DraftResult = { matterName: string; narrative: string; estimatedMinutes: number };

async function draftFromGroq(userPrompt: string, fallbackMinutes: number): Promise<DraftResult> {
  const result = await groqChatCompletion({ systemPrompt: NARRATIVE_SYSTEM_PROMPT, userPrompt, jsonMode: true });
  if (!result.ok) return { matterName: "General", narrative: "Time entry pending review.", estimatedMinutes: fallbackMinutes };
  try {
    const parsed = JSON.parse(result.content) as Partial<DraftResult>;
    return {
      matterName: typeof parsed.matterName === "string" && parsed.matterName.trim() ? parsed.matterName.trim() : "General",
      narrative:
        typeof parsed.narrative === "string" && parsed.narrative.trim()
          ? parsed.narrative.trim()
          : "Time entry pending review.",
      estimatedMinutes:
        typeof parsed.estimatedMinutes === "number" ? Math.min(Math.max(parsed.estimatedMinutes, 6), 480) : fallbackMinutes,
    };
  } catch {
    return { matterName: "General", narrative: "Time entry pending review.", estimatedMinutes: fallbackMinutes };
  }
}

function isExternalMeeting(event: CalendarEventSummary, ownDomain: string): boolean {
  const durationMinutes = (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000;
  if (durationMinutes < MIN_EVENT_MINUTES) return false;
  return event.attendeeEmails.some((email) => !email.toLowerCase().endsWith(`@${ownDomain.toLowerCase()}`));
}

async function fetchCalendarAndEmail(
  connection: OAuthConnection,
  accessToken: string
): Promise<{ events: CalendarEventSummary[]; emails: EmailThreadSummary[] }> {
  if (connection.provider === "GOOGLE") {
    const [events, emails] = await Promise.all([
      fetchGoogleCalendarEvents(accessToken, LOOKBACK_DAYS),
      fetchGoogleRecentEmails(accessToken, LOOKBACK_DAYS),
    ]);
    return { events, emails };
  }
  const [events, emails] = await Promise.all([
    fetchMicrosoftCalendarEvents(accessToken, LOOKBACK_DAYS),
    fetchMicrosoftRecentEmails(accessToken, LOOKBACK_DAYS),
  ]);
  return { events, emails };
}

export async function syncAndDraftTimeEntriesForConnection(connection: OAuthConnection): Promise<{ created: number }> {
  const tokenResult = await getFreshAccessToken(connection);
  if (!tokenResult.ok) {
    await db.oAuthConnection.update({ where: { id: connection.id }, data: { status: "EXPIRED" } });
    await sendAdminAlert(
      `Billing Clerk: reconnect needed for ${connection.accountEmail}`,
      `Refreshing access failed: ${tokenResult.error}. Ask them to reconnect from the project's admin page.`
    );
    return { created: 0 };
  }

  const ownDomain = connection.accountEmail.split("@")[1] ?? "";
  const { events, emails } = await fetchCalendarAndEmail(connection, tokenResult.accessToken);

  const candidateEvents = events.filter((e) => isExternalMeeting(e, ownDomain));
  const candidateRefs = [
    ...candidateEvents.map((e) => e.id),
    ...emails.map((e) => e.id),
  ];
  if (candidateRefs.length === 0) return { created: 0 };

  const existing = await db.timeEntry.findMany({
    where: { projectId: connection.projectId, sourceRef: { in: candidateRefs } },
    select: { sourceRef: true },
  });
  const existingRefs = new Set(existing.map((e) => e.sourceRef));

  let created = 0;

  for (const event of candidateEvents) {
    if (existingRefs.has(event.id)) continue;
    const durationMinutes = Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000);
    const draft = await draftFromGroq(
      `Calendar meeting titled "${event.summary}" with attendees: ${event.attendeeEmails.join(", ") || "none listed"}.`,
      durationMinutes
    );
    await db.timeEntry.create({
      data: {
        projectId: connection.projectId,
        attorneyEmail: connection.accountEmail,
        matterName: draft.matterName,
        entryDate: new Date(event.start),
        durationMinutes, // real duration from the calendar, not Groq's guess
        narrative: draft.narrative,
        sourceType: "calendar",
        sourceRef: event.id,
      },
    });
    created++;
  }

  for (const email of emails) {
    if (existingRefs.has(email.id)) continue;
    const draft = await draftFromGroq(
      `Email from ${email.fromEmail}, subject "${email.subject}": ${email.snippet}`,
      12
    );
    await db.timeEntry.create({
      data: {
        projectId: connection.projectId,
        attorneyEmail: connection.accountEmail,
        matterName: draft.matterName,
        entryDate: email.date ? new Date(email.date) : new Date(),
        durationMinutes: draft.estimatedMinutes,
        narrative: draft.narrative,
        sourceType: "email",
        sourceRef: email.id,
      },
    });
    created++;
  }

  return { created };
}

export async function runBillingClerkForAllProjects(): Promise<{ connectionsProcessed: number; entriesCreated: number }> {
  const connections = await db.oAuthConnection.findMany({ where: { status: "CONNECTED" } });
  let entriesCreated = 0;
  for (const connection of connections) {
    const result = await syncAndDraftTimeEntriesForConnection(connection);
    entriesCreated += result.created;
  }
  return { connectionsProcessed: connections.length, entriesCreated };
}

type ReviewResult = { ok: true } | { ok: false; error: string };

export async function approveTimeEntry(id: string, reviewerUserId: string): Promise<ReviewResult> {
  const entry = await db.timeEntry.findUnique({ where: { id }, select: { status: true } });
  if (!entry) return { ok: false, error: "not_found" };
  if (entry.status !== "DRAFT") return { ok: false, error: "not_a_draft" };
  await db.timeEntry.update({
    where: { id },
    data: { status: "APPROVED", reviewedByUserId: reviewerUserId, reviewedAt: new Date() },
  });
  return { ok: true };
}

export async function rejectTimeEntry(id: string, reviewerUserId: string): Promise<ReviewResult> {
  const entry = await db.timeEntry.findUnique({ where: { id }, select: { status: true } });
  if (!entry) return { ok: false, error: "not_found" };
  if (entry.status !== "DRAFT") return { ok: false, error: "not_a_draft" };
  await db.timeEntry.update({
    where: { id },
    data: { status: "REJECTED", reviewedByUserId: reviewerUserId, reviewedAt: new Date() },
  });
  return { ok: true };
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Approved entries as CSV — the actual "gets invoices out" step is
    deliberately left to the firm's own invoicing/practice-management tool
    (Clio, etc.); building a bespoke invoicing system per firm is exactly
    the integration bottleneck this vertical should avoid. This export is
    the hand-off point. */
export async function exportApprovedTimeEntriesCsv(projectId: string): Promise<string> {
  const entries = await db.timeEntry.findMany({
    where: { projectId, status: "APPROVED" },
    orderBy: { entryDate: "asc" },
  });
  const header = "Date,Attorney,Matter,Minutes,Narrative";
  const rows = entries.map((e) =>
    [
      e.entryDate.toISOString().slice(0, 10),
      csvEscape(e.attorneyEmail),
      csvEscape(e.matterName),
      String(e.durationMinutes),
      csvEscape(e.narrative),
    ].join(",")
  );
  return [header, ...rows].join("\n");
}
