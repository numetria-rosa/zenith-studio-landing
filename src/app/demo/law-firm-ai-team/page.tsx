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

export default function FirmLeakDemoPage() {
  const service = getService("law-firms");
  const checkoutUrl = service ? getMonthlyCheckoutUrl(service) : null;
  return (
    <div className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">The firm leak</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Watch where the hours and the leads actually go.
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Three simulated steps, one after another: a missed call, a lead going quiet, and a day of billable time
          reconstructed. Nothing here calls a real phone or touches a real calendar; every number and message below
          is an example. The three engines it&apos;s built on (Text-Back, Follow-Up Clerk, Billing Clerk) are real
          and already live.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
          {LEAK_STATS.map((s) => (
            <div key={s.l} className="bg-black px-3 py-4 text-center sm:px-4">
              <p className="text-lg font-extrabold tracking-tight text-white sm:text-xl">{s.n}</p>
              <p className="mt-1 text-[10.5px] leading-tight text-white/45">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <FirmLeakDemo />
        </div>

        {checkoutUrl && (
          <div className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-400/[0.06] p-6">
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
    </div>
  );
}
