import Link from "next/link";
import { Link as LocaleLink } from "@/i18n/navigation";
import Script from "next/script";
import { useTranslations } from "next-intl";
import { getService, getSetupCheckoutUrl, servicePagePath } from "@/lib/services";
import { PAID_AUDIT_BOOKING_URL } from "@/lib/paid-audit";
import Reveal from "@/components/Reveal";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const SITE_URL = "https://zenith-studio.site";

type LocalizedText = { q: string; a: string };
type SystemContent = { name: string; pitch: string; description: string; live: string; features: string[] };
type RosterEntry = { role: string; text: string; anchor: string };
type VerticalContent = {
  eyebrow: string;
  headline: string;
  lede: string;
  monthlyNote: string;
  statsLabels: string[];
  roster: RosterEntry[];
  guardrail: string;
  offer: string;
};
type PortfolioContent = { category: string; tagline: string; description: string };
type ServiceContent = { title: string; description: string };

export default function ZenithStudioLandingPage() {
  const t = useTranslations();
  const faqs = t.raw("faq.items") as LocalizedText[];
  const systemsContent = t.raw("systems.items") as SystemContent[];
  const verticalsContent = t.raw("verticals.items") as VerticalContent[];
  const portfolioContent = t.raw("portfolio.items") as PortfolioContent[];
  const servicesContent = t.raw("services.items") as ServiceContent[];

  const aiSystems = [
    {
      id: "ai-inbox-manager",
      setup: "$190",
      monthly: "$150/mo",
      featured: false,
      ...systemsContent[0],
    },
    {
      id: "ai-lead-capture",
      setup: "$270",
      monthly: "$200/mo",
      featured: true,
      ...systemsContent[1],
    },
    {
      id: "ai-receptionist",
      setup: "$360",
      monthly: "$300/mo",
      featured: false,
      ...systemsContent[2],
    },
  ];

  // Vertical offers. Deliberately a different shape from aiSystems above:
  // these are sold as roles you hire (priced against a salary) rather than
  // systems you install, because that framing is what carries the price.
  const verticalSystems = [
    {
      id: "law-firms",
      whopCheckoutUrl: "https://whop.com/checkout/plan_kTlL5gBlJTsqy",
      accent: "text-amber-200",
      accentSoft: "text-amber-200/70",
      accentBtn: "border-amber-300/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20",
      glow: "from-amber-300/[0.07] via-orange-400/[0.04] to-transparent",
      monthly: "$1,200/mo",
      statValues: ["38%", "88%", "6% vs 18%"],
      ...verticalsContent[0],
    },
    {
      id: "brokerages",
      whopCheckoutUrl: "https://whop.com/checkout/plan_m3i6RwMYvMATE",
      accent: "text-sky-200",
      accentSoft: "text-sky-200/70",
      accentBtn: "border-sky-300/30 bg-sky-400/10 text-sky-200 hover:bg-sky-400/20",
      glow: "from-sky-300/[0.07] via-indigo-400/[0.04] to-transparent",
      monthly: "$1,200/mo",
      statValues: ["917 min", "21x", "1 in 10"],
      ...verticalsContent[1],
    },
  ].map((v) => ({
    ...v,
    stats: v.statValues.map((value, i) => [value, v.statsLabels[i]] as [string, string]),
  }));

  const services = [
    {
      tag: "Core Service",
      href: undefined as string | undefined,
      icon: <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
      ...servicesContent[0],
    },
    {
      tag: "Core Service",
      href: undefined as string | undefined,
      icon: <path d="M17.25 6.75L22.5 12l-5.25 5.25M6.75 17.25L1.5 12l5.25-5.25M14.25 3.75l-4.5 16.5" />,
      ...servicesContent[1],
    },
    {
      tag: "Core Service",
      href: undefined as string | undefined,
      icon: (
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      ),
      ...servicesContent[2],
    },
    {
      tag: "Core Service",
      href: "/lab",
      icon: (
        <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347M4.26 10.147a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814M4.26 10.147A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443" />
      ),
      ...servicesContent[3],
    },
    {
      tag: "Core Service",
      href: undefined as string | undefined,
      icon: (
        <path d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      ),
      ...servicesContent[4],
    },
    {
      tag: "Core Service",
      href: undefined as string | undefined,
      icon: (
        <path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      ),
      ...servicesContent[5],
    },
  ];

  const portfolio = [
    {
      name: "VoyAI",
      href: "https://voyai.site",
      image: "/work/voyai.webp",
      accent: "from-sky-400/50 via-indigo-500/40 to-blue-600/50",
      tint: "56,189,248",
      icon: (
        <path d="M10.5 21l1.5-5 3.5-2 5.5 1.5a1.5 1.5 0 001-2.8L16 10l-1-6.5a1.3 1.3 0 00-2.4-.4L9.5 8 4 7a1.4 1.4 0 00-1 2.6L8 12l-1 4-3-.5a1.1 1.1 0 00-1 1.9L6 19l1.4 2.6a1.1 1.1 0 002-.2z" />
      ),
      ...portfolioContent[0],
    },
    {
      name: "SmartRevise",
      href: "https://smartrevise.site",
      image: "/work/smartrevise.webp",
      accent: "from-emerald-300/50 via-teal-500/40 to-green-600/50",
      tint: "16,185,129",
      icon: (
        <path d="M12 3a4 4 0 00-4 4 3.5 3.5 0 00-1.5 6.5A3 3 0 009 19a3 3 0 003 1 3 3 0 003-1 3 3 0 002.5-5.5A3.5 3.5 0 0016 7a4 4 0 00-4-4zM12 3v18" />
      ),
      ...portfolioContent[1],
    },
    {
      name: "Atlas & Awe",
      href: "https://atlasandawe.blog",
      image: "/work/atlasandawe.webp",
      accent: "from-amber-300/50 via-orange-500/40 to-rose-500/50",
      tint: "217,119,6",
      icon: (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5l-2 5-5 2 2-5z" />
        </>
      ),
      ...portfolioContent[2],
    },
    {
      name: "A+ Academy",
      href: "https://aplusacademy.site",
      image: "/work/aplusacademy.webp",
      accent: "from-fuchsia-400/50 via-purple-500/40 to-pink-600/50",
      tint: "168,85,247",
      icon: (
        <>
          <path d="M12 3L2 8l10 5 10-5-10-5z" />
          <path d="M6 10.5V16c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5.5" />
        </>
      ),
      ...portfolioContent[3],
    },
  ];

  // Structured data. Tells Google what this business is, what it sells and for
  // how much, and makes the FAQ eligible for rich snippets.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${SITE_URL}/#organization`,
        name: "Zenith Studio",
        url: SITE_URL,
        logo: `${SITE_URL}/icon.webp`,
        image: `${SITE_URL}/opengraph-image`,
        description:
          "AI automation agency building done-for-you systems that capture leads, book appointments, and clear the inbox. AI receptionists, lead follow-up, and custom integrations.",
        email: "zenith.studio.s@outlook.com",
        priceRange: "$190 - $5000",
        areaServed: { "@type": "Place", name: "Worldwide" },
        sameAs: ["https://www.youtube.com/@ZenithStudio-26", "https://whop.com/zenithstudio"],
        knowsAbout: [
          "AI automation",
          "Workflow automation",
          "Business process automation",
          "AI lead capture",
          "AI receptionist systems",
        ],
        makesOffer: aiSystems.map((system) => ({
          "@type": "Offer",
          name: system.name,
          description: system.description,
          price: system.setup.replace(/[$,]/g, ""),
          priceCurrency: "USD",
          category: "AI automation system",
        })),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Zenith Studio",
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en",
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#05060a] text-white overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Cal.com element-click embed. lazyOnload keeps it off the critical
          path so Core Web Vitals are untouched; until it loads, the buttons
          fall back to their plain href. */}
      <Script id="cal-embed" strategy="lazyOnload">
        {`(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "free-automation-audit", {origin:"https://app.cal.com"});
Cal.config = Cal.config || {};
Cal.config.forwardQueryParams = true;
Cal.ns["free-automation-audit"]("ui", {"hideEventTypeDetails":false,"layout":"month_view"});`}
      </Script>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(111,144,255,0.18),transparent_26%),radial-gradient(circle_at_80%_18%,rgba(216,82,255,0.18),transparent_22%),radial-gradient(circle_at_50%_70%,rgba(0,183,255,0.12),transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-10 pt-4">
        <div className="mx-auto max-w-7xl rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(72,113,255,0.12)]">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-7 py-3 sm:py-4">
            <div className="flex min-w-0 flex-shrink-0 items-center gap-2 sm:gap-3">
              <img
                src="/icon.webp"
                alt="Zenith Studio Icon"
                className="h-8 w-8 flex-shrink-0 rounded-2xl shadow-[0_0_30px_rgba(110,95,255,0.55)] sm:h-9 sm:w-9"
              />
              <div className="min-w-0">
                <div className="truncate text-xs tracking-[0.3em] text-white/60 uppercase sm:text-sm sm:tracking-[0.35em]">Zenith</div>
                <div className="truncate text-sm font-semibold -mt-0.5 sm:text-base">Studio</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-4 text-sm text-white/70 lg:gap-8">
              <a href="#work" className="hover:text-white transition-colors">{t("nav.work")}</a>
              <a href="#services" className="hover:text-white transition-colors">{t("nav.services")}</a>
              <a href="#systems" className="hover:text-white transition-colors">{t("nav.pricing")}</a>
              <Link href="/lab" className="hover:text-white transition-colors">{t("nav.courses")}</Link>
              <a href="#contact" className="hover:text-white transition-colors">{t("nav.contact")}</a>
            </nav>

            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-3">
              <LanguageSwitcher />
              <Link
                href="/sign-in"
                className="hidden text-sm text-white/60 transition-colors hover:text-white lg:inline"
              >
                {t("nav.signIn")}
              </Link>
              <LocaleLink
                href="/audit"
                className="whitespace-nowrap rounded-full bg-white px-3 py-2 text-xs font-semibold text-black transition hover:scale-[1.02] sm:px-4 sm:text-sm"
              >
                {t("nav.freeAudit")}
              </LocaleLink>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 sm:px-6 lg:px-10">
        <section className="mx-auto grid max-w-7xl items-center gap-12 pb-20 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20 min-h-[calc(100vh-110px)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200/90 backdrop-blur-xl">
              {t("hero.badge")}
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-8xl">
              {t("hero.titleLine1")}
              <br />
              {t("hero.titleLine2")}
              <br />
              <span className="bg-gradient-to-r from-cyan-200 via-blue-300 to-fuchsia-300 bg-clip-text text-transparent">
                {t("hero.titleLine3")}
              </span>
            </h1>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <LocaleLink
                href="/audit"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                {t("hero.ctaAudit")}
              </LocaleLink>
              <a
                href="#systems"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
              >
                {t("hero.ctaPricing")}
              </a>
            </div>
            <p className="mt-3 text-xs text-white/40">
              {t("hero.bookCallPrefix")}{" "}
              <a href={PAID_AUDIT_BOOKING_URL} className="underline decoration-white/30 underline-offset-2 hover:text-white">
                {t("hero.bookCallLink")}
              </a>
            </p>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["01", t("hero.card1Title"), t("hero.card1Text"), "#work"],
                ["02", t("hero.card2Title"), t("hero.card2Text"), "#services"],
              ].map(([num, title, text, href]) => (
                <a
                  key={title}
                  href={href}
                  className="group rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl shadow-[0_0_40px_rgba(82,98,255,0.08)] transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="text-[11px] font-medium tracking-[0.25em] text-cyan-200/60">{num}</div>
                  <div className="mt-1 text-sm font-semibold text-white">{title}</div>
                  <div className="mt-2 text-sm leading-6 text-white/58">{text}</div>
                </a>
              ))}
            </div>
          </div>

          <div className="relative min-h-[620px] lg:min-h-[680px]">
            <div className="absolute inset-x-10 top-10 h-56 rounded-full bg-fuchsia-500/20 blur-[110px]" />
            <div className="absolute right-6 top-6 h-56 w-56 rounded-full bg-cyan-400/20 blur-[95px]" />
            <div className="absolute left-8 bottom-16 h-52 w-52 rounded-full bg-blue-500/20 blur-[100px]" />

            <div className="absolute inset-0 flex items-center justify-center -translate-y-14 lg:-translate-y-24">
              <img
                src="/folder-glass.webp"
                alt="Glass Folder"
                className="pointer-events-none select-none drop-shadow-[0_40px_120px_rgba(0,0,0,0.7)] w-[520px] lg:w-[640px]"
                style={{ animation: "zenithFloat 3.2s ease-in-out infinite" }}
              />
            </div>

            <div className="absolute bottom-[30%] left-[0%] rounded-[28px] border border-white/12 bg-white/[0.04] px-4 py-4 backdrop-blur-2xl shadow-[0_0_40px_rgba(89,118,255,0.12)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">{t("hero.builtForLabel")}</div>
              <div className="mt-2 text-sm font-medium text-white/85">{t("hero.builtForText")}</div>
            </div>

            <div className="absolute right-[2%] bottom-[30%] rounded-[26px] border border-white/12 bg-white/[0.05] px-4 py-4 backdrop-blur-2xl shadow-[0_0_30px_rgba(226,109,255,0.12)]">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">{t("hero.outcomeLabel")}</div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{t("hero.outcomeTitle")}</div>
              <div className="text-sm text-white/55">{t("hero.outcomeText")}</div>
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

        {/* ── Two ways to start: free written audit vs. paid live call.
            These are genuinely different products (async report vs. a real
            20-minute call), not a discount ladder, so the copy and layout
            keep them visually equal rather than pushing one as an upsell. ── */}
        <section id="audit-options" className="mx-auto max-w-7xl py-10 sm:py-16">
          <div className="mb-10 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{t("auditOptions.eyebrow")}</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {t("auditOptions.title")}
            </h2>
            <p className="mt-4 text-white/62 leading-7">
              {t("auditOptions.subtitle")}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="flex flex-col rounded-[30px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                {t("auditOptions.free.label")}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-[-0.04em]">$0</span>
                <span className="text-sm text-white/55">{t("auditOptions.free.priceLabel")}</span>
              </div>
              <p className="mt-5 text-sm leading-7 text-white/60">
                {t("auditOptions.free.description")}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {(t.raw("auditOptions.free.features") as string[]).map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-white/65">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                      className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-cyan-300"
                    >
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <LocaleLink
                href="/audit"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-white/10"
              >
                {t("auditOptions.free.cta")}
              </LocaleLink>
            </div>

            <div className="relative flex flex-col rounded-[30px] border border-emerald-300/40 bg-emerald-400/[0.06] p-7 backdrop-blur-xl shadow-[0_0_50px_rgba(52,211,153,0.10)]">
              <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-emerald-300 to-teal-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-950">
                {t("auditOptions.paid.badge")}
              </span>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                {t("auditOptions.paid.label")}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-[-0.04em]">$35</span>
                <span className="text-sm text-white/55">{t("auditOptions.paid.priceLabel")}</span>
              </div>
              <p className="mt-5 text-sm leading-7 text-white/60">
                {t("auditOptions.paid.description")}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {(t.raw("auditOptions.paid.features") as string[]).map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-white/65">
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
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="https://cal.com/zenith-studio-ai/paid-automation-audit"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                {t("auditOptions.paid.cta")}
              </a>
            </div>
          </div>
        </section>

        {/* ── Portfolio / Our Products Section ── */}
        <section id="work" className="mx-auto max-w-7xl py-10 sm:py-16">
          <Reveal className="mb-8 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{t("portfolio.eyebrow")}</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {t("portfolio.title")}
            </h2>
            <p className="mt-4 text-white/62 leading-7">
              {t.rich("portfolio.description", {
                b1: (chunks) => <span className="text-white/85">{chunks}</span>,
                b2: (chunks) => <span className="text-white/85">{chunks}</span>,
                b3: (chunks) => <span className="text-white/85">{chunks}</span>,
                b4: (chunks) => <span className="text-white/85">{chunks}</span>,
              })}
            </p>
          </Reveal>

          <div className="flex flex-col gap-3 sm:h-[460px] sm:flex-row lg:h-[500px]">
            {portfolio.map((item, index) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative min-h-[230px] flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0c14] transition-[flex] duration-500 ease-out sm:min-h-0 sm:hover:flex-[3.5]"
              >
                {/* Screenshot layer: shown on mobile, revealed on hover on desktop */}
                <div className="absolute inset-0 opacity-100 transition-opacity duration-500 sm:opacity-0 sm:group-hover:opacity-100">
                  <img
                    src={item.image}
                    alt={`${item.name} website`}
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
                  {/* browser chrome */}
                  <div className="absolute inset-x-0 top-0 flex items-center gap-1.5 bg-black/45 px-3.5 py-2.5 backdrop-blur-md">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                    <span className="ml-2 truncate text-[11px] font-medium text-white/50">{item.href.replace("https://", "")}</span>
                  </div>
                </div>

                {/* Medallion layer: the clean collapsed state (desktop) */}
                <div
                  className="absolute inset-0 hidden flex-col items-center justify-center gap-4 sm:flex sm:transition-opacity sm:duration-500 sm:group-hover:opacity-0"
                  style={{ backgroundImage: `radial-gradient(circle at 50% 38%, rgba(${item.tint},0.30), rgba(10,12,20,0) 68%)` }}
                >
                  <div className="flex h-[70px] w-[70px] items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-white/90 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                      {item.icon}
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold tracking-[-0.02em] text-white">{item.name}</div>
                    <div className="mt-1.5 text-[10px] uppercase tracking-[0.28em] text-white/45">{item.category}</div>
                  </div>
                </div>

                <div className="absolute right-4 top-4 z-20 text-xs font-medium uppercase tracking-[0.25em] text-white/40">
                  0{index + 1}
                </div>

                {/* Details: shown on mobile, revealed on hover on desktop */}
                <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7">
                  <div className="transition-all duration-500 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/75 backdrop-blur-md">
                        {item.category}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.25em] text-white/45">{t("portfolio.builtBy")}</span>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">{item.name}</h3>
                    <p className="mt-1.5 text-base font-medium text-white/80">{item.tagline}</p>
                    <p className="mt-3 max-w-md text-sm leading-7 text-white/60">{item.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-200">
                      {item.href.replace("https://", "")}
                      <span aria-hidden className="transition-transform group-hover:translate-x-1">↗</span>
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── Services Section ── */}
        <section id="services" className="mx-auto max-w-7xl py-10 sm:py-16">
          <Reveal className="mb-8 max-w-2xl">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{t("services.eyebrow")}</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">{t("services.title")}</h2>
            <p className="mt-4 text-white/62 leading-7">
              {t("services.subtitle")}
            </p>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.title}
                className={`group rounded-[32px] border p-6 backdrop-blur-xl transition hover:-translate-y-1 ${
                  service.tag === "Coming Soon"
                    ? "border-fuchsia-500/20 bg-fuchsia-500/[0.04] hover:bg-fuchsia-500/[0.07]"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-[0_0_30px_rgba(110,130,255,0.16)] ${
                      service.tag === "Coming Soon"
                        ? "border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-400/30 via-purple-500/25 to-pink-500/30 text-fuchsia-200"
                        : "border-white/10 bg-gradient-to-br from-cyan-300/30 via-blue-500/25 to-fuchsia-500/30 text-cyan-100"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      {service.icon}
                    </svg>
                  </div>
                  {service.tag === "Coming Soon" && (
                    <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-fuchsia-200/80">
                      {t("services.comingSoon")}
                    </span>
                  )}
                </div>
                <h3 className="mt-5 text-xl font-semibold">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">{service.description}</p>
                {service.href && (
                  <Link
                    href={service.href}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-200 transition hover:gap-3"
                  >
                    {t("services.browseCourses")}
                    <span aria-hidden>→</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Zenith AI Systems: priced offers ── */}
        <section id="systems" className="mx-auto max-w-7xl py-10 sm:py-16">
          <Reveal className="mb-10 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">{t("systems.eyebrow")}</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {t("systems.title")}
            </h2>
            <p className="mt-4 text-white/62 leading-7">
              {t("systems.subtitle")}
            </p>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-3">
            {aiSystems.map((system) => (
              <div
                key={system.name}
                className={`relative flex flex-col rounded-[30px] border p-7 backdrop-blur-xl transition hover:-translate-y-1 ${
                  system.featured
                    ? "border-emerald-300/40 bg-emerald-400/[0.06] shadow-[0_0_50px_rgba(52,211,153,0.10)]"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"
                }`}
              >
                {system.featured && (
                  <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-emerald-300 to-teal-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-950">
                    {t("systems.mostPopular")}
                  </span>
                )}

                <h3 className="text-xl font-semibold tracking-[-0.02em]">{system.name}</h3>
                <p className="mt-2 text-sm font-medium text-white/80">{system.pitch}</p>

                <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-3xl font-semibold tracking-[-0.04em]">{system.setup}</span>
                  <span className="text-sm text-white/55">{t("systems.setupLabel")}</span>
                  <span className="text-sm font-medium text-emerald-200">+ {system.monthly}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.18em] text-white/40">
                  <span>{system.live}</span>
                </div>

                <p className="mt-5 text-sm leading-7 text-white/60">{system.description}</p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {system.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-white/65">
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
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-col gap-3">
                  {servicePagePath(system.id) ? (
                    <LocaleLink
                      href={servicePagePath(system.id)!}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-white/10"
                    >
                      {t("systems.seeHowItWorks")}
                    </LocaleLink>
                  ) : null}
                  {system.id === "ai-receptionist" && (
                    <Link
                      href="/demo/ai-receptionist"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-6 py-3 text-sm font-semibold text-emerald-300 transition hover:scale-[1.02] hover:bg-emerald-400/20"
                    >
                      {t("systems.tryLiveDemo")}
                    </Link>
                  )}
                  {system.id === "ai-inbox-manager" && (
                    <Link
                      href="/demo/ai-inbox-manager"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-6 py-3 text-sm font-semibold text-amber-200 transition hover:scale-[1.02] hover:bg-amber-400/20"
                    >
                      {t("systems.tryLiveDemo")}
                    </Link>
                  )}
                  {system.id === "ai-lead-capture" && (
                    <Link
                      href="/demo/ai-lead-capture-follow-up"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-6 py-3 text-sm font-semibold text-sky-200 transition hover:scale-[1.02] hover:bg-sky-400/20"
                    >
                      {t("systems.tryLiveDemo")}
                    </Link>
                  )}
                  {(() => {
                    // The direct checkout link (below) is the primary CTA. This is a
                    // real button, not a footnote link, so clients who
                    // already know what they want don't have to hunt for it.
                    const catalogService = getService(system.id);
                    const setupUrl = catalogService ? getSetupCheckoutUrl(catalogService) : null;
                    if (!setupUrl) return null;
                    return (
                      <a
                        href={setupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:scale-[1.02] hover:bg-emerald-400/20"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                          className="h-4 w-4"
                        >
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        {t("systems.buySetupDirectly")}
                      </a>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-5 rounded-[30px] border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl sm:grid-cols-3">
            {(t.raw("systems.steps") as { step: string; title: string; text: string }[]).map(({ step, title, text }) => (
              <div key={step}>
                <div className="text-[11px] font-medium tracking-[0.25em] text-emerald-200/70">{step}</div>
                <div className="mt-2 text-base font-semibold text-white">{title}</div>
                <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
              </div>
            ))}
          </div>

          {/* ── Vertical offers: hire an AI team, priced against the human role it replaces ── */}
          <div className="mt-16">
            <div className="mb-8 max-w-2xl">
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">{t("verticals.eyebrow")}</div>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                {t("verticals.title")}
              </h3>
              <p className="mt-3 text-white/55 leading-7">
                {t("verticals.subtitle")}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {verticalSystems.map((v) => (
                <div
                  key={v.id}
                  className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl sm:p-8"
                >
                  <div
                    className={`pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br ${v.glow} blur-[70px]`}
                  />
                  <div className="relative">
                    <div className={`text-xs font-semibold uppercase tracking-[0.25em] ${v.accentSoft}`}>
                      {v.eyebrow}
                    </div>
                    <h4 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]">
                      {v.headline}
                    </h4>
                    <p className="mt-4 text-sm leading-7 text-white/62">{v.lede}</p>

                    <div className="mt-6 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <span className={`text-3xl font-semibold tracking-[-0.04em] ${v.accent}`}>{v.monthly}</span>
                      <span className="text-sm text-white/55">{t("systems.aiTeamLabel")}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-white/45">{v.monthlyNote}</p>

                    <div className="mt-6 grid grid-cols-3 gap-3 border-y border-white/10 py-5">
                      {v.stats.map(([stat, label]) => (
                        <div key={label}>
                          <div className={`font-mono text-lg font-semibold sm:text-xl ${v.accent}`}>{stat}</div>
                          <div className="mt-1 text-[11px] leading-4 text-white/45">{label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 space-y-5">
                      {v.roster.map((r) => (
                        <div key={r.role}>
                          <div className="text-sm font-semibold text-white">{r.role}</div>
                          <p className="mt-1.5 text-sm leading-6 text-white/60">{r.text}</p>
                          <p className={`mt-1.5 text-xs font-medium ${v.accent}`}>{r.anchor}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                      <p className="text-xs leading-5 text-white/50">{v.guardrail}</p>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4">
                      <div className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${v.accentSoft}`}>
                        {t("verticals.startHereLabel")}
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-white/72">{v.offer}</p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      {servicePagePath(v.id) ? (
                        <LocaleLink
                          href={servicePagePath(v.id)!}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-white/10"
                        >
                          {t("verticals.seeHowTeamWorks")}
                        </LocaleLink>
                      ) : null}
                      {v.id === "law-firms" && (
                        <Link
                          href="/demo/law-firm-ai-team"
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition hover:scale-[1.02] ${v.accentBtn}`}
                        >
                          {t("verticals.watchFirmLeakDemo")}
                        </Link>
                      )}
                      {v.id === "brokerages" && (
                        <Link
                          href="/demo/brokerage-ai-team"
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition hover:scale-[1.02] ${v.accentBtn}`}
                        >
                          {t("verticals.seeTeamInAction")}
                        </Link>
                      )}
                      {v.whopCheckoutUrl && (
                        <a
                          href={v.whopCheckoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition hover:scale-[1.02] ${v.accentBtn}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                            className="h-4 w-4"
                          >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                          {t("verticals.subscribeDirectly")}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* == Projects / Live demos (COMMENTED OUT) ==
        <section id="projects" className="mx-auto max-w-7xl py-10 sm:py-16">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.3em] text-fuchsia-200/70">Projects / Live demos</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Systems built to prove value fast</h2>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {demos.map((demo, index) => (
              <div
                key={demo}
                className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl"
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 blur-[80px]" />
                <div className="relative">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/45">Demo {String(index + 1).padStart(2, "0")}</div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{demo}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/60"></p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">Live preview soon</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">Case study ready</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        ── END COMMENTED OUT ── */}

        {/* ── Products Section (disabled, kept for a possible relaunch) ──
        <section id="products" className="mx-auto max-w-7xl py-10 sm:py-16">
          <div className="mb-8 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-blue-200/70">Division 03 · Products &amp; Learning</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Ready-to-use automation assets</h2>
            <p className="mt-4 text-white/62 leading-7">
              Battle-tested playbooks, plug-and-play workflows, and step-by-step systems: everything you need to automate, earn, and scale without starting from zero.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {products.map((product) => (
              <div
                key={product.title}
                className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(75,90,255,0.08)] flex flex-col"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-xl text-cyan-200 shadow-[0_0_24px_rgba(92,138,255,0.12)]">
                  {product.icon}
                </div>
                <h3 className="mt-5 text-xl font-semibold">{product.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60 flex-1">{product.description}</p>
                <a
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(255,255,255,0.15)]"
                >
                  GET ACCESS
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </section>
        */}

        {/* ── FAQ (also powers the FAQPage rich snippet) ── */}
        <section id="faq" className="mx-auto max-w-7xl py-10 sm:py-16">
          <div className="mb-8 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{t("faq.eyebrow")}</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {t("faq.title")}
            </h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-[24px] border border-white/10 bg-white/[0.04] px-6 backdrop-blur-xl transition hover:border-white/20"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-medium text-white marker:hidden [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    aria-hidden
                    className="h-4 w-4 flex-shrink-0 text-cyan-200 transition-transform group-open:rotate-45"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="pb-5 text-sm leading-7 text-white/60">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Contact / Socials Section ── */}
          <section id="contact" className="mx-auto max-w-7xl py-10 sm:py-16 pb-24">
            <div className="overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.05] p-8 sm:p-10 lg:p-12 backdrop-blur-2xl">
              <Reveal className="text-center max-w-2xl mx-auto">
                <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{t("contact.eyebrow")}</div>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                  {t("contact.title")}
                </h2>
                <p className="mt-4 text-white/62 leading-7">
                  {t("contact.subtitle")}
                </p>

                {/* Whop Shop CTA */}
                <a
                  href="https://whop.com/zenithstudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:scale-[1.03] hover:shadow-[0_0_32px_rgba(255,255,255,0.2)]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  {t("contact.shopCta")}
                </a>
          
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  {/* Email */}
                  <a
                    href="mailto:zenith.studio.s@outlook.com"
                    className="group flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.08] hover:border-white/20"
                  >
                    <svg className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-white/40 uppercase tracking-wider">{t("contact.emailLabel")}</div>
                      <div className="text-sm font-medium text-white/80">zenith.studio.s@outlook.com</div>
                    </div>
                  </a>
          
                  {/* YouTube */}
                  <a
                    href="https://www.youtube.com/@ZenithStudio-26"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.08] hover:border-white/20"
                  >
                    <svg className="h-5 w-5 text-white/60 group-hover:text-[#FF0000] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-white/40 uppercase tracking-wider">{t("contact.youtubeLabel")}</div>
                      <div className="text-sm font-medium text-white/80">Zenith Studio</div>
                    </div>
                  </a>
                </div>
              </Reveal>
            </div>
          </section>
      </main>

      <footer className="relative z-10 border-t border-white/8 px-4 sm:px-6 lg:px-10 py-8 text-sm text-white/42">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>{t("footer.copyright")}</div>
          <div className="flex gap-5">
            <a href="#work" className="hover:text-white/70">{t("footer.work")}</a>
            <a href="#services" className="hover:text-white/70">{t("footer.services")}</a>
            <a href="#systems" className="hover:text-white/70">{t("footer.pricing")}</a>
            <Link href="/lab" className="hover:text-white/70">{t("footer.courses")}</Link>
            <a href="#contact" className="hover:text-white/70">{t("footer.connect")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
