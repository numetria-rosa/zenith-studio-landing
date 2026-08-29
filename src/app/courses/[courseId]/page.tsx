import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCourse, getCheckoutUrl } from "@/lib/courses";
import { hasCourseAccess } from "@/lib/entitlements";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course || !course.published) return {};

  return {
    title: course.title,
    description: course.description,
    alternates: { canonical: `https://zenith-studio.site/courses/${course.id}` },
    openGraph: {
      type: "website",
      url: `https://zenith-studio.site/courses/${course.id}`,
      title: `${course.title} | Zenith Studio`,
      description: course.description,
    },
  };
}

/* Phase 17 error states live here: not logged in -> sign in; logged in but
   not entitled -> "you don't have access yet" + Get Access. If the visitor
   already owns the course, skip straight to the content instead of showing
   them a purchase pitch for something they already bought. */
export default async function CourseLandingPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course || !course.published) notFound();

  const session = await auth();
  if (session?.user?.id) {
    const owns = await hasCourseAccess(session.user.id, courseId);
    if (owns) redirect(`/courses/${course.id}/${course.firstLessonPath}`);
  }

  const { url: checkoutUrl, isRealCheckout } = getCheckoutUrl(course);

  return (
    <div className="min-h-screen bg-[#05060a] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <Link href="/lab" className="text-sm text-white/50 hover:text-white transition">
          ← Back to Zenith Lab
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">{course.title}</h1>
        <p className="mt-4 text-white/60 leading-7">{course.description}</p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left">
          <p className="text-sm text-white/70">
            {session?.user
              ? "You don't have access to this course yet."
              : "Sign in if you've already purchased, or get access below."}
          </p>
          {!isRealCheckout && (
            <p className="mt-2 text-xs text-amber-300/80">
              Checkout isn&apos;t live yet. This links to the waitlist instead.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={checkoutUrl}
            target={checkoutUrl.startsWith("mailto:") ? undefined : "_blank"}
            rel={checkoutUrl.startsWith("mailto:") ? undefined : "noopener noreferrer"}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden />
            Get access
          </a>
          {!session?.user && (
            <Link
              href={`/sign-in?callbackUrl=${encodeURIComponent(`/courses/${course.id}`)}`}
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              I already purchased. Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
