import type { WhatsAppProvider, SendTextResult, SendTemplateResult } from "./types";

/* Real sends via the WhatsApp Cloud API. Request shapes confirmed against
   developers.facebook.com/documentation/business-messaging/whatsapp/
   messages/send-messages (2026-09-28), not guessed. Per CLAUDE.md: never
   send real WhatsApp messages to real numbers during development - this
   class exists but nothing in this codebase calls it outside a real
   webhook/agency context; tests use MockWhatsAppProvider. */

// v26.0 confirmed current as of 2026-09-28 (developers.facebook.com Graph
// API Reference / WhatsApp changelog) - bump when Meta deprecates it.
const GRAPH_API_BASE = "https://graph.facebook.com/v26.0";

export class MetaCloudWhatsAppProvider implements WhatsAppProvider {
  constructor(private accessToken: string) {}

  async sendText(input: { phoneNumberId: string; to: string; body: string }): Promise<SendTextResult> {
    return this.send(input.phoneNumberId, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: input.to,
      type: "text",
      text: { body: input.body },
    });
  }

  async sendTemplate(input: { phoneNumberId: string; to: string; templateName: string; languageCode: string; params?: string[] }): Promise<SendTemplateResult> {
    return this.send(input.phoneNumberId, {
      messaging_product: "whatsapp",
      to: input.to,
      type: "template",
      template: {
        name: input.templateName,
        language: { code: input.languageCode },
        ...(input.params?.length ? { components: [{ type: "body", parameters: input.params.map((p) => ({ type: "text", text: p })) }] } : {}),
      },
    });
  }

  private async send(phoneNumberId: string, body: Record<string, unknown>): Promise<SendTextResult> {
    try {
      const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
      const parsed = (await res.json()) as { messages?: { id: string }[] };
      const waMessageId = parsed.messages?.[0]?.id;
      if (!waMessageId) return { ok: false, error: "Meta accepted the send but returned no message id" };
      return { ok: true, waMessageId };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "WhatsApp Cloud API request failed" };
    }
  }
}
