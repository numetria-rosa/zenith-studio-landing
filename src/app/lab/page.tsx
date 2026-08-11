import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://zenith-studio.site";

// Swap for a Whop checkout or waitlist form when the first cohort opens.
const WAITLIST_LINK =
  "mailto:zenith.studio.s@outlook.com?subject=Zenith%20Lab%20Waitlist&body=Hi%20Zenith%20Studio%2C%0A%0AI'd%20like%20to%20join%20the%20waitlist%20for%3A%20%0A%0AWhat%20I%20want%20to%20be%20able%20to%20do%20after%20the%20course%3A%20%0A";

export const metadata: Metadata = {
  title: "Zenith Lab | Career-Path Courses in Automation & AI Engineering",
  description:
    "Hands-on engineering courses in automation, AI, data, and Web3. Every course includes a Career Path Edition so you learn the skill and know exactly how to get paid for it. Founding cohort pricing open.",
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
    title: "Zenith Lab | Career-Path Courses in Automation & AI Engineering",
    description:
      "Learn the skill, then learn exactly how to get paid for it. Founding cohort pricing open.",
  },
};

const courses = [
  {
    id: "automation-engineering",
    name: "Automation Engineering",
    level: "Automation",
    status: "Founding cohort open",
    open: true,
    summary:
      "Design production-grade workflows the way agencies actually ship them: API integrations, error handling, queues, retries, and self-hosting.",
    careerPath:
      "Land automation clients at $50/hour, price fixed-scope builds, and ship a portfolio system you can demo on a sales call.",
    founding: "$79",
    full: "$199",
    modules: [
      "Workflow design and architecture",
      "API integrations and authentication",
      "Error handling, retries, and queues",
      "Self-hosting and monitoring",
      "Career Path Edition: finding and pricing clients",
    ],
  },
  {
    id: "ai-engineering",
    name: "AI Engineering",
    level: "AI and LLMs",
    status: "Next up",
    open: false,
    summary:
      "Build real products with language models: prompting, retrieval, agents, tool use, structured outputs, and evaluation. The exact stack behind VoyAI and SmartRevise.",
    careerPath:
      "Move into AI engineering work, whether freelance or hired, with a shipped product and evals you can point at.",
    founding: "$99",
    full: "$299",
    modules: [
      "Prompting and structured outputs",
      "Retrieval and grounding on your own data",
      "Agents, tool use, and orchestration",
      "Evaluation, cost control, and model routing",
      "Career Path Edition: getting hired as an AI engineer",
    ],
  },
  {
    id: "data-science",
    name: "Data Science & Analysis",
    level: "Data",
    status: "Planned",
    open: false,
    summary:
      "Python, pandas, and visualization applied to real analysis: cleaning messy data, finding signal, and shipping dashboards that drive a decision.",
    careerPath:
      "Build a portfolio of real analyses that gets interviews, rather than another tutorial notebook.",
    founding: "$79",
    full: "$249",
    modules: [
      "Python and pandas for real datasets",
      "Cleaning and validating messy data",
      "Analysis that answers a business question",
      "Dashboards and communicating findings",
      "Career Path Edition: the portfolio that gets interviews",
    ],
  },
  {
    id: "web3-engineering",
    name: "Web3 Engineering",
    level: "Blockchain",
    status: "Planned",
    open: false,
    summary:
      "Smart contracts, wallets, and dApps end to end: Solidity fundamentals through deploying and securing something real on chain.",
    careerPath:
      "Understand where the paid on-chain work actually is, and have a deployed contract to show for it.",
    founding: "$99",
    full: "$299",
    modules: [
      "Solidity fundamentals",
      "Contract security and common exploits",
      "Wallets, testing, and deployment",
      "Building a working dApp front end",
      "Career Path Edition: where on-chain work is paid",
    ],
  },
];

