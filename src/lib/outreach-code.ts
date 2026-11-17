import { createHash } from "node:crypto";

/* The short code that goes into one agency's demo links (utm_content). Deterministic from the email address, so the
   sender scripts and the website agree without a lookup table: base36 of the first 5 bytes of sha256("umrah:" + email),
   8 characters. It is not a secret, only a label; the same algorithm lives in the sender scripts (contact-code.mjs). */
export function contactCode(email: string): string {
  const digest = createHash("sha256").update(`umrah:${email.trim().toLowerCase()}`).digest();
  return digest.subarray(0, 5).readUIntBE(0, 5).toString(36).padStart(8, "0");
}

/** Adds ?utm_content=<code> style tagging to the demo link inside an email or WhatsApp text. */
export function withContactCode(text: string, email: string): string {
  const code = contactCode(email);
  return text.replace(/(utm_campaign=umrah-[a-z0-9-]+)(?![a-z0-9-])(?!&utm_content=)/g, `$1&utm_content=${code}`);
}
