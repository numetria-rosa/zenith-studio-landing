import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/secrets";
import { META_TOKEN_ENV } from "@/lib/whatsapp-umrah/inbound";
import { logWaAuditEvent } from "@/lib/whatsapp-umrah/audit";
import { subscribeWabaToApp } from "@/lib/whatsapp-umrah/embedded-signup-flow";
import { syncAgencyLive } from "@/lib/whatsapp-umrah/live";

/* Saving a connected WhatsApp number, shared by the admin manual connect (Zenith HQ) and Embedded Signup.
   Token and PIN are encrypted at rest (CLAUDE.md §7). Connecting is the last onboarding step, so this is
   also one of the places an agency can go LIVE (see live.ts: inbound.ts refuses anything else). */
export async function saveWhatsAppConnection(input: {
  agencyId: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string | null;
  accessToken: string;
  method: "MANUAL" | "EMBEDDED_SIGNUP";
  actorUserId: string | null;
  registrationPin?: string | null;
}): Promise<void> {
  const { agencyId, wabaId, phoneNumberId, displayPhoneNumber, method } = input;
  // A pasted-in token never went through Embedded Signup, which is what subscribes our app to the WABA. Without
  // this call Meta sends no webhooks and the agent never hears a customer, so do it here (and fail loudly).
  if (method === "MANUAL") await subscribeWabaToApp(wabaId, input.accessToken, fetch);
  const encryptedAccessToken = encryptSecret(input.accessToken, META_TOKEN_ENV);
  const encryptedRegistrationPin = input.registrationPin ? encryptSecret(input.registrationPin, META_TOKEN_ENV) : undefined;
  const isReconnect = await db.waWhatsAppAccount.findUnique({ where: { agencyId }, select: { id: true } });
  const fields = { wabaId, phoneNumberId, displayPhoneNumber, encryptedAccessToken, status: "CONNECTED" as const, connectedAt: new Date(), connectMethod: method, ...(encryptedRegistrationPin ? { encryptedRegistrationPin } : {}) };
  await db.waWhatsAppAccount.upsert({
    where: { agencyId },
    create: { agencyId, provider: "META", ...fields },
    update: { ...fields, lastError: null },
  });
  await db.waManualConnectRequest.updateMany({ where: { agencyId, status: "PENDING" }, data: { status: "RESOLVED", resolvedAt: new Date() } });

  await syncAgencyLive(agencyId);
  const action = method === "EMBEDDED_SIGNUP" ? "waba_connected_embedded_signup" : isReconnect ? "waba_reconnected" : "waba_connected";
  await logWaAuditEvent(agencyId, input.actorUserId, action, { wabaId, phoneNumberId });
}
