import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

/* Reversible, not one-way: the profile page needs to show a buyer their
   actual current password on demand (no email flow exists to fall back on
   for a lost password), so a one-way hash can't work here. AES-256-GCM
   keyed by PASSWORD_ENCRYPTION_KEY — a secret that lives only in server
   env vars, never in the database — means a database leak alone still
   doesn't hand out every password; both the DB and the server environment
   would have to be compromised together. Stored format is "iv:authTag:ciphertext",
   all hex. */
function getKey(): Buffer {
  const b64 = process.env.PASSWORD_ENCRYPTION_KEY;
  if (!b64) throw new Error("PASSWORD_ENCRYPTION_KEY is not set");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("PASSWORD_ENCRYPTION_KEY must decode to 32 bytes");
  return key;
}

export function encryptPassword(password: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptPassword(stored: string): string {
  const [ivHex, authTagHex, ciphertextHex] = stored.split(":");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextHex, "hex")), decipher.final()]).toString("utf8");
}

// 20 random base62-ish chars — no ambiguous-looking symbols, easy to read
// off a screen, strong enough it's never worth brute-forcing.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
export function generateStrongPassword(length = 20): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
