import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

/* Growth/Pro waitlist capture from the demo page's pricing section - see
   CLAUDE.md, these plans aren't launched yet. No auth required (public
   marketing page), so this is intentionally minimal: an email and which
   plan they want, nothing else collected. */
export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }
  const { email, plan } = (body ?? {}) as { email?: unknown; plan?: unknown };
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response("invalid email", { status: 400 });
  }
  const normalizedPlan = plan === "PRO" ? "PRO" : "GROWTH";
  await db.waWaitlistSignup.create({ data: { email: email.trim().toLowerCase(), plan: normalizedPlan } });
  return Response.json({ ok: true });
}