export default function ZenithLabPage() {
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
      offers: {
        "@type": "Offer",
        price: course.founding.replace("$", ""),
        priceCurrency: "USD",
        availability: course.open
          ? "https://schema.org/PreOrder"
          : "https://schema.org/PreSale",
        url: `${SITE_URL}/lab#${course.id}`,
      },
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

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(52,211,153,0.14),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(111,144,255,0.16),transparent_24%),radial-gradient(circle_at_55%_85%,rgba(216,82,255,0.12),transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-10 pt-4">
        <div className="mx-auto max-w-6xl rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(52,211,153,0.10)]">
          <div className="flex items-center justify-between px-5 sm:px-7 py-4">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/icon.webp"
                alt="Zenith Studio"
                className="h-9 w-9 rounded-2xl shadow-[0_0_30px_rgba(110,95,255,0.55)]"
              />
              <div>
                <div className="text-sm tracking-[0.35em] text-white/60 uppercase">Zenith</div>
                <div className="text-base font-semibold -mt-0.5">Lab</div>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
              <a href="#catalog" className="transition-colors hover:text-white">Courses</a>
              <a href="#career-path" className="transition-colors hover:text-white">Career Path</a>
              <Link href="/" className="transition-colors hover:text-white">Studio</Link>
            </nav>

            <a
              href={WAITLIST_LINK}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Join the waitlist
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-6xl pb-14 pt-16 sm:pt-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-emerald-200/90 backdrop-blur-xl">
              Zenith Lab · Courses
            </div>

            <h1 className="mt-7 text-5xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Learn to build
              <br />
              <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                what we build.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">
              Hands-on engineering courses from the team behind VoyAI and SmartRevise.
              Every course ends with a <span className="text-white/90">Career Path Edition</span>,
              so you do not just learn the skill, you know exactly where to apply it and how to get paid.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <a
                href={WAITLIST_LINK}
                className="rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Join the founding cohort
              </a>
              <a
                href="#catalog"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-center text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
              >
                Browse the courses
              </a>
            </div>

            <p className="mt-5 text-sm text-white/45">
              Founding members pay roughly half the full price and keep lifetime updates.
            </p>
          </div>
        </section>

        <section id="career-path" className="mx-auto max-w-6xl border-t border-white/10 py-14">
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
              ["Build something real", "You ship a working system, not a folder of exercise files. It becomes the thing you demo when someone asks what you can do."],
              ["Career Path Edition", "Where the work is, how to find it, what to charge, and how to talk about it. The part almost every course leaves out."],
              ["Taught from live products", "The material comes out of systems that are actually running and actually sold, not from a syllabus written in a vacuum."],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.06]"
              >
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-300/30 via-teal-500/25 to-cyan-500/30 shadow-[0_0_30px_rgba(52,211,153,0.16)]" />
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2.5 text-sm leading-7 text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="catalog" className="mx-auto max-w-6xl border-t border-white/10 py-14">
          <div className="mb-10 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">The catalog</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Four courses, built in order
            </h2>
            <p className="mt-4 leading-7 text-white/62">
              We open one cohort at a time so each course is shaped by the people taking it.
              Join the waitlist for any of them and you get the founding price when it opens.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {courses.map((course) => (
              <div
                key={course.id}
                id={course.id}
                className={`flex flex-col rounded-[30px] border p-7 backdrop-blur-xl transition hover:-translate-y-1 ${
                  course.open
                    ? "border-emerald-300/40 bg-emerald-400/[0.06] shadow-[0_0_50px_rgba(52,211,153,0.10)]"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/55">
                    {course.level}
                  </span>
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      course.open ? "text-emerald-200" : "text-white/40"
                    }`}
                  >
                    {course.status}
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{course.name}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">{course.summary}</p>

                <div className="mt-5 rounded-2xl border-l-2 border-emerald-300/60 bg-emerald-400/[0.05] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/80">
                    Career Path Edition
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-white/70">{course.careerPath}</p>
                </div>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {course.modules.map((module) => (
                    <li key={module} className="flex items-start gap-2.5 text-sm text-white/60">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                        className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-emerald-300"
                      >
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                      {module}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-baseline gap-3">
                  <span className="text-3xl font-semibold tracking-[-0.04em]">{course.founding}</span>
                  <span className="text-sm text-white/45 line-through">{course.full}</span>
                  <span className="text-xs uppercase tracking-[0.16em] text-emerald-200/80">
                    Founding price
                  </span>
                </div>

                <a
                  href={WAITLIST_LINK}
                  className={`mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition hover:scale-[1.02] ${
                    course.open
                      ? "bg-white text-black"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {course.open ? "Join the founding cohort" : "Join the waitlist"}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl border-t border-white/10 py-14 pb-24">
          <div className="overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-2xl sm:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Founding cohort</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Get in before the price goes up
              </h2>
              <p className="mt-4 leading-7 text-white/62">
                Founding members pay about half, keep lifetime updates, and help shape what
                goes into the course. Tell us which one you want and what you are trying to
                be able to do afterwards.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <a
                  href={WAITLIST_LINK}
                  className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                >
                  Join the waitlist
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
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
