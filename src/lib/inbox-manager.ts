import { db } from "@/lib/db";
import { decryptPassword } from "@/lib/password";
import { fetchUnseenEmails, sendMailReply } from "@/lib/mail-imap";
import { groqChatCompletion } from "@/lib/groq";
import { sendAdminAlert } from "@/lib/outreach-mail";
import { recordUsageCost, ESTIMATED_COST_CENTS } from "@/lib/usage-costs";
import { isProjectPaused } from "@/lib/project-pause";
import type { MailConnection } from "@prisma/client";

/* AI Inbox Manager runtime, launch scope: Gmail (personal accounts) and
   Yahoo Mail, connected via a static app password (see mail-imap.ts) —
   deliberately not full Gmail/Microsoft OAuth. That would need write
   scopes (gmail.modify / Mail.ReadWrite) that Billing Clerk's existing
   OAuth never requested, plus a fresh Google/Microsoft app-verification
   review (weeks, not days) before any client could use it. App-password
   IMAP/SMTP sidesteps that review entirely for Gmail and Yahoo; Outlook/
   Microsoft 365 has broadly disabled basic-auth IMAP on modern tenants and
   isn't supported at this scope — sold and described as such, not quietly
   assumed to work.

   Same "never auto-send" gate as Billing Clerk's TimeEntry: every reply is
   born as an InboxDraft, nothing goes out until approveInboxDraft in
   service-workspace.ts actually sends it. Runs from
   /api/cron/inbox-manager. */

const DRAFT_SYSTEM_PROMPT = `You triage inbound business email and draft a short, professional reply. Given the sender, subject, and body of one email, decide if it's routine (a scheduling request, a document request, a simple question with an obvious answer) or something that needs a human's judgment (a complaint, a novel request, anything sensitive). Always draft a reasonable reply attempt either way, a human reviews everything before it sends. Respond ONLY with JSON: {"reply": string}.`;

async function draftReplyFromGroq(fromEmail: string, subject: string, snippet: string): Promise<string> {
  const fallback = "Thanks for your email — I'll take a look and get back to you shortly.";
  const result = await groqChatCompletion({
    systemPrompt: DRAFT_SYSTEM_PROMPT,
    userPrompt: `From: ${fromEmail}\nSubject: ${subject}\n\n${snippet}`,
    jsonMode: true,
  });
  if (!result.ok) return fallback;
  try {
    const parsed = JSON.parse(result.content) as Partial<{ reply: string }>;
    return typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.trim() : fallback;
  } catch {
    return fallback;
  }
}

export async function syncAndDraftForConnection(connection: MailConnection): Promise<{ created: number }> {
  if (await isProjectPaused(connection.projectId)) return { created: 0 };

  const creds = {
    provider: connection.provider,
    emailAddress: connection.emailAddress,
    appPassword: decryptPassword(connection.encryptedAppPassword),
  };

  let emails;
  try {
    emails = await fetchUnseenEmails(creds);
  } catch (err) {
    await db.mailConnection.update({
      where: { id: connection.id },
      data: { status: "ERROR", lastError: err instanceof Error ? err.message : "Fetch failed" },
    });
    await sendAdminAlert(
      `Inbox Manager: connection issue for ${connection.emailAddress}`,
      `Fetching mail failed: ${err instanceof Error ? err.message : "unknown error"}. Ask them to reconnect from the project's dashboard.`
    );
    return { created: 0 };
  }

  if (emails.length === 0) return { created: 0 };

  const existing = await db.inboxDraft.findMany({
    where: { projectId: connection.projectId, sourceRef: { in: emails.map((e) => e.messageId) } },
    select: { sourceRef: true },
  });
  const existingRefs = new Set(existing.map((e) => e.sourceRef));

  let created = 0;
  for (const email of emails) {
    if (existingRefs.has(email.messageId)) continue;
    const reply = await draftReplyFromGroq(email.fromEmail, email.subject, email.snippet);
    await recordUsageCost(connection.projectId, ESTIMATED_COST_CENTS.GROQ_CALL, "inbox manager draft");
    await db.inboxDraft.create({
      data: {
        projectId: connection.projectId,
        fromEmail: email.fromEmail,
        subject: email.subject,
        snippet: email.snippet,
        draftReply: reply,
        sourceRef: email.messageId,
      },
    });
    created++;
  }
  return { created };
}

export async function runInboxManagerForAllProjects(): Promise<{ connectionsProcessed: number; draftsCreated: number }> {
  const connections = await db.mailConnection.findMany({
    where: { status: "CONNECTED", project: { stage: { not: "PAUSED" } } },
  });
  let draftsCreated = 0;
  for (const connection of connections) {
    const result = await syncAndDraftForConnection(connection);
    draftsCreated += result.created;
  }
  return { connectionsProcessed: connections.length, draftsCreated };
}

type ReviewResult = { ok: true } | { ok: false; error: string };

/** Sends the draft as a real reply via the client's own connected mailbox,
    then marks it APPROVED. Refuses to touch anything not currently DRAFT. */
export async function approveInboxDraft(id: string, reviewerUserId: string): Promise<ReviewResult> {
  const draft = await db.inboxDraft.findUnique({ where: { id }, select: { status: true, projectId: true, fromEmail: true, subject: true, draftReply: true, sourceRef: true } });
  if (!draft) return { ok: false, error: "not_found" };
  if (draft.status !== "DRAFT") return { ok: false, error: "not_a_draft" };

  const connection = await db.mailConnection.findFirst({
    where: { projectId: draft.projectId, status: "CONNECTED" },
    orderBy: { connectedAt: "desc" },
  });
  if (!connection) return { ok: false, error: "no_connection" };

  const creds = {
    provider: connection.provider,
    emailAddress: connection.emailAddress,
    appPassword: decryptPassword(connection.encryptedAppPassword),
  };
  const sendResult = await sendMailReply(creds, {
    toEmail: draft.fromEmail,
    subject: draft.subject,
    body: draft.draftReply,
    inReplyTo: draft.sourceRef,
  });
  if (!sendResult.ok) return { ok: false, error: sendResult.error };

  await db.inboxDraft.update({
    where: { id },
    data: { status: "APPROVED", reviewedByUserId: reviewerUserId, reviewedAt: new Date() },
  });
  return { ok: true };
}

export async function rejectInboxDraft(id: string, reviewerUserId: string): Promise<ReviewResult> {
  const draft = await db.inboxDraft.findUnique({ where: { id }, select: { status: true } });
  if (!draft) return { ok: false, error: "not_found" };
  if (draft.status !== "DRAFT") return { ok: false, error: "not_a_draft" };
  await db.inboxDraft.update({
    where: { id },
    data: { status: "REJECTED", reviewedByUserId: reviewerUserId, reviewedAt: new Date() },
  });
  return { ok: true };
}
