import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { updateServiceRequestAsAdmin } from "@/lib/service-requests-admin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return new Response("not found", { status: 404 }); // don't confirm the route exists to non-admins

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("invalid JSON", { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return new Response("expected an object", { status: 400 });
  }
  const { status, adminNote } = body as { status?: unknown; adminNote?: unknown };
  if (status !== undefined && typeof status !== "string") return new Response("status must be a string", { status: 400 });
  if (adminNote !== undefined && typeof adminNote !== "string") return new Response("adminNote must be a string", { status: 400 });

  const result = await updateServiceRequestAsAdmin(id, {
    status: status as string | undefined,
    adminNote: adminNote as string | undefined,
  });
  if (!result.ok) return new Response(result.error, { status: 422 });

  return new Response("OK", { status: 200 });
}
