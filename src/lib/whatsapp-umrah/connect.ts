import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/secrets";
import { META_TOKEN_ENV } from "@/lib/whatsapp-umrah/inbound";
import { logWaAuditEvent } from "@/lib/whatsapp-umrah/audit";

/* Saving a connected WhatsApp number, shared by the admin manual connect (Zenith HQ) and Embedded Signup.
   Token and PIN are encrypted at rest (CLAUDE.md §7). Connecting is the last onboarding step, so this is
   also where an agency with a knowledge base and settings goes LIVE (inbound.ts refuses anything else). */
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

  const agency = await db.waAgency.findUnique({
    where: { id: agencyId },
    select: { status: true, agentSettings: { select: { id: true } }, kbDocuments: { select: { _count: { select: { chunks: true } } } } },
  });
  const kbHasContent = agency?.kbDocuments.some((d) => d._count.chunks > 0) ?? false;
  if (agency && agency.status !== "LIVE" && kbHasContent && agency.agentSettings) {
    await db.waAgency.update({ where: { id: agencyId }, data: { status: "LIVE" } });
  }
  const action = method === "EMBEDDED_SIGNUP" ? "waba_connected_embedded_signup" : isReconnect ? "waba_reconnected" : "waba_connected";
  await logWaAuditEvent(agencyId, input.actorUserId, action, { wabaId, phoneNumberId });
}
