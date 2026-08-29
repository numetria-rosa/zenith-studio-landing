import { Resend } from "resend";

/* Thin Resend wrapper. First usage was proposal PDF email from
   /admin/proposals/[id]; kickoff email on project create is the second. */

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

export type SendProjectKickoffEmailInput = {
  to: string;
  clientName: string | null;
  projectTitle: string;
  dashboardUrl: string;
};

/** Best-effort kickoff email after a ServiceProject is created. Skips
    cleanly when RESEND_API_KEY is unset — the in-app kickoff message still
    lands either way. */
export async function sendProjectKickoffEmail(
  input: SendProjectKickoffEmailInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getResendClient();
  if (!client) return { ok: false, error: "RESEND_API_KEY is not configured" };

  const greetingName = input.clientName?.trim() || "there";

  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to: input.to,
    subject: `Your project is ready — ${input.projectTitle}`,
    text: `Hi ${greetingName},

Your Zenith Studio project "${input.projectTitle}" is set up.

Open your workspace to complete the short requirements checklist so we can start build:

${input.dashboardUrl}

Questions? Reply to this email or message us inside the workspace.

Zenith Studio`,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
