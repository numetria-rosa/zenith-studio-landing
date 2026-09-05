import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { auth } from "@/lib/auth";
import { decideCourseAccess } from "@/lib/course-access";
import { getCachedAccess, setCachedAccess } from "@/lib/course-access-cache";
import { getCourse } from "@/lib/courses";
import { hasCourseAccess } from "@/lib/entitlements";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import "katex/dist/katex.min.css";

// Same type family as the 4 static courses (zenith-lab.css), loaded via
// next/font instead of a Google Fonts <link> tag now that this is real React.
const fraunces = Fraunces({ variable: "--font-course-serif", subsets: ["latin"] });
const plexSans = IBM_Plex_Sans({ variable: "--font-course-sans", weight: ["400", "500", "600", "700"], subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-course-mono", weight: ["400", "500", "600"], subsets: ["latin"] });

/* The "react" render mode's equivalent of the guard in
   src/app/courses/[courseId]/[...path]/route.ts - one checkpoint above every
   lesson page instead of re-checking per page. Reuses decideCourseAccess()
   and the same 20s session-access cache verbatim; only the serving mechanism
   below this point (real React pages vs. reading a file off disk) differs. */
export default async function LearnLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course || course.renderMode !== "react") notFound();

  const jar = await cookies();
  const sessionToken = jar.get(SESSION_COOKIE_NAME)?.value;
  const cached = sessionToken ? getCachedAccess(sessionToken, courseId) : null;
  let userId: string | null;
  let entitled: boolean;
  if (cached) {
    ({ userId, entitled } = cached);
  } else {
    const session = await auth();
    userId = session?.user?.id ?? null;
    entitled = userId ? await hasCourseAccess(userId, courseId) : false;
    if (sessionToken) setCachedAccess(sessionToken, courseId, userId, entitled);
  }

  const decision = decideCourseAccess({ coursePublished: course.published, userId, entitled });
  if (decision.action === "redirect-sign-in") {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/lab/${courseId}/learn`)}`);
  }
  if (decision.action === "redirect-landing") {
    redirect(`/lab/${courseId}`);
  }
  if (decision.action !== "serve") {
    notFound();
  }

  return (
    <div className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} font-[family-name:var(--font-course-sans)]`}>
      {children}
    </div>
  );
}
