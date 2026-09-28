import type { WhatsAppProvider } from "./types";

/* Never sends anything real - see CLAUDE.md ("never send real WhatsApp
   messages to real numbers during development"). Records every call so
   tests can assert on exactly what would have been sent. */
export class MockWhatsAppProvider implements WhatsAppProvider {
  sent: Array<{ kind: "text"; to: string; body: string } | { kind: "template"; to: string; templateName: string }> = [];

  async sendText(input: { phoneNumberId: string; to: string; body: string }) {
    this.sent.push({ kind: "text", to: input.to, body: input.body });
    return { ok: true as const, waMessageId: `mock-${this.sent.length}` };
  }

  async sendTemplate(input: { phoneNumberId: string; to: string; templateName: string }) {
    this.sent.push({ kind: "template", to: input.to, templateName: input.templateName });
    return { ok: true as const, waMessageId: `mock-${this.sent.length}` };
  }
}
