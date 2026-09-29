import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { decideCourseAccess } from "@/lib/course-access";
import { getCachedAccess, setCachedAccess } from "@/lib/course-access-cache";
import { getCourse } from "@/lib/courses";
import { hasCourseAccess } from "@/lib/entitlements";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export type Enrollment = { userId: string; name: string | null; email: string | null };

/** The one entitlement checkpoint above every course-app page: signed in, and owns `courseId`.
    Redirects to sign-in or the course landing page otherwise. Swap the body to change how access
    is sold (Whop today, via CourseEntitlement); callers only ever see this signature. */
export async function requireEnrollment(courseId: string, callbackPath: string): Promise<Enrollment> {
  // Local visual tests only: skip auth. Never active in production builds.
  if (process.env.NODE_ENV !== "production" && process.env.AIE_DEV_USER) {
    return { userId: "dev-user", name: process.env.AIE_DEV_USER, email: null };
  }

  const course = getCourse(courseId);
  if (!course) notFound();

  const jar = await cookies();
  const sessionToken = jar.get(SESSION_COOKIE_NAME)?.value;
  const cached = sessionToken ? getCachedAccess(sessionToken, courseId) : null;
  let userId: string | null;
  let entitled: boolean;
  let name: string | null = null;
  let email: string | null = null;
  if (cached) {
    ({ userId, entitled } = cached);
  } else {
    const session = await auth();
    userId = session?.user?.id ?? null;
    name = session?.user?.name ?? null;
    email = session?.user?.email ?? null;
    entitled = userId ? await hasCourseAccess(userId, courseId) : false;
    if (sessionToken) setCachedAccess(sessionToken, courseId, userId, entitled);
  }

  const decision = decideCourseAccess({ coursePublished: course.published, userId, entitled });
  if (decision.action === "redirect-sign-in") redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackPath)}`);
  if (decision.action === "redirect-landing") redirect(`/lab/${courseId}`);
  if (decision.action !== "serve" || !userId) notFound();

  if (cached) {
    // The access cache doesn't carry display fields; fetch them for the sidebar footer.
    const session = await auth();
    name = session?.user?.name ?? null;
    email = session?.user?.email ?? null;
  }
  return { userId, name, email };
}
