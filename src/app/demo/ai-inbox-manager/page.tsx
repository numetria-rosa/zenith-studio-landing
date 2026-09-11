import type { Metadata } from "next";
import Link from "next/link";
import InboxManagerDemo from "./InboxManagerDemo";
import { getService, getSetupCheckoutUrl } from "@/lib/services";

export const metadata: Metadata = { title: "AI Inbox Manager Demo" };

function AgentDiagram() {
  return (
    <svg viewBox="0 0 340 180" className="w-full" role="img" aria-label="Email arrives, AI triages it, then either drafts a reply or flags it for a human">
      <defs>
        <linearGradient id="im-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fcd34d" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="170" cy="88" r="46" fill="url(#im-glow)" />
      <rect x="8" y="70" width="86" height="36" rx="9" fill="#15130d" stroke="#3a331f" />
      <text x="51" y="93" textAnchor="middle" fontSize="11" fill="#e7dcb8" fontFamily="ui-sans-serif">
        Email arrives
      </text>
      <line x1="94" y1="88" x2="130" y2="88" stroke="#4a4023" strokeWidth="1.5" />
      <circle cx="170" cy="88" r="32" fill="#1a1610" stroke="#fcd34d" strokeWidth="1.5" />
      <text x="170" y="84" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#fcd34d">
        AI
      </text>
      <text x="170" y="97" textAnchor="middle" fontSize="9" fill="#fcd34d">
        Triage
      </text>
      <line x1="198" y1="76" x2="238" y2="34" stroke="#4a4023" strokeWidth="1.5" />
      <line x1="198" y1="100" x2="238" y2="142" stroke="#4a4023" strokeWidth="1.5" />
      <rect x="240" y="16" width="94" height="36" rx="9" fill="#0f1b14" stroke="#1e3a2a" />
      <text x="287" y="35" textAnchor="middle" fontSize="10" fill="#6ee7b7" fontFamily="ui-sans-serif">
        Draft reply
      </text>
      <text x="287" y="47" textAnchor="middle" fontSize="8" fill="#6ee7b7" opacity="0.7">
        routine
      </text>
      <rect x="240" y="124" width="94" height="36" rx="9" fill="#1a1207" stroke="#3a331f" />
      <text x="287" y="143" textAnchor="middle" fontSize="10" fill="#fcd34d" fontFamily="ui-sans-serif">
        Flag for you
      </text>
      <text x="287" y="155" textAnchor="middle" fontSize="8" fill="#fcd34d" opacity="0.7">
        needs judgment
      </text>
    </svg>
  );
}

export default function InboxManagerDemoPage() {
  const service = getService("ai-inbox-manager");
  const checkoutUrl = service ? getSetupCheckoutUrl(service) : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">
        {/* Left: copy + diagram */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/70">Live demo &middot; simulated</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your inbox, sorted before you open it.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
            Every email gets read and classified the moment it lands. Routine ones (scheduling, document
            confirmations, simple questions) get a drafted reply waiting for your send. Anything with judgment
            involved - a complaint, a dispute, something unusual - gets left for you, clearly marked.
          </p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/35">How it decides</p>
            <div className="mt-3">
              <AgentDiagram />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-sm">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-2xl font-extrabold text-amber-300">Gmail</p>
              <p className="mt-1 text-xs text-white/45">personal accounts, and Yahoo Mail</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-2xl font-extrabold text-emerald-300">0</p>
              <p className="mt-1 text-xs text-white/45">replies sent without your approval</p>
            </div>
          </div>

          {checkoutUrl && (
            <div className="mt-10 rounded-2xl border border-amber-300/30 bg-amber-400/[0.06] p-6 sm:max-w-md">
              <p className="text-sm font-semibold text-white">Ready for your own inbox?</p>
              <p className="mt-1 text-xs leading-5 text-white/55">
                Connects to your real Gmail or Yahoo Mail with an app password, live in 2 to 4 days.
              </p>
              <a
                href={checkoutUrl}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-amber-300 px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Get the AI Inbox Manager
              </a>
            </div>
          )}

          <Link
            href="/services/ai-inbox-manager"
            className="mt-6 inline-block text-xs text-white/40 hover:text-white/70"
          >
            &larr; Back to AI Inbox Manager
          </Link>
        </div>

        {/* Right: the interactive sandbox, offset from center on purpose */}
        <div className="lg:sticky lg:top-16">
          <InboxManagerDemo />
          <p className="mt-3 text-center text-[11px] text-white/30 lg:text-left">
            Simulated inbox &middot; no real email is read or sent here
          </p>
        </div>
      </div>
    </div>
  );
}
