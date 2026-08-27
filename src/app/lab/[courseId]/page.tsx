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
  Lock,
} from "lucide-react";
import { fraunces, courseFontVars } from "@/lib/fonts";
import { getCourse, getCheckoutUrl } from "@/lib/courses";
import { courses } from "../courses-data";
import { CurriculumAccordion } from "./CurriculumAccordion";

const SITE_URL = "https://zenith-studio.site";

const WAITLIST_LINK =
  "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20%0A%0AWhat%20I%20want%20to%20be%20able%20to%20do%20after%20the%20course%3A%20%0A";

const DEFAULT_ACCENT = { bg: "#f0b429", text: "#1a1200" };

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

  const accent = course.labBadgeColor ?? DEFAULT_ACCENT;

  const deadlineLabel = course.discountDeadline
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(
        new Date(course.discountDeadline)
      )
    : null;

  // The sidebar's jump-nav only lists sections this course actually has data
  // for — never a link to an empty section.
  const navItems: { href: string; label: string }[] = [
    { href: "#overview", label: "Overview" },
    ...(course.curriculum && course.curriculum.length > 0 ? [{ href: "#curriculum", label: "Curriculum" }] : []),
    ...(course.practiceBreakdown && course.practiceBreakdown.length > 0
      ? [{ href: "#practice", label: "Practice tasks" }]
      : []),
    { href: "#whatyoudo", label: "What you'll do" },
    ...(course.projectSamples && course.projectSamples.length > 0
      ? [{ href: "#projects", label: "Portfolio projects" }]
      : []),
    ...(course.topics.length > 0 ? [{ href: "#topics", label: "Tools & topics" }] : []),
    ...(course.includes && course.includes.length > 0 ? [{ href: "#included", label: "What's included" }] : []),
    ...(course.facts.length > 0 ? [{ href: "#whyitmatters", label: "Why it matters" }] : []),
    { href: "#career", label: "Career path" },
  ];

  return (
    <div
      className={`${courseFontVars} min-h-screen`}
      style={
        {
          "--bg": "#0d0f14",
          "--bg2": "#0a0c10",
          "--card": "#151920",
          "--card2": "#191d26",
          "--bd": "#232838",
          "--bd2": "#333a4c",
          "--tx": "#eeeee7",
          "--mut": "#9aa0ae",
          "--mut2": "#676e7d",
          "--accent": accent.bg,
          "--accentd": accent.text,
          "--info": "#5fc2e8",
          background: "var(--bg)",
          color: "var(--tx)",
          fontFamily: "var(--font-course-sans), sans-serif",
        } as React.CSSProperties
      }
    >
      <div
        className="sticky top-0 z-40 border-b-[3px]"
        style={{
          background: "rgba(13,15,20,.92)",
          backdropFilter: "blur(10px)",
          borderColor: "var(--accent)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-7">
          <span
            className={`${fraunces.className} inline-flex items-center text-base font-extrabold tracking-tight`}
            style={{ fontFamily: "var(--font-course-serif), serif" }}
          >
            ZENITH
            <span
              className="ml-1 inline-flex items-center rounded-[3px] px-1.5 py-0.5 text-[11px] leading-none"
              style={{ background: "var(--accent)", color: "var(--accentd)" }}
            >
              LAB
            </span>
          </span>
          <a
            href={checkoutUrl}
            target={isRealCheckout ? "_blank" : undefined}
            rel={isRealCheckout ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition hover:scale-[1.02]"
            style={{ background: "var(--accent)", color: "var(--accentd)" }}
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

      <div className="border-b" style={{ background: "var(--bg2)", borderColor: "var(--bd)" }}>
        <div className="mx-auto max-w-6xl px-5 py-2.5 text-[12.5px] sm:px-7">
          <Link
            href="/lab"
            className="inline-flex items-center gap-1.5 transition"
            style={{ color: "var(--mut)", fontFamily: "var(--font-course-mono), monospace" }}
          >
            <ArrowLeft className="h-3 w-3" aria-hidden />
            Zenith Lab
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-7 lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-12">
        {/* Sidebar: section nav + sticky price/purchase card */}
        <aside className="order-2 mb-10 lg:sticky lg:top-24 lg:mb-0 lg:self-start">
          <nav
            className="rounded-2xl border p-2"
            style={{ borderColor: "var(--bd)", background: "var(--card)" }}
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm transition"
                style={{ color: "var(--mut)" }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div
            className="mt-4 rounded-2xl border p-5"
            style={{ borderColor: "var(--bd)", background: "var(--card)" }}
          >
            {course.price ? (
              <>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span
                    className={`${fraunces.className} text-3xl font-bold`}
                    style={{ fontFamily: "var(--font-course-serif), serif", color: "var(--accent)" }}
                  >
                    {course.price}
                  </span>
                  {course.originalPrice && (
                    <span
                      className="text-sm line-through"
                      style={{ color: "var(--mut2)", fontFamily: "var(--font-course-mono), monospace" }}
                    >
                      {course.originalPrice}
                    </span>
                  )}
                </div>
                {course.discountPercent && (
                  <div
                    className="mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
                    style={{
                      borderColor: "var(--accent)",
                      color: "var(--accent)",
                      background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                      fontFamily: "var(--font-course-mono), monospace",
                    }}
                  >
                    {course.discountPercent}% off{deadlineLabel ? ` until ${deadlineLabel}` : ""}
                  </div>
                )}
                <div className="mt-1.5 text-xs" style={{ color: "var(--mut)" }}>
                  one-time payment
                </div>
              </>
            ) : (
              <div className="text-sm" style={{ color: "var(--mut2)" }}>
                Price to be announced
              </div>
            )}

            <a
              href={checkoutUrl}
              target={isRealCheckout ? "_blank" : undefined}
              rel={isRealCheckout ? "noopener noreferrer" : undefined}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-sm font-semibold transition hover:scale-[1.02]"
              style={{ background: "var(--accent)", color: "var(--accentd)" }}
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

            <div className="mt-5 space-y-2.5 border-t pt-4" style={{ borderColor: "var(--bd)" }}>
              <SidebarStat icon={Layers} label={course.level} />
              <SidebarStat
                icon={Clock}
                label={course.weeklyTime ? `${course.duration} · ${course.weeklyTime}` : course.duration}
              />
              {typeof course.practiceTasks === "number" && (
                <SidebarStat icon={ListChecks} label={`${course.practiceTasks} practice tasks`} strong />
              )}
              {typeof course.portfolioProjects === "number" && (
                <SidebarStat icon={FolderKanban} label={`${course.portfolioProjects} portfolio projects`} strong />
              )}
              {course.hasCapstone && <SidebarStat icon={Trophy} label="Full capstone project" />}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="order-1 min-w-0">
          <div id="overview" className="flex flex-wrap items-center gap-3 scroll-mt-24">
            <span
              className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
              style={{ borderColor: "var(--bd2)", color: "var(--mut)" }}
            >
              {course.categoryLabel}
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: course.available ? "var(--accent)" : "var(--mut2)" }}
            >
              {course.available ? "Self-paced course" : "Coming soon"}
            </span>
          </div>

          <h1
            className={`${fraunces.className} mt-5 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl`}
            style={{ fontFamily: "var(--font-course-serif), serif" }}
          >
            {course.name}
          </h1>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-8" style={{ color: "var(--mut)" }}>
            {course.summary}
          </p>

          {/* Full curriculum */}
          {course.curriculum && course.curriculum.length > 0 && (
            <Section id="curriculum" eyebrow="Full curriculum" title={`${course.curriculum.length} modules, in order`}>
              <CurriculumAccordion modules={course.curriculum} />
            </Section>
          )}

          {/* Practice task breakdown */}
          {course.practiceBreakdown && course.practiceBreakdown.length > 0 && (
            <Section id="practice" eyebrow="Practice tasks by tool" title={`${course.practiceTasks} tasks, broken down`}>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {course.practiceBreakdown.map(({ tool, tasks }) => {
                  const max = Math.max(...course.practiceBreakdown!.map((t) => t.tasks));
                  return (
                    <div
                      key={tool}
                      className="rounded-xl border px-4 py-3"
                      style={{ borderColor: "var(--bd)", background: "var(--card)" }}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-semibold">{tool}</span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--accent)", fontFamily: "var(--font-course-mono), monospace" }}
                        >
                          {tasks} tasks
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--bg2)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(tasks / max) * 100}%`, background: "var(--accent)" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* What you'll do */}
          <Section id="whatyoudo" eyebrow="What you'll actually do">
            <ul className="grid gap-3 sm:grid-cols-2">
              {course.whatYoullDo.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-6" style={{ color: "var(--tx)" }}>
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "var(--accent)" }} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          {/* Project samples */}
          {course.projectSamples && course.projectSamples.length > 0 && (
            <Section id="projects" eyebrow="Portfolio projects you'll build" title={`${course.projectSamples.length} real projects`}>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {course.projectSamples.map(({ title, tag }, i) => {
                  const locked = i >= Math.ceil(course.projectSamples!.length / 2);
                  return (
                    <div
                      key={title}
                      className="relative overflow-hidden rounded-xl border px-4 py-3"
                      style={{ borderColor: "var(--bd)", background: "var(--card)" }}
                    >
                      <div style={locked ? { filter: "blur(6px)", userSelect: "none" } : undefined}>
                        <div
                          className={`${fraunces.className} text-[15px] font-semibold`}
                          style={{ fontFamily: "var(--font-course-serif), serif" }}
                        >
                          {title}
                        </div>
                        <div
                          className="mt-1 text-xs"
                          style={{ color: "var(--mut2)", fontFamily: "var(--font-course-mono), monospace" }}
                        >
                          {tag}
                        </div>
                      </div>
                      {locked && (
                        <div
                          className="absolute inset-0 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
                          style={{ background: "color-mix(in srgb, var(--card) 55%, transparent)", color: "var(--accent)" }}
                        >
                          <Lock className="h-3.5 w-3.5" aria-hidden />
                          Unlock in the course
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Topics */}
          {course.topics.length > 0 && (
            <Section id="topics" eyebrow="Tools and topics covered">
              <div className="flex flex-wrap gap-2">
                {course.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border px-3.5 py-1.5 text-sm"
                    style={{ borderColor: "var(--bd)", background: "var(--card)", color: "var(--tx)" }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* What's included */}
          {course.includes && course.includes.length > 0 && (
            <Section id="included" eyebrow="What's actually included">
              <ul className="grid gap-3 sm:grid-cols-2">
                {course.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-6" style={{ color: "var(--tx)" }}>
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "var(--accent)" }} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Real-world facts */}
          {course.facts.length > 0 && (
            <Section id="whyitmatters" eyebrow="Why it matters">
              <div className="grid gap-3 sm:grid-cols-2">
                {course.facts.map((fact) => (
                  <div
                    key={fact}
                    className="flex items-start gap-2.5 rounded-xl border px-4 py-3.5"
                    style={{ borderColor: "rgba(95,194,232,0.18)", background: "rgba(95,194,232,0.05)" }}
                  >
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--info)" }} aria-hidden />
                    <p className="text-sm leading-6" style={{ color: "var(--tx)" }}>
                      {fact}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Career path */}
          <div id="career" className="mt-14 scroll-mt-24">
            <div
              className="rounded-2xl border-l-2 px-6 py-6"
              style={{ borderColor: "var(--accent)", background: "color-mix(in srgb, var(--accent) 6%, transparent)" }}
            >
              <div
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]"
                style={{ color: "var(--accent)", fontFamily: "var(--font-course-mono), monospace" }}
              >
                <Briefcase className="h-3.5 w-3.5" aria-hidden />
                Career Path Edition
              </div>
              <p className="mt-3 text-base leading-7" style={{ color: "var(--tx)" }}>
                {course.careerPath}
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div
            className="mt-14 flex flex-col gap-4 border-t pt-10 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: "var(--bd)" }}
          >
            <p className="text-sm" style={{ color: "var(--mut)" }}>
              {isRealCheckout
                ? "Ready to start? Self-paced, start whenever you are."
                : "Not open for enrollment yet — join the waitlist."}
            </p>
            <a
              href={checkoutUrl}
              target={isRealCheckout ? "_blank" : undefined}
              rel={isRealCheckout ? "noopener noreferrer" : undefined}
              className="inline-flex items-center justify-center gap-1.5 rounded-full px-7 py-3.5 text-sm font-semibold transition hover:scale-[1.02]"
              style={{ background: "var(--accent)", color: "var(--accentd)" }}
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

          <footer
            className="mt-16 pt-8 text-center text-[13px]"
            style={{ borderTop: "1px solid var(--bd)", color: "var(--mut2)", fontFamily: "var(--font-course-mono), monospace" }}
          >
            Zenith Lab · {course.name}
          </footer>
        </main>
      </div>
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-14 scroll-mt-24">
      <div
        className="text-xs uppercase tracking-[0.3em]"
        style={{ color: "var(--accent)", fontFamily: "var(--font-course-mono), monospace" }}
      >
        {eyebrow}
      </div>
      {title && (
        <h2
          className={`${fraunces.className} mt-3 text-2xl font-semibold tracking-[-0.02em]`}
          style={{ fontFamily: "var(--font-course-serif), serif" }}
        >
          {title}
        </h2>
      )}
      <div className={title ? "mt-6" : "mt-5"}>{children}</div>
    </section>
  );
}

function SidebarStat({ icon: Icon, label, strong }: { icon: typeof Clock; label: string; strong?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm" style={{ color: strong ? "var(--accent)" : "var(--mut)" }}>
      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden />
      {label}
    </div>
  );
}
