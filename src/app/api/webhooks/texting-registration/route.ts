import type { NextRequest } from "next/server";
import { advanceTextingRegistration, verifyCallbackToken } from "@/lib/texting-registration";

/* SignalWire 10DLC status callback (brand/campaign/number events). SignalWire
   doesn't sign these, so the URL carries an HMAC of the project id, and the
   payload is only used as a hint: advanceTextingRegistration re-reads the
   real state from SignalWire's API before changing anything. */
export async function POST(request: NextRequest): Promise<Response> {
  const projectId = request.nextUrl.searchParams.get("p") ?? "";
  const token = request.nextUrl.searchParams.get("t") ?? "";
  if (!projectId || !verifyCallbackToken(projectId, token)) return new Response("forbidden", { status: 403 });
  let eventType: string | undefined;
  try {
    const body = (await request.json()) as { event_type?: unknown };
    if (typeof body.event_type === "string") eventType = body.event_type;
  } catch {
    // empty or non-JSON body: fall back to polling the real state
  }
  const status = await advanceTextingRegistration(projectId, eventType);
  return Response.json({ status });
}
