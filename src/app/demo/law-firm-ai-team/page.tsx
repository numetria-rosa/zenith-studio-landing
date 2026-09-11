import type { Metadata } from "next";
import Link from "next/link";
import FirmLeakDemo from "./FirmLeakDemo";
import { getService, getMonthlyCheckoutUrl } from "@/lib/services";

export const metadata: Metadata = { title: "The Firm Leak - Law Firm AI Team Demo" };

const LEAK_STATS: { n: string; l: string }[] = [
  { n: "$230K", l: "lost per attorney, per year" },
  { n: "34%", l: "callers who never call back" },
  { n: "6% vs 18%", l: "write-downs at 14 vs 45 days" },
];

function AgentDiagram() {
  return (
    <svg viewBox="0 0 340 190" className="w-full" role="img" aria-label="Three roles run in parallel: a missed call gets texted back, a quiet lead gets followed up, and billable time gets reconstructed">
      <defs>
        <linearGradient id="fl-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#fcd34d" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="95" r="30" fill="url(#fl-glow)" />
      <circle cx="60" cy="95" r="26" fill="#0a1216" stroke="#fcd34d" strokeWidth="1.5" />
      <text x="60" y="91" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#fcd34d">
        Firm
      </text>
      <text x="60" y="103" textAnchor="middle" fontSize="8" fill="#fcd34d" opacity="0.8">
        AI team
      </text>
      <line x1="86" y1="82" x2="130" y2="40" stroke="#1c3540" strokeWidth="1.5" />
      <line x1="86" y1="95" x2="130" y2="95" stroke="#1c3540" strokeWidth="1.5" />
      <line x1="86" y1="108" x2="130" y2="150" stroke="#1c3540" strokeWidth="1.5" />
      <rect x="132" y="22" width="120" height="36" rx="9" fill="#0a1216" stroke="#1c3540" />
      <text x="192" y="44" textAnchor="middle" fontSize="9.5" fill="#fde68a">
        Missed call &rarr; text-back
      </text>
      <rect x="132" y="77" width="120" height="36" rx="9" fill="#0a1216" stroke="#1c3540" />
      <text x="192" y="99" textAnchor="middle" fontSize="9.5" fill="#fde68a">
        Quiet lead &rarr; follow-up
      </text>
      <rect x="132" y="132" width="120" height="36" rx="9" fill="#0a1216" stroke="#1c3540" />
      <text x="192" y="154" textAnchor="middle" fontSize="9.5" fill="#fde68a">
        Time &rarr; billing draft
      </text>
    </svg>
  );
}

export default function FirmLeakDemoPage() {
  const service = getService("law-firms");
  const checkoutUrl = service ? getMonthlyCheckoutUrl(service) : null;
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/70">The firm leak</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Watch where the hours and the leads actually go.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
            Three simulated steps, one after another: a missed call, a lead going quiet, and a day of billable time
            reconstructed. Nothing here calls a real phone or touches a real calendar; every number and message
            below is an example. The three engines it&apos;s built on (Text-Back, Follow-Up Clerk, Billing Clerk)
            are real and already live.
          </p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/35">Three roles, one team</p>
            <div className="mt-3">
              <AgentDiagram />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:max-w-md">
            {LEAK_STATS.map((s) => (
              <div key={s.l} className="bg-black px-3 py-4 text-center sm:px-4">
                <p className="text-lg font-extrabold tracking-tight text-white sm:text-xl">{s.n}</p>
                <p className="mt-1 text-[10.5px] leading-tight text-white/45">{s.l}</p>
              </div>
            ))}
          </div>

          {checkoutUrl && (
            <div className="mt-10 rounded-2xl border border-amber-300/30 bg-amber-400/[0.06] p-6 sm:max-w-md">
              <p className="text-sm font-semibold text-white">Ready for your own firm?</p>
              <p className="mt-1 text-xs leading-5 text-white/55">
                One system for intake, follow-up, and billing recovery. You approve every entry.
              </p>
              <a
                href={checkoutUrl}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-amber-300 px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Get the Law Firm AI Team
              </a>
            </div>
          )}

          <Link href="/services/law-firm-ai-team" className="mt-6 inline-block text-xs text-white/40 hover:text-white/70">
            &larr; Back to Law Firm AI Team
          </Link>
        </div>

        <div className="lg:sticky lg:top-16">
          <FirmLeakDemo />
          <p className="mt-3 text-center text-[11px] text-white/30 lg:text-left">
            Simulated walkthrough &middot; no real call, message, or invoice is sent here
          </p>
        </div>
      </div>
    </div>
  );
}
