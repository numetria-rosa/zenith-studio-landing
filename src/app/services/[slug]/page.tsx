import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookButton from "@/app/BookButton";
import { getService } from "@/lib/services";
import { allServicePageSlugs, getServicePage, PAID_AUDIT_BOOKING_URL } from "@/lib/service-pages";
import ServiceHeroVisual from "./ServiceHeroVisual";

export function generateStaticParams() {
  return allServicePageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) return { title: "Service" };
  return {
    title: `${page.title} | Zenith Studio`,
    description: page.heroLine,
  };
}

export default async function ServiceDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) notFound();
  const service = getService(page.serviceId);
  const checkout = service?.setupCheckoutUrl || service?.monthlyCheckoutUrl || null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(251,146,60,0.16),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_50%_88%,rgba(99,102,241,0.14),transparent_36%)]" />
        <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <header className="relative z-20 px-4 pt-5 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/icon.webp"
              alt="Zenith Studio"
              className="h-9 w-9 rounded-2xl shadow-[0_0_30px_rgba(110,95,255,0.55)]"
            />
            <span className="leading-tight">
              <span className="block text-[10px] uppercase tracking-[0.32em] text-white/55">Zenith</span>
              <span className="-mt-0.5 block text-sm font-semibold">Studio</span>
            </span>
          </Link>
          <nav className="hidden text-[13px] text-white/45 sm:block">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="px-2">/</span>
            <Link href="/#systems" className="hover:text-white">
              Services
            </Link>
            <span className="px-2">/</span>
            <span className="text-white/80">{page.title}</span>
          </nav>
          <Link
            href="/audit"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            Free written audit
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-8 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:pt-14">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black">
              <span className="text-sm font-extrabold tracking-tight">&lt;/&gt;</span>
            </div>
            <p className="mt-6 text-[13px] text-white/45">{page.eyebrow}</p>
            <h1 className="mt-4 max-w-xl text-[2.35rem] font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-5xl lg:text-[3.35rem]">
              {page.heroLine}
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-7 text-white/62">{page.whoFor}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/audit"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Get a free written audit
              </Link>
              <a
                href="#how"
                className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Learn more
              </a>
            </div>
            <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
              {page.setupDisplay ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Setup</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight">{page.setupDisplay}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Engagement</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight">Monthly</p>
                </div>
              )}
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Monthly</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-400">{page.monthlyDisplay}</p>
              </div>
            </div>
          </div>
          <ServiceHeroVisual serviceId={page.serviceId} />
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Live in", "2–7 days"],
              ["You keep", "Your tools"],
              ["Cancel", "Anytime"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 backdrop-blur-xl"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">{k}</p>
                <p className="mt-1 text-lg font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto mt-12 grid max-w-7xl gap-6 px-4 sm:px-8 lg:grid-cols-2 lg:px-12">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">The problem</h2>
            <p className="mt-4 text-[17px] leading-8 text-white/75">{page.problem}</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">How it works</h2>
            <ol className="mt-4 space-y-3">
              {page.howItWorks.map((step, i) => (
                <li key={step} className="flex gap-3 text-[15px] leading-6 text-white/75">
                  <span className="mt-0.5 font-mono text-xs text-amber-300">0{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto mt-6 grid max-w-7xl gap-6 px-4 sm:px-8 lg:grid-cols-2 lg:px-12">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">Included</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {page.included.map((item) => (
                <li key={item} className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-sm text-white/75">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">After setup</h2>
            <ul className="mt-4 space-y-3 text-[15px] leading-7 text-white/75">
              {page.afterSetup.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-8 lg:px-12">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">Example workflow</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {page.workflow.map((row, i) => (
                <div
                  key={row.step}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:-translate-y-1 hover:border-white/25"
                >
                  <p className="font-mono text-[11px] text-amber-300">0{i + 1}</p>
                  <p className="mt-2 font-semibold">{row.step}</p>
                  <p className="mt-1 text-sm leading-6 text-white/55">{row.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-7xl px-4 pb-20 sm:px-8 lg:px-12">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">FAQ</h2>
              <div className="mt-5 divide-y divide-white/10">
                {page.faqs.map((faq) => (
                  <div key={faq.q} className="py-4">
                    <p className="font-semibold">{faq.q}</p>
                    <p className="mt-1.5 text-sm leading-6 text-white/55">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-7 backdrop-blur-xl">
              <h2 className="text-2xl font-extrabold tracking-tight">Start here</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                If you opened this from an email, you do not need the rest of the site. Pick the lightest next step.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/audit"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
                >
                  Free written audit
                </Link>
                <a
                  href={PAID_AUDIT_BOOKING_URL}
                  className="inline-flex items-center justify-center rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold"
                >
                  $35 audit call
                </a>
                <BookButton className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm text-white/70">
                  Free intro call
                </BookButton>
              </div>
              {checkout ? (
                <p className="mt-5 text-xs text-white/35">
                  Checkout after a proposal is approved. Catalog:{" "}
                  <a href={checkout} className="underline">
                    Whop
                  </a>
                  .
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
