import type { Metadata } from "next";
import Link from "next/link";
import { Hammer, Briefcase, Rocket } from "lucide-react";
import { GlowBackdrop } from "@/components/GlowBackdrop";
import { fraunces } from "@/lib/fonts";
import { getCourse, getCheckoutUrl } from "@/lib/courses";
import { CourseCatalog } from "./CourseCatalog";
import { courses } from "./courses-data";

const SITE_URL = "https://zenith-studio.site";

const WAITLIST_LINK =
  "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20%0A%0AWhat%20I%20want%20to%20be%20able%20to%20do%20after%20the%20course%3A%20%0A";

export const metadata: Metadata = {
  title: "Zenith Lab | Hands-On Courses in Data, AI, and Automation",
  description:
    "Practice-driven courses in data analysis, AI engineering, and automation. Every course includes a Career Path Edition, so you learn the skill and know exactly how to apply it.",
  keywords: [
    "AI engineering course",
    "automation engineering course",
    "learn AI automation",
    "AI engineer career path",
    "data science course with portfolio",
    "web3 engineering course",
    "career change into AI",
  ],
  alternates: { canonical: `${SITE_URL}/lab` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/lab`,
    siteName: "Zenith Studio",
    title: "Zenith Lab | Hands-On Courses in Data, AI, and Automation",
    description: "Learn by building. Practice until you can do it on your own.",
  },
};

export default function ZenithLabPage() {
  const checkoutInfo = Object.fromEntries(
    courses.map((course) => {
      const catalogCourse = getCourse(course.id);
      return [
        course.id,
        catalogCourse ? getCheckoutUrl(catalogCourse) : { url: WAITLIST_LINK, isRealCheckout: false },
      ];
    })
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": courses.map((course) => ({
      "@type": "Course",
      "@id": `${SITE_URL}/lab#${course.id}`,
      name: `${course.name} (Zenith Lab)`,
      description: course.summary,
      url: `${SITE_URL}/lab#${course.id}`,
      provider: {
        "@type": "Organization",
        name: "Zenith Studio",
        url: SITE_URL,
      },
      ...(course.price
        ? {
            offers: {
              "@type": "Offer",
              price: course.price.replace("$", ""),
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              url: `${SITE_URL}/lab#${course.id}`,
            },
          }
        : {}),
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: "P4W",
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#05060a] text-white overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <GlowBackdrop />

      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-10 pt-4">
        <div className="mx-auto max-w-7xl rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(52,211,153,0.10)]">
          <div className="flex items-center justify-between px-5 sm:px-7 py-4">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/icon.webp"
                alt="Zenith Studio"
                className="h-9 w-9 rounded-2xl shadow-[0_0_30px_rgba(110,95,255,0.55)]"
              />
              <span className={`${fraunces.className} inline-flex items-center text-lg font-bold tracking-tight`}>
                ZENITH
                <span className="ml-1 inline-flex items-center rounded-[4px] bg-gradient-to-r from-violet-500 to-blue-400 px-1.5 py-0.5 text-sm leading-none text-white">
                  LAB
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
              <a href="#catalog" className="transition-colors hover:text-white">Courses</a>
              <a href="#career-path" className="transition-colors hover:text-white">Career Path</a>
              <Link href="/" className="transition-colors hover:text-white">Studio</Link>
            </nav>

            <a
              href="#catalog"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Browse courses
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 sm:px-6 lg:px-10">
        <section className="mx-auto grid max-w-7xl items-center gap-12 pb-20 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20 min-h-[calc(100vh-110px)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-emerald-200/90 backdrop-blur-xl">
              Zenith Lab · Courses
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-8xl">
              Learn by building.
              <br />
              <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                Practice until it&apos;s real.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">
              Hands-on courses from the team behind VoyAI and SmartRevise. Every course
              ends with a <span className="text-white/90">Career Path Edition</span>, so
              you do not just learn the skill, you know exactly where to apply it.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="#catalog"
                className="rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Browse the courses
              </a>
              <a
                href="#data-science"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-center text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
              >
                See Data Science &amp; Analysis
              </a>
            </div>

            <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
              {[
                ["4", "courses"],
                ["315", "practice tasks in Data Science"],
                ["10", "portfolio projects"],
                ["100%", "career path in every course"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-2xl font-semibold tracking-[-0.03em] text-white">{value}</dd>
                  <div className="mt-1 text-xs leading-5 text-white/50">{label}</div>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative min-h-[520px] lg:min-h-[680px]">
            <div className="absolute inset-x-10 top-10 h-56 rounded-full bg-teal-500/20 blur-[110px]" />
            <div className="absolute right-6 top-6 h-56 w-56 rounded-full bg-emerald-400/20 blur-[95px]" />
            <div className="absolute left-8 bottom-16 h-52 w-52 rounded-full bg-cyan-500/20 blur-[100px]" />

            <div className="absolute inset-0 flex items-center justify-center -translate-y-14 lg:-translate-y-24">
              <img
                src="/lab-capsule.webp"
                alt="Zenith Lab"
                className="pointer-events-none select-none drop-shadow-[0_40px_120px_rgba(0,0,0,0.7)] w-[420px] lg:w-[520px]"
                style={{ animation: "zenithFloat 3.2s ease-in-out infinite" }}
              />
            </div>

            <div className="absolute bottom-[30%] left-[0%] rounded-[28px] border border-white/12 bg-white/[0.04] px-4 py-4 backdrop-blur-2xl shadow-[0_0_40px_rgba(52,211,153,0.12)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">Built for</div>
              <div className="mt-2 text-sm font-medium text-white/85">No prior experience needed</div>
            </div>

            <div className="absolute right-[2%] bottom-[30%] rounded-[26px] border border-white/12 bg-white/[0.05] px-4 py-4 backdrop-blur-2xl shadow-[0_0_30px_rgba(94,234,212,0.12)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">Core outcome</div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">A real portfolio</div>
              <div className="text-sm text-white/55">Not another certificate.</div>
            </div>

            <style>{`
              @keyframes zenithFloat {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-14px); }
                100% { transform: translateY(0px); }
              }
            `}</style>
          </div>
        </section>

        <section id="career-path" className="mx-auto max-w-7xl border-t border-white/10 py-14">
          <div className="mb-10 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">The difference</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Most courses teach syntax and stop
            </h2>
            <p className="mt-4 leading-7 text-white/62">
              You finish, you can follow along with the tutorial, and you still have no idea how to turn
              it into income. Every Zenith Lab course fixes that with a section built around getting paid.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: Hammer, title: "Build something real", text: "You ship a working system, not a folder of exercise files. It becomes the thing you demo when someone asks what you can do." },
              { icon: Briefcase, title: "Career Path Edition", text: "Where the work is, how to find it, what to charge, and how to talk about it. The part almost every course leaves out." },
              { icon: Rocket, title: "Taught from live products", text: "The material comes out of systems that are actually running and actually sold, not from a syllabus written in a vacuum." },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.06]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300/30 via-teal-500/25 to-cyan-500/30 shadow-[0_0_30px_rgba(52,211,153,0.16)]">
                  <Icon className="h-5 w-5 text-emerald-100" aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2.5 text-sm leading-7 text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="catalog" className="mx-auto max-w-7xl border-t border-white/10 py-14">
          <div className="mb-10 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">The catalog</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Four courses, built in order
            </h2>
            <p className="mt-4 leading-7 text-white/62">
              Data Science &amp; Analysis and AI Engineering are open now, self-paced,
              start whenever you&apos;re ready. Automation Engineering and Web3 Engineering
              are in development, join the waitlist to hear when they open.
            </p>
          </div>

          <CourseCatalog courses={courses} checkoutInfo={checkoutInfo} waitlistLink={WAITLIST_LINK} />
        </section>

        <section className="mx-auto max-w-7xl border-t border-white/10 py-14 pb-24">
          <div className="overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-2xl sm:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Get started</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Pick a course and start building
              </h2>
              <p className="mt-4 leading-7 text-white/62">
                Data Science &amp; Analysis and AI Engineering are open for enrollment now.
                For Automation Engineering or Web3 Engineering, join the waitlist and
                we&apos;ll let you know the moment they open.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <a
                  href="#catalog"
                  className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                >
                  Browse the courses
                </a>
                <Link
                  href="/"
                  className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
                >
                  Back to Zenith Studio
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/8 px-4 py-8 text-sm text-white/42 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>© 2026 Zenith Studio. Zenith Lab is the learning division.</div>
          <div className="flex gap-5">
            <Link href="/" className="hover:text-white/70">Studio</Link>
            <a href="#catalog" className="hover:text-white/70">Courses</a>
            <a href={WAITLIST_LINK} className="hover:text-white/70">Waitlist</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
