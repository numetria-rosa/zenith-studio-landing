import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import type { MailProvider } from "@prisma/client";

/* Server-only IMAP/SMTP access for AI Inbox Manager, launch scope: Gmail
   (personal accounts) and Yahoo Mail only, both connected via a static app
   password the client generates in their own account settings - not
   Microsoft 365, which has broadly disabled basic-auth IMAP on modern
   tenants and would need real OAuth instead. See inbox-manager.ts for why
   this is the deliberate launch scope, not a temporary shortcut.

   Never import this from a "use client" component or anything it might
   pull into the browser bundle - imapflow/nodemailer are Node-only, the
   same class of mistake that broke the production build earlier when a
   Node-only package leaked into client code (see AdminNav.tsx history). */

const PROVIDER_HOSTS: Record<MailProvider, { imapHost: string; imapPort: number; smtpHost: string; smtpPort: number }> = {
  GMAIL: { imapHost: "imap.gmail.com", imapPort: 993, smtpHost: "smtp.gmail.com", smtpPort: 465 },
  YAHOO: { imapHost: "imap.mail.yahoo.com", imapPort: 993, smtpHost: "smtp.mail.yahoo.com", smtpPort: 465 },
};

type MailCredentials = { provider: MailProvider; emailAddress: string; appPassword: string };

function openImapClient(creds: MailCredentials): ImapFlow {
  const { imapHost, imapPort } = PROVIDER_HOSTS[creds.provider];
  return new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: { user: creds.emailAddress, pass: creds.appPassword },
    logger: false,
  });
}

export type ConnectionTestResult = { ok: true } | { ok: false; error: string };

/** Verifies the email + app password actually logs in before saving the
    connection - never save a credential we haven't confirmed works,
    the client would otherwise find out it's broken only when nothing
    ever gets drafted. */
export async function testMailConnection(creds: MailCredentials): Promise<ConnectionTestResult> {
  const client = openImapClient(creds);
  try {
    await client.connect();
    await client.logout();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

export type InboundEmail = {
  messageId: string;
  fromEmail: string;
  subject: string;
  snippet: string;
};

/** Recent unseen messages in the inbox, newest first, capped to a small
    batch per poll - this runs on a cron, not on demand, so it doesn't need
    to catch up on a backlog in one pass. */
export async function fetchUnseenEmails(creds: MailCredentials, limit = 15): Promise<InboundEmail[]> {
  const client = openImapClient(creds);
  const results: InboundEmail[] = [];
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ seen: false }, { uid: true });
      const recentUids = (uids || []).slice(-limit);
      for (const uid of recentUids) {
        const raw = await client.download(String(uid), undefined, { uid: true });
        if (!raw?.content) continue;
        const parsed = await simpleParser(raw.content);
        const messageId = parsed.messageId ?? `${creds.emailAddress}-${uid}`;
        const fromEmail = parsed.from?.value?.[0]?.address ?? "unknown";
        const subject = parsed.subject ?? "(no subject)";
        const snippet = (parsed.text ?? "").slice(0, 1200);
        results.push({ messageId, fromEmail, subject, snippet });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
  return results;
}

export type SendReplyResult = { ok: true } | { ok: false; error: string };

/** Sends the approved draft as a real reply, from the client's own
    connected mailbox (their real address, via their own SMTP), not a
    Zenith-controlled address - this is the point of connecting directly
    instead of the forwarding-only approach. */
export async function sendMailReply(
  creds: MailCredentials,
  input: { toEmail: string; subject: string; body: string; inReplyTo: string }
): Promise<SendReplyResult> {
  const { smtpHost, smtpPort } = PROVIDER_HOSTS[creds.provider];
  const transport = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: true,
    auth: { user: creds.emailAddress, pass: creds.appPassword },
  });
  try {
    await transport.sendMail({
      from: creds.emailAddress,
      to: input.toEmail,
      subject: input.subject.startsWith("Re:") ? input.subject : `Re: ${input.subject}`,
      text: input.body,
      inReplyTo: input.inReplyTo,
      references: input.inReplyTo,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}
