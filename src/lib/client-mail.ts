import { Resend } from "resend";

/** Sends an email on a client's behalf: their business name as the sender,
    replies going to the client, not to us. */
export async function sendAsBusiness(input: {
  businessName: string;
  to: string;
  replyTo: string | null;
  subject: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY is not configured" };
  const name = input.businessName.replace(/["<>\r\n]/g, "").trim().slice(0, 60) || "Zenith Studio";
  const { error } = await new Resend(apiKey).emails.send({
    from: `"${name}" <hello@zenith-studio.site>`,
    to: input.to,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    subject: input.subject,
    text: input.text,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
