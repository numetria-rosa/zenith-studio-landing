import { NextRequest } from "next/server";
import { unsubscribeByToken } from "@/lib/outreach-admin";

/** One-click List-Unsubscribe (RFC 8058). */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const result = await unsubscribeByToken(token);
  if (!result.ok) return new Response("invalid", { status: 400 });
  return new Response("unsubscribed", { status: 200 });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  return Response.redirect(new URL(`/unsubscribe?token=${encodeURIComponent(token)}`, request.nextUrl.origin));
}
