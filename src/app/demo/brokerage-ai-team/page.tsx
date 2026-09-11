import type { Metadata } from "next";
import Link from "next/link";
import BrokerageDemo from "./BrokerageDemo";
import { getService, getMonthlyCheckoutUrl } from "@/lib/services";

export const metadata: Metadata = { title: "Brokerage AI Team Demo" };

const STATS: { n: string; l: string }[] = [
  { n: "917 min", l: "average agent lead response time" },
  { n: "21x", l: "likelier to convert inside 5 minutes" },
  { n: "1 in 10", l: "recruited agents still there in year five" },
];

export default function BrokerageDemoPage() {
  const service = getService("brokerages");
  const checkoutUrl = service ? getMonthlyCheckoutUrl(service) : null;

  return (
    <div className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.18em] text-sky-300/70">Brokerage AI team</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Three roles your agents stop having to be.
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          A walkthrough of what gets built for your team: a new lead answered before a competitor picks up, a file
          tracked from contract to close without anyone chasing it, and a dormant database that starts working
          again. This is a preview of the build, not a packaged product running today - each brokerage&apos;s
          system is built to your CRM and workflow, live in 2 to 7 days after kickoff.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
          {STATS.map((s) => (
            <div key={s.l} className="bg-black px-3 py-4 text-center sm:px-4">
              <p className="text-lg font-extrabold tracking-tight text-white sm:text-xl">{s.n}</p>
              <p className="mt-1 text-[10.5px] leading-tight text-white/45">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <BrokerageDemo />
        </div>

        {checkoutUrl && (
          <div className="mt-8 rounded-2xl border border-sky-300/30 bg-sky-400/[0.06] p-6">
            <p className="text-sm font-semibold text-white">Ready for your own team?</p>
            <p className="mt-1 text-xs leading-5 text-white/55">
              We run your dormant database first. You pay out of what it produces.
            </p>
            <a
              href={checkoutUrl}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky-300 px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Get the Brokerage AI Team
            </a>
          </div>
        )}

        <Link href="/services/brokerage-ai-team" className="mt-6 inline-block text-xs text-white/40 hover:text-white/70">
          &larr; Back to Brokerage AI Team
        </Link>
      </div>
    </div>
  );
}
