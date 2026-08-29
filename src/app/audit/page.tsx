import type { Metadata } from "next";
import Link from "next/link";
import BookButton from "../BookButton";
import AuditForm from "./AuditForm";

export const metadata: Metadata = {
  title: "Get Your Free Automation Audit | Zenith Studio",
  description:
    "Tell us how your business runs today and we'll map exactly where automation would save the most time and money. Free, no obligation.",
};

export default function AuditPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(111,144,255,0.18),transparent_26%),radial-gradient(circle_at_80%_18%,rgba(216,82,255,0.18),transparent_22%),radial-gradient(circle_at_50%_70%,rgba(0,183,255,0.12),transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(72,113,255,0.12)]">
          <div className="flex items-center justify-between px-5 py-4 sm:px-7">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/icon.webp"
                alt="Zenith Studio Icon"
                className="h-9 w-9 rounded-2xl shadow-[0_0_30px_rgba(110,95,255,0.55)]"
              />
              <div>
                <div className="text-xs tracking-[0.35em] text-white/60 uppercase">Zenith</div>
                <div className="-mt-0.5 text-sm font-semibold">Studio</div>
              </div>
            </Link>
            <Link href="/" className="text-sm text-white/60 transition-colors hover:text-white">
              Back to site
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-12 sm:px-6 lg:px-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200/90 backdrop-blur-xl">
            Free automation audit
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
            Get Your Free
            <br />
            <span className="bg-gradient-to-r from-cyan-200 via-blue-300 to-fuchsia-300 bg-clip-text text-transparent">
              Automation Audit
            </span>
          </h1>
          <p className="mt-5 text-white/60 leading-7">
            Answer a few questions about how your business runs today. We&apos;ll review it and follow up with where
            automation would save you the most time and money, no obligation. Takes about 5 minutes.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/50">
            <span>Prefer to talk it through instead?</span>
            <BookButton className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-white/10">
              Book a live call instead
            </BookButton>
          </div>
        </div>

        <div className="mt-10">
          <AuditForm />
        </div>
      </main>
    </div>
  );
}
