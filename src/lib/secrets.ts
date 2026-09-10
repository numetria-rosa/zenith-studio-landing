import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

/* Generic AES-256-GCM encrypt/decrypt for secrets that must be stored
   reversibly (not hashed) — same scheme as password.ts's buyer-password
   storage, generalized so a second secret class (OAuth refresh tokens for
   the Billing Clerk) can use its own key without touching that one.
   Stored format: "iv:authTag:ciphertext", all hex. */

function getKey(envVarName: string): Buffer {
  const b64 = process.env[envVarName];
  if (!b64) throw new Error(`${envVarName} is not set`);
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error(`${envVarName} must decode to 32 bytes`);
  return key;
}

export function encryptSecret(value: string, envVarName: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(envVarName), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptSecret(stored: string, envVarName: string): string {
  const [ivHex, authTagHex, ciphertextHex] = stored.split(":");
  const decipher = createDecipheriv("aes-256-gcm", getKey(envVarName), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextHex, "hex")), decipher.final()]).toString("utf8");
}
