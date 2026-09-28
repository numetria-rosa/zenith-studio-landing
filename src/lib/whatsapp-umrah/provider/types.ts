/* WhatsAppProvider abstraction — see CLAUDE.md's onboarding-path section.
   MetaCloudProvider (real sends via the WhatsApp Cloud API) and
   MockProvider (tests/local dev, never sends anything real) both
   implement this. A BSP adapter (Twilio, 360dialog) can be added later
   without touching callers, since nothing outside this folder should
   import Meta's API shape directly. */

export type SendTextResult = { ok: true; waMessageId: string } | { ok: false; error: string };

export type SendTemplateResult = { ok: true; waMessageId: string } | { ok: false; error: string };

export interface WhatsAppProvider {
  /** Free-form text reply. Callers must have already confirmed the 24h
      customer service window is open — a provider implementation should
      itself refuse and return ok:false if asked to send outside it,
      never silently substitute a template. */
  sendText(input: { phoneNumberId: string; to: string; body: string }): Promise<SendTextResult>;

  /** Pre-approved template send (used outside the 24h window, or for
      owner hot-lead alerts, which require opt-in + a template). */
  sendTemplate(input: {
    phoneNumberId: string;
    to: string;
    templateName: string;
    languageCode: string;
    params?: string[];
  }): Promise<SendTemplateResult>;
}
