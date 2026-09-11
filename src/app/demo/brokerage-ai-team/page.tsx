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

function AgentDiagram() {
  return (
    <svg viewBox="0 0 340 190" className="w-full" role="img" aria-label="Three roles run in parallel: an inside sales agent answers leads, a transaction coordinator tracks files to close, and a database manager reactivates dormant contacts">
      <defs>
        <linearGradient id="bk-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="95" r="30" fill="url(#bk-glow)" />
      <circle cx="60" cy="95" r="26" fill="#0a1216" stroke="#7dd3fc" strokeWidth="1.5" />
      <text x="60" y="91" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#7dd3fc">
        Brokerage
      </text>
      <text x="60" y="103" textAnchor="middle" fontSize="8" fill="#7dd3fc" opacity="0.8">
        AI team
      </text>
      <line x1="86" y1="82" x2="130" y2="40" stroke="#1c3540" strokeWidth="1.5" />
      <line x1="86" y1="95" x2="130" y2="95" stroke="#1c3540" strokeWidth="1.5" />
      <line x1="86" y1="108" x2="130" y2="150" stroke="#1c3540" strokeWidth="1.5" />
      <rect x="132" y="22" width="130" height="36" rx="9" fill="#0a1216" stroke="#1c3540" />
      <text x="197" y="44" textAnchor="middle" fontSize="9.5" fill="#bae6fd">
        Lead &rarr; inside sales
      </text>
      <rect x="132" y="77" width="130" height="36" rx="9" fill="#0a1216" stroke="#1c3540" />
      <text x="197" y="99" textAnchor="middle" fontSize="9.5" fill="#bae6fd">
        Contract &rarr; coordination
      </text>
      <rect x="132" y="132" width="130" height="36" rx="9" fill="#0a1216" stroke="#1c3540" />
      <text x="197" y="154" textAnchor="middle" fontSize="9.5" fill="#bae6fd">
        Dormant &rarr; reactivated
      </text>
    </svg>
  );
}

export default function BrokerageDemoPage() {
  const service = getService("brokerages");
  const checkoutUrl = service ? getMonthlyCheckoutUrl(service) : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-300/70">Brokerage AI team</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Three roles your agents stop having to be.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
            A walkthrough of what gets built for your team: a new lead answered before a competitor picks up, a
            file tracked from contract to close without anyone chasing it, and a dormant database that starts
            working again. This is a preview of the build, not a packaged product running today - each
            brokerage&apos;s system is built to your CRM and workflow, live in 2 to 7 days after kickoff.
          </p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/35">Three roles, one team</p>
            <div className="mt-3">
              <AgentDiagram />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:max-w-md">
            {STATS.map((s) => (
              <div key={s.l} className="bg-black px-3 py-4 text-center sm:px-4">
                <p className="text-lg font-extrabold tracking-tight text-white sm:text-xl">{s.n}</p>
                <p className="mt-1 text-[10.5px] leading-tight text-white/45">{s.l}</p>
              </div>
            ))}
          </div>

          {checkoutUrl && (
            <div className="mt-10 rounded-2xl border border-sky-300/30 bg-sky-400/[0.06] p-6 sm:max-w-md">
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

        <div className="lg:sticky lg:top-16">
          <BrokerageDemo />
          <p className="mt-3 text-center text-[11px] text-white/30 lg:text-left">
            Simulated walkthrough &middot; no real lead, contract, or contact is touched here
          </p>
        </div>
      </div>
    </div>
  );
}
