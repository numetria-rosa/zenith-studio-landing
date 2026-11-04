import { db } from "@/lib/db";
import { sendAdminAlert, sendPlainEmail } from "@/lib/outreach-mail";

/** Meta's error text, in words an agency owner can act on. The payment one matters most: since 1 Oct 2026
    service messages are billed, so an account with no payment method gets none of its replies delivered
    (CLAUDE.md section 2). The numeric codes matched here (131042 payment, 131047/131026 window, 190 token) are from
    memory of Meta's error-code reference, not read from it: check them against the live send errors. */
export function describeSendError(raw: string): string {
  if (/131042|payment|billing/i.test(raw)) {
    return "Meta is not delivering your agent's replies because your WhatsApp Business account has no valid payment method. Add one in Meta Business Suite, under WhatsApp Manager, then Payment settings.";
  }
  if (/131047|131026|re-?engagement|24 hours/i.test(raw)) {
    return "Meta refused a reply because it was more than 24 hours since the customer last messaged. Ask them to message you again.";
  }
  if (/"code"\s*:\s*190|access token|OAuthException|session has expired/i.test(raw)) {
    return "Meta rejected the connection token for your WhatsApp number. It may have been revoked or expired, so the number needs reconnecting.";
  }
  return `Meta rejected a reply: ${raw.replace(/\s+/g, " ").slice(0, 240)}`;
}

/** Records that a send failed, shows it on the agency's dashboard (WaWhatsAppAccount.lastError) and emails the
    owner once per distinct problem, so a persistent failure doesn't send one email per customer message. */
export async function noteSendFailure(agencyId: string, rawError: string): Promise<void> {
  const message = describeSendError(rawError);
  const account = await db.waWhatsAppAccount.findUnique({ where: { agencyId }, select: { lastError: true } });
  if (!account || account.lastError === message) return;
  await db.waWhatsAppAccount.update({ where: { agencyId }, data: { lastError: message } });

  const agency = await db.waAgency.findUnique({
    where: { id: agencyId },
    select: { name: true, memberships: { where: { role: "OWNER" }, take: 1, select: { user: { select: { email: true } } } } },
  });
  const ownerEmail = agency?.memberships[0]?.user.email;
  const subject = `${agency?.name ?? "Your agency"}: WhatsApp replies are not being delivered`;
  if (ownerEmail) await sendPlainEmail(ownerEmail, subject, `${message}\n\nCustomers are writing to you but not getting an answer until this is fixed.`).catch(() => {});
  await sendAdminAlert(`WhatsApp send failure: ${agency?.name ?? agencyId}`, `${message}\n\nRaw: ${rawError.slice(0, 500)}`).catch(() => {});
}

/** A reply went out fine again: clear the dashboard warning. */
export async function clearSendFailure(agencyId: string): Promise<void> {
  await db.waWhatsAppAccount.updateMany({ where: { agencyId, lastError: { not: null } }, data: { lastError: null } });
}

/** Call after every provider send: a failure is reported, a success clears an earlier failure. */
export async function trackSend(agencyId: string, previousError: string | null, result: { ok: true } | { ok: false; error: string }): Promise<void> {
  if (!result.ok) await noteSendFailure(agencyId, result.error);
  else if (previousError) await clearSendFailure(agencyId);
}
