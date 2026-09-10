import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  verifyVapiSecret,
  buildAssistantPayload,
  lookupReceptionistByPhoneNumberId,
  runBookAppointment,
  recordCallEndMetrics,
} from "@/lib/vapi";
import { sendAdminAlert } from "@/lib/outreach-mail";
import { recordUsageCost, ESTIMATED_COST_CENTS } from "@/lib/usage-costs";
import { isProjectPaused } from "@/lib/project-pause";

/* Vapi → Zenith webhook. One server URL handles every event in a call's
   lifecycle, discriminated by message.type. Verify the shared secret
   (x-vapi-secret) matching what's configured on the Vapi assistant/phone
   number. See src/lib/vapi.ts for the receptionist runtime logic itself,
   this route only verifies, dedupes, and dispatches. */

type VapiToolCall = { id: string; function: { name: string; arguments: unknown } };
type VapiMessage = {
  type: string;
  call?: { id?: string; phoneNumberId?: string; metadata?: { projectId?: string } };
  phoneNumberId?: string;
  toolCallList?: VapiToolCall[];
  toolCalls?: VapiToolCall[];
  endedReason?: string;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  cost?: number; // Vapi's real per-call cost in USD, when present in the payload
};

function parseArguments(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!verifyVapiSecret(request.headers.get("x-vapi-secret"))) {
    return new Response("invalid signature", { status: 400 });
  }

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

  if (message.type === "assistant-request") {
    const phoneNumberId = message.call?.phoneNumberId ?? message.phoneNumberId;
    if (!phoneNumberId) return new Response("missing phoneNumberId", { status: 400 });

    const receptionist = await lookupReceptionistByPhoneNumberId(phoneNumberId);
    if (!receptionist || (await isProjectPaused(receptionist.projectId))) {
      // Same response whether unconfigured or paused, both fall through to
      // whatever Fallback Destination is set on the Vapi number.
      console.error(`[vapi webhook] no active receptionist for phone number ${phoneNumberId}`);
      return new Response("no assistant configured for this number", { status: 404 });
    }

    return Response.json({ assistant: buildAssistantPayload(receptionist.projectId, receptionist.config) });
  }

  if (message.type === "tool-calls") {
    const projectId = message.call?.metadata?.projectId;
    const toolCalls = message.toolCallList ?? message.toolCalls ?? [];
    if (!projectId) return new Response("missing call metadata.projectId", { status: 400 });
    if (await isProjectPaused(projectId)) {
      return Response.json({
        results: toolCalls.map((call) => ({ toolCallId: call.id, result: "This service is temporarily unavailable." })),
      });
    }

    const results = await Promise.all(
      toolCalls.map(async (call) => {
        if (call.function.name !== "book_appointment") {
          return { toolCallId: call.id, result: "Unknown tool." };
        }
        const outcome = await runBookAppointment(projectId, parseArguments(call.function.arguments));
        return { toolCallId: call.id, result: outcome.message };
      })
    );

    return Response.json({ results });
  }

  if (message.type === "end-of-call-report") {
    const callId = message.call?.id;
    const projectId = message.call?.metadata?.projectId;
    if (!callId || !projectId) return new Response("missing call id or metadata.projectId", { status: 400 });

    const eventId = `vapi:${callId}:end-of-call-report`;
    let duration = message.durationSeconds ?? 0;
    if (!duration && message.startedAt && message.endedAt) {
      duration = Math.max(0, (new Date(message.endedAt).getTime() - new Date(message.startedAt).getTime()) / 1000);
    }
    const escalated = message.endedReason === "assistant-forwarded-call" || message.endedReason === "customer-did-not-answer";

    try {
      await db.$transaction(async (tx) => {
        await tx.webhookEvent.create({
          data: { id: eventId, type: `vapi.${message.type}`, payload: body as unknown as Prisma.InputJsonValue },
        });
        await recordCallEndMetrics(projectId, duration, escalated);
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return new Response("OK", { status: 200 });
      }
      console.error("[vapi webhook] end-of-call processing failed:", err);
      return new Response("processing failed", { status: 500 });
    }

    if (escalated) {
      await sendAdminAlert(
        "Receptionist call needs attention",
        `A call on project ${projectId} ended with reason "${message.endedReason}" and may need follow-up.`
      );
    }

    // Real cost when Vapi includes one, otherwise a duration-based
    // estimate, see usage-costs.ts for why neither is exact accounting.
    const costCents =
      typeof message.cost === "number" && message.cost > 0
        ? Math.round(message.cost * 100)
        : Math.round((duration / 60) * ESTIMATED_COST_CENTS.VAPI_PER_MINUTE_FALLBACK);
    await recordUsageCost(projectId, costCents, "vapi call");

    return new Response("OK", { status: 200 });
  }

  return new Response("OK", { status: 200 });
}
