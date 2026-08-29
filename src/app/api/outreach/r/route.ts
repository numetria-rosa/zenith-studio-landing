import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";
import { recordOutreachEvent } from "@/lib/outreach-admin";

const ALLOWED_HOSTS = new Set([
  "zenith-studio.site",
  "www.zenith-studio.site",
  "whop.com",
  "www.whop.com",
  "cal.com",
  "www.cal.com",
]);

function hostAllowed(target: URL, requestHost: string): boolean {
  if (ALLOWED_HOSTS.has(target.hostname)) return true;
  if (target.hostname === requestHost) return true;
  try {
    const site = new URL(getSiteUrl());
    if (target.hostname === site.hostname) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export async function GET(request: NextRequest) {
  const messageId = request.nextUrl.searchParams.get("m") || "";
  const raw = request.nextUrl.searchParams.get("u") || "";
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (!hostAllowed(target, request.nextUrl.hostname)) {
    return new Response("url not allowed", { status: 400 });
  }

  const message = await db.outreachMessage.findUnique({
    where: { id: messageId },
    select: { id: true, prospectId: true, clickedAt: true },
  });
  if (message) {
    await db.outreachMessage.update({
      where: { id: message.id },
      data: { clickedAt: message.clickedAt ?? new Date() },
    });
    await recordOutreachEvent(message.prospectId, "link_clicked", { href: target.toString() });
  }

  return Response.redirect(target, 302);
}
