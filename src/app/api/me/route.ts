import { auth } from "@/lib/auth";

/* Tiny identity endpoint for the guarded course pages (dashboard.html etc):
   lets a static HTML page ask "who is currently signed in" without any
   course/entitlement logic attached, that's what /api/progress is for.
   Used to render a "Welcome back, {name}" card once a student is actually
   signed in, distinct from whether they're entitled to any given course. */
export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  return Response.json({
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  });
}
