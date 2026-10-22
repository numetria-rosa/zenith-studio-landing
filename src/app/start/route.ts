import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserEntitlements } from "@/lib/entitlements";
import { landingDestination, loadOwnedServices } from "@/lib/account/services";

/* Where sign-in sends people by default: clients to their services, students to their courses
   (see landingDestination). */
export async function GET(request: Request) {
  const session = await auth();
  const origin = new URL(request.url).origin;
  if (!session?.user?.id) return NextResponse.redirect(new URL("/sign-in", origin));
  const [services, courses] = await Promise.all([loadOwnedServices(session.user.id), getUserEntitlements(session.user.id)]);
  return NextResponse.redirect(new URL(landingDestination({ services, courseCount: courses.length }), origin));
}
