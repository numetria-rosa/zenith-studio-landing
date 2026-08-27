import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Check,
  Sparkles,
  Briefcase,
  Layers,
  Clock,
  ListChecks,
  FolderKanban,
  Trophy,
  ArrowLeft,
  ShoppingCart,
} from "lucide-react";
import { GlowBackdrop } from "@/components/GlowBackdrop";
import { getCourse, getCheckoutUrl } from "@/lib/courses";
import { courses } from "../courses-data";

const SITE_URL = "https://zenith-studio.site";

const WAITLIST_LINK =
  "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20%0A%0AWhat%20I%20want%20to%20be%20able%20to%20do%20after%20the%20course%3A%20%0A";

function findCourse(courseId: string) {
  return courses.find((c) => c.id === courseId);
}

export function generateStaticParams() {
  return courses.map((c) => ({ courseId: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const course = findCourse(courseId);
  if (!course) return {};

  return {
    title: `${course.name} — Course Details | Zenith Lab`,
    description: course.summary,
    alternates: { canonical: `${SITE_URL}/lab/${course.id}` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/lab/${course.id}`,
      title: `${course.name} | Zenith Lab`,
      description: course.summary,
    },
  };
}

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = findCourse(courseId);
  if (!course) notFound();

  const catalogCourse = getCourse(course.id);
  const { url: checkoutUrl, isRealCheckout } = catalogCourse
    ? getCheckoutUrl(catalogCourse)
    : { url: WAITLIST_LINK, isRealCheckout: false };

  const deadlineLabel = course.discountDeadline
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(
        new Date(course.discountDeadline)
      )
    : null;

  return (
    <div className="min-h-screen bg-[#05060a] text-white overflow-x-hidden">
      <GlowBackdrop />

      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-10 pt-4">
        <div className="mx-auto max-w-4xl rounded-full border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center justify-between px-5 sm:px-7 py-4">
            <Link href="/lab" className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Back to Zenith Lab
            </Link>
            <a
              href={checkoutUrl}
              target={isRealCheckout ? "_blank" : undefined}
              rel={isRealCheckout ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              {isRealCheckout ? (
                <>
                  <ShoppingCart className="h-4 w-4" aria-hidden />
                  Get access
                </>
              ) : (
                "Join the waitlist"
              )}
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-14 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/55">
            {course.categoryLabel}
          </span>
          <span
            className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
              course.available ? "text-emerald-200" : "text-white/40"
            }`}
          >
            {course.available ? "Self-paced course" : "Coming soon"}
          </span>
        </div>

        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{course.name}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">{course.summary}</p>

        {/* Stats row */}
        <div className="mt-7 flex flex-wrap gap-2.5">
          <StatChip icon={Layers} label={course.level} />
          <StatChip
            icon={Clock}
            label={course.weeklyTime ? `${course.duration} · ${course.weeklyTime}` : course.duration}
          />
          {typeof course.practiceTasks === "number" && (
            <StatChip icon={ListChecks} label={`${course.practiceTasks} practice tasks`} strong />
          )}
          {typeof course.portfolioProjects === "number" && (
            <StatChip icon={FolderKanban} label={`${course.portfolioProjects} portfolio projects`} strong />
          )}
          {course.hasCapstone && <StatChip icon={Trophy} label="Full capstone project" />}
        </div>

        {/* Price */}
        <div className="mt-9 flex flex-wrap items-baseline gap-3 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-5">
          {course.price ? (
            <>
              <span className="text-3xl font-semibold tracking-[-0.04em]">{course.price}</span>
              {course.originalPrice && course.discountPercent && (
                <>
                  <span className="text-base text-white/40 line-through">{course.originalPrice}</span>
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                    {course.discountPercent}% off{deadlineLabel ? ` until ${deadlineLabel}` : ""}
                  </span>
                </>
              )}
              <span className="text-sm text-white/50">one-time payment</span>
            </>
          ) : (
            <span className="text-sm text-white/45">Price to be announced</span>
          )}
        </div>

        {/* Full curriculum */}
        {course.curriculum && course.curriculum.length > 0 && (
          <section className="mt-14">
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Full curriculum</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
              {course.curriculum.length} modules, in order
            </h2>
            <ol className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {course.curriculum.map((title, i) => (
                <li
                  key={title}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-xs font-bold text-emerald-200">
                    {i}
                  </span>
                  <span className="text-sm text-white/80">{title}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* What you'll do — full list */}
        <section className="mt-14">
          <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">What you&apos;ll actually do</div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {course.whatYoullDo.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/75">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Topics */}
        {course.topics.length > 0 && (
          <section className="mt-14">
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Tools and topics covered</div>
            <div className="mt-5 flex flex-wrap gap-2">
              {course.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm text-white/70"
                >
                  {topic}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Real-world facts */}
        {course.facts.length > 0 && (
          <section className="mt-14">
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Why it matters</div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {course.facts.map((fact) => (
                <div
                  key={fact}
                  className="flex items-start gap-2.5 rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.05] px-4 py-3.5"
                >
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cyan-300" aria-hidden />
                  <p className="text-sm leading-6 text-white/75">{fact}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Career path */}
        <section className="mt-14">
          <div className="rounded-3xl border-l-2 border-emerald-300/60 bg-emerald-400/[0.05] px-6 py-6">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-emerald-200/80">
              <Briefcase className="h-3.5 w-3.5" aria-hidden />
              Career Path Edition
            </div>
            <p className="mt-3 text-base leading-7 text-white/75">{course.careerPath}</p>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/50">
            {isRealCheckout ? "Ready to start? Self-paced, start whenever you are." : "Not open for enrollment yet — join the waitlist."}
          </p>
          <a
            href={checkoutUrl}
            target={isRealCheckout ? "_blank" : undefined}
            rel={isRealCheckout ? "noopener noreferrer" : undefined}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            {isRealCheckout ? (
              <>
                <ShoppingCart className="h-4 w-4" aria-hidden />
                Get access
              </>
            ) : (
              "Join the waitlist"
            )}
          </a>
        </div>
      </main>
    </div>
  );
}

function StatChip({ icon: Icon, label, strong }: { icon: typeof Clock; label: string; strong?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm ${
        strong
          ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
          : "border-white/10 bg-white/[0.03] text-white/65"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </span>
  );
}
