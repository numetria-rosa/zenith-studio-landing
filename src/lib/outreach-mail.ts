import { Resend } from "resend";
import { htmlEscape, textToSimpleHtml } from "@/lib/outreach";
import { getSiteUrl } from "@/lib/site";

const FROM_ADDRESS = "Zenith Studio <hello@zenith-studio.site>";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export type OutreachMailLinks = {
  serviceUrl: string;
  proposalUrl?: string | null;
  auditUrl?: string | null;
  paidAuditUrl?: string | null;
  unsubscribeUrl: string;
};

export function renderOutreachHtml(bodyText: string, links: OutreachMailLinks, serviceLabel: string): string {
  const extra: string[] = [];
  extra.push(
    `<p style="margin:0 0 12px"><a href="${htmlEscape(links.serviceUrl)}" style="color:#0e4f8c">${htmlEscape(`See how ${serviceLabel} works`)}</a></p>`
  );
  if (links.proposalUrl) {
    extra.push(
      `<p style="margin:0 0 12px"><a href="${htmlEscape(links.proposalUrl)}" style="color:#0e4f8c">View the short proposal</a></p>`
    );
  }
  if (links.auditUrl) {
    extra.push(
      `<p style="margin:0 0 12px"><a href="${htmlEscape(links.auditUrl)}" style="color:#0e4f8c">Request a free written audit</a></p>`
    );
  }
  if (links.paidAuditUrl) {
    extra.push(
      `<p style="margin:0 0 12px"><a href="${htmlEscape(links.paidAuditUrl)}" style="color:#0e4f8c">Book the $35 20-minute audit call</a></p>`
    );
  }

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f6f4;font-family:Georgia,'Times New Roman',serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    ${textToSimpleHtml(bodyText)}
    <div style="margin:24px 0 8px;border-top:1px solid #ddd;padding-top:16px">
      ${extra.join("")}
    </div>
    <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#666">
      Zenith Studio · <a href="${htmlEscape(getSiteUrl())}" style="color:#666">${htmlEscape(getSiteUrl().replace("https://", ""))}</a><br/>
      <a href="${htmlEscape(links.unsubscribeUrl)}" style="color:#666">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

export function appendPlainLinks(bodyText: string, links: OutreachMailLinks, serviceLabel: string): string {
  const lines = [
    bodyText.trim(),
    "",
    `See how ${serviceLabel} works: ${links.serviceUrl}`,
  ];
  if (links.proposalUrl) lines.push(`View the short proposal: ${links.proposalUrl}`);
  if (links.auditUrl) lines.push(`Free written audit: ${links.auditUrl}`);
  if (links.paidAuditUrl) lines.push(`$35 audit call: ${links.paidAuditUrl}`);
  lines.push("", `Unsubscribe: ${links.unsubscribeUrl}`);
  return lines.join("\n");
}

export async function sendOutreachEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
    unsubscribeUrl: string;
    listUnsubscribeUrl?: string;
  }): Promise<{ ok: true; resendId: string | null } | { ok: false; error: string }> {
  const client = getResendClient();
  if (!client) return { ok: false, error: "RESEND_API_KEY is not configured" };

  const { data, error } = await client.emails.send({
    from: FROM_ADDRESS,
    to: input.to,
    replyTo: "hello@zenith-studio.site",
    subject: input.subject,
    html: input.html,
    text: input.text,
    headers: {
      "List-Unsubscribe": `<${input.listUnsubscribeUrl || input.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, resendId: data?.id ?? null };
}

export async function sendAdminAlert(subject: string, text: string): Promise<void> {
  const client = getResendClient();
  if (!client) return;
  const to = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)[0];
  if (!to) return;
  await client.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `[Zenith outreach] ${subject}`,
    text,
  });
}
