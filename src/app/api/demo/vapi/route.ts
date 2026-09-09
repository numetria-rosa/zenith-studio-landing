import type { NextRequest } from "next/server";
import { sendAdminAlert } from "@/lib/outreach-mail";

/* Server URL for the /demo/[slug] web-call assistant only — see
   buildDemoAssistantPayload in lib/vapi.ts. This config is sent to the
   browser for the Vapi Web SDK to use directly, so unlike
   /api/webhooks/vapi it CANNOT require a shared secret (there is nowhere
   safe to hide one in a browser-visible payload). It stays safe to leave
   open because it does nothing sensitive: no DB write, no real booking,
   just a canned reply and an email ping to let you know a prospect tried
   the demo.
   ponytail: no rate limiting — fine while traffic is a handful of outreach
   links; add it if this ever gets scraped/spammed. */

type VapiToolCall = { id: string; function: { name: string } };
type VapiMessage = {
  type: string;
  call?: { metadata?: { prospectId?: string } };
  toolCallList?: VapiToolCall[];
  toolCalls?: VapiToolCall[];
};

export async function POST(request: NextRequest): Promise<Response> {
  let body: { message?: VapiMessage };
  try {
    body = (await request.json()) as { message?: VapiMessage };
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const message = body.message;
  if (!message || typeof message.type !== "string") {
    return new Response("missing message.type", { status: 400 });
  }

  if (message.type === "tool-calls") {
    const toolCalls = message.toolCallList ?? message.toolCalls ?? [];
    const results = toolCalls.map((call) => ({
      toolCallId: call.id,
      result:
        call.function.name === "book_appointment"
          ? "Great, that's noted. In a real deployment this would already be on the calendar."
          : "Unknown tool.",
    }));
    return Response.json({ results });
  }

  if (message.type === "end-of-call-report") {
    const prospectId = message.call?.metadata?.prospectId;
    await sendAdminAlert(
      "Someone tried the AI receptionist demo",
      prospectId ? `Prospect ${prospectId} just finished a demo call.` : "A demo call just finished (no prospect id)."
    );
    return new Response("OK", { status: 200 });
  }

  return new Response("OK", { status: 200 });
}
