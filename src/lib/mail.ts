import { Resend } from "resend";

/* Thin Resend wrapper. `resend` was already a package.json dependency
   before this — installed but never wired up anywhere (no RESEND_API_KEY,
   no call site). This is the first real usage: emailing a proposal PDF to
   a client from /admin/proposals/[id]. Kept to a single function rather
   than a generic "sendEmail" — every call site here is proposal-specific,
   so there's no abstraction to share yet. */

const FROM_ADDRESS = "Zenith Studio <hello@zenith-studio.site>";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export type SendProposalEmailInput = {
  to: string;
  clientName: string | null;
  companyName: string | null;
  publicUrl: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
};

export async function sendProposalEmail(
  input: SendProposalEmailInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getResendClient();
  if (!client) return { ok: false, error: "RESEND_API_KEY is not configured" };

  const greetingName = input.clientName?.trim() || "there";
  const forWhat = input.companyName ? ` for ${input.companyName}` : "";

  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to: input.to,
    subject: `Your Zenith Studio proposal${input.companyName ? ` — ${input.companyName}` : ""}`,
    text: `Hi ${greetingName},

Here's your automation proposal${forWhat}. It's attached as a PDF, and you can also view and respond to it online:

${input.publicUrl}

Any questions, just reply to this email.

Zenith Studio`,
    attachments: [
      {
        filename: input.pdfFilename,
        content: input.pdfBuffer,
      },
    ],
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
