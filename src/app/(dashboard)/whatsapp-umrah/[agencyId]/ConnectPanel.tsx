import { Hint, FieldLabel, Input, PrimaryButton } from "@/components/wa/ui";
import { isEmbeddedSignupCapReached, EMBEDDED_SIGNUP_ENABLED } from "@/lib/whatsapp-umrah/embedded-signup";
import type { OwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { requestManualConnectAction } from "./actions";
import { EmbeddedSignupButton } from "./EmbeddedSignupButton";
import { getT } from "@/lib/whatsapp-umrah/ui-lang-server";

/* The ways to connect a WhatsApp number: Meta's Embedded Signup when it's available, otherwise the request form
   (our team connects it). Shown in the "Connect your WhatsApp number" card when nothing is connected, and inside the
   Manage dialog once a number is connected. */
export async function ConnectPanel({ agency, email }: { agency: OwnedAgency; email: string }) {
  const t = await getT();
  const pending = agency.manualConnectRequests[0] ?? null;
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const configId = process.env.NEXT_PUBLIC_META_ES_CONFIG_ID;
  const showEmbedded = !pending && EMBEDDED_SIGNUP_ENABLED && !!appId && !!configId && !(await isEmbeddedSignupCapReached());

  if (pending) return <p className="m-0 text-[14px] text-mist">{t("Request sent")} {pending.createdAt.toISOString().slice(0, 10)}{t(". Our team will connect your number within 24 hours.")}</p>;
  if (showEmbedded) return <EmbeddedSignupButton agencyId={agency.id} appId={appId!} configId={configId!} coexistence={process.env.NEXT_PUBLIC_META_ES_COEXISTENCE !== "false"} />;

  return (
    <form action={requestManualConnectAction.bind(null, agency.id)} className="flex flex-col gap-4">
      <p className="m-0 text-[14px] leading-[1.55] text-mist">
        {t("Tell us about your WhatsApp Business number and our team will connect it for you, usually within 24 hours. If you already have your WABA ID and phone number ID from Meta, add them too and it will be faster.")}
      </p>
      <div className="grid grid-cols-2 gap-[14px]">
        <div>
          <FieldLabel htmlFor="businessName">{t("Business name")}</FieldLabel>
          <Input id="businessName" name="businessName" defaultValue={agency.name} required />
        </div>
        <div>
          <FieldLabel htmlFor="contactEmail">{t("Contact email")}</FieldLabel>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={email} required />
        </div>
        <div>
          <FieldLabel htmlFor="contactPhone">{t("Contact phone")}</FieldLabel>
          <Input id="contactPhone" name="contactPhone" placeholder="+44..." required />
        </div>
        <div>
          <FieldLabel htmlFor="wabaId">{t("WABA ID (optional)")}</FieldLabel>
          <Input id="wabaId" name="wabaId" mono />
        </div>
        <div>
          <FieldLabel htmlFor="phoneNumberId">{t("Phone number ID (optional)")}</FieldLabel>
          <Input id="phoneNumberId" name="phoneNumberId" mono />
        </div>
        <div>
          <FieldLabel htmlFor="notes">{t("Anything else (optional)")}</FieldLabel>
          <Input id="notes" name="notes" />
        </div>
      </div>
      <div>
        <PrimaryButton type="submit">{t("Send request")}</PrimaryButton>
        <Hint>{t("Meta bills WhatsApp messages to your own account, so you will also add a payment method in WhatsApp Manager.")}</Hint>
      </div>
    </form>
  );
}
