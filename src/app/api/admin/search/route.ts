import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { searchAdmin } from "@/lib/admin-search";

/* Backs the global search box in the admin nav layout (Slice 7,
   2026-08-28). GET /api/admin/search?q=... — independently re-checks
   requireAdmin() here (matching every other admin API route's convention,
   e.g. service-requests/[id]/route.ts) even though searchAdmin() itself
   also checks it, since this is a new network-reachable entry point into
   client/proposal/task data. 404s for non-admins rather than 403, so the
   route's existence isn't confirmed to a non-admin caller. */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return new Response("not found", { status: 404 });

  const q = request.nextUrl.searchParams.get("q") || "";
  const results = await searchAdmin(q);
  return Response.json({ results });
}
