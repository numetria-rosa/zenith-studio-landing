import type { Metadata } from "next";
import Link from "next/link";
import LeadCaptureDemo from "./LeadCaptureDemo";
import { getService, getSetupCheckoutUrl } from "@/lib/services";

export const metadata: Metadata = { title: "AI Lead Capture & Follow-Up Demo" };

function AgentDiagram() {
  return (
    <svg viewBox="0 0 340 190" className="w-full" role="img" aria-label="An enquiry comes in, gets qualified, then followed up until it books or stops">
      <defs>
        <linearGradient id="lc-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="6" y="14" width="90" height="36" rx="9" fill="#0a1216" stroke="#1c3540" />
      <text x="51" y="37" textAnchor="middle" fontSize="10.5" fill="#bae6fd">
        Enquiry
      </text>
      <line x1="51" y1="50" x2="51" y2="76" stroke="#1c3540" strokeWidth="1.5" />
      <circle cx="51" cy="100" r="30" fill="url(#lc-glow)" />
      <circle cx="51" cy="100" r="26" fill="#0a1216" stroke="#7dd3fc" strokeWidth="1.5" />
      <text x="51" y="96" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#7dd3fc">
        Qualify
      </text>
      <text x="51" y="108" textAnchor="middle" fontSize="8" fill="#7dd3fc" opacity="0.8">
        your rules
      </text>
      <line x1="77" y1="100" x2="120" y2="100" stroke="#1c3540" strokeWidth="1.5" />
      <rect x="122" y="82" width="100" height="36" rx="9" fill="#0a1216" stroke="#1c3540" />
      <text x="172" y="104" textAnchor="middle" fontSize="10" fill="#bae6fd">
        Follow-up 1, 2, 3
      </text>
      <line x1="222" y1="100" x2="256" y2="100" stroke="#1c3540" strokeWidth="1.5" />
      <line x1="256" y1="100" x2="256" y2="46" stroke="#1c3540" strokeWidth="1.5" />
      <line x1="256" y1="100" x2="256" y2="154" stroke="#1c3540" strokeWidth="1.5" />
      <rect x="258" y="28" width="76" height="36" rx="9" fill="#0f1b14" stroke="#1e3a2a" />
      <text x="296" y="50" textAnchor="middle" fontSize="10" fill="#6ee7b7">
        Booked
      </text>
      <rect x="258" y="136" width="76" height="36" rx="9" fill="#150e0a" stroke="#3a2a1f" />
      <text x="296" y="155" textAnchor="middle" fontSize="9.5" fill="#f0b979">
        Opts out
      </text>
      <text x="296" y="166" textAnchor="middle" fontSize="7.5" fill="#f0b979" opacity="0.75">
        sequence stops
      </text>
    </svg>
  );
}

export default function LeadCaptureDemoPage() {
  const service = getService("ai-lead-capture");
  const checkoutUrl = service ? getSetupCheckoutUrl(service) : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-300/70">Live demo &middot; simulated</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            No enquiry waits for someone to be free.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
            The moment someone submits a form, they get a real reply, not an autoresponder. If they do not book,
            they stay in a short follow-up sequence, not a spreadsheet nobody checks. The sequence stops the moment
            they book or ask to stop.
          </p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/35">The sequence</p>
            <div className="mt-3">
              <AgentDiagram />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-sm">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-2xl font-extrabold text-sky-300">Instant</p>
              <p className="mt-1 text-xs text-white/45">first reply, day or night</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-2xl font-extrabold text-sky-300">3</p>
              <p className="mt-1 text-xs text-white/45">follow-ups before it gives up</p>
            </div>
          </div>

          {checkoutUrl && (
            <div className="mt-10 rounded-2xl border border-sky-300/30 bg-sky-400/[0.06] p-6 sm:max-w-md">
              <p className="text-sm font-semibold text-white">Ready to stop losing enquiries?</p>
              <p className="mt-1 text-xs leading-5 text-white/55">
                Wires into the forms you already use. Live in 2 to 7 days.
              </p>
              <a
                href={checkoutUrl}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky-300 px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Get AI Lead Capture & Follow-Up
              </a>
            </div>
          )}

          <Link
            href="/services/ai-lead-capture-follow-up"
            className="mt-6 inline-block text-xs text-white/40 hover:text-white/70"
          >
            &larr; Back to AI Lead Capture & Follow-Up
          </Link>
        </div>

        <div className="lg:sticky lg:top-16">
          <LeadCaptureDemo />
          <p className="mt-3 text-center text-[11px] text-white/30 lg:text-left">
            Simulated enquiry &middot; no real form submission or message is sent here
          </p>
        </div>
      </div>
    </div>
  );
}
