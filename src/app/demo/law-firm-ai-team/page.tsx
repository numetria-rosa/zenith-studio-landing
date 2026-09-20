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

/* Orbital hub-and-spoke layout: "Your Firm" as a glowing center node with
   the three agents arced beneath it, connected by curved gradient paths.
   Replaces the old flat row-of-boxes diagram (Pinterest/Dribbble pass on
   modern dark AI-agent orchestration UIs: radial glow hubs, curved dashed
   connectors, icon-badge nodes rather than plain text boxes). */
const AGENTS = [
  {
    cx: 76,
    cy: 224,
    label: "Text-Back",
    sub: "Missed call → texted back",
    icon: (
      <path
        d="M-2 -4c0 4.1 3.3 7.5 7.5 7.5v-1.6c0-.25-.15-.45-.4-.5l-1.5-.35c-.2-.05-.4 0-.55.15l-.6.6a6 6 0 0 1-2.75-2.75l.6-.6c.15-.15.2-.35.15-.55l-.35-1.5c-.05-.25-.25-.4-.5-.4H-2Z"
        stroke="#0a1216"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    cx: 202,
    cy: 250,
    label: "Follow-Up",
    sub: "Quiet lead → worked",
    icon: <path d="M-8 4 8 -8l-3 11-3.5 -3.5Z" stroke="#0a1216" strokeWidth="1.4" strokeLinejoin="round" fill="none" />,
  },
  {
    cx: 328,
    cy: 224,
    label: "Billing",
    sub: "Time → billing draft",
    icon: (
      <>
        <path d="M-6 -8h6l4 4v12H-6Z" stroke="#0a1216" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
        <path d="M0 -8v4h4M-3 3h6M-3 6.5h6" stroke="#0a1216" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
];

function AgentDiagram() {
  const hub = { cx: 202, cy: 64 };
  return (
    <svg
      viewBox="0 0 404 326"
      className="w-full"
      role="img"
      aria-label="Your firm at the center, connected to three AI agents: Text-Back, Follow-Up, and Billing"
    >
      <defs>
        <radialGradient id="hub-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fcd34d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#fcd34d" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {AGENTS.map((a) => (
        <path
          key={a.label}
          d={`M${hub.cx},${hub.cy + 30} C${hub.cx},${(hub.cy + a.cy) / 2} ${a.cx},${(hub.cy + a.cy) / 2} ${a.cx},${a.cy - 30}`}
          fill="none"
          stroke="url(#line-grad)"
          strokeWidth="1.5"
          strokeDasharray="1 6"
          strokeLinecap="round"
        />
      ))}

      <circle cx={hub.cx} cy={hub.cy} r="54" fill="url(#hub-glow)" />
      <circle cx={hub.cx} cy={hub.cy} r="38" fill="#0a1216" stroke="#fcd34d" strokeWidth="1.75" />
      <text x={hub.cx} y={hub.cy - 3} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fcd34d" fontStyle="italic">
        Your Firm
      </text>
      <text x={hub.cx} y={hub.cy + 14} textAnchor="middle" fontSize="9" fill="#fde68a" opacity="0.75" letterSpacing="0.04em">
        AI TEAM
      </text>

      {AGENTS.map((a) => (
        <g key={a.label}>
          <circle cx={a.cx} cy={a.cy} r="34" fill="url(#hub-glow)" opacity="0.5" />
          <circle cx={a.cx} cy={a.cy} r="26" fill="#fcd34d" />
          <g transform={`translate(${a.cx}, ${a.cy})`}>{a.icon}</g>
          <text x={a.cx} y={a.cy + 46} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fdfaf3">
            {a.label}
          </text>
          <text x={a.cx} y={a.cy + 62} textAnchor="middle" fontSize="9.5" fill="#fde68a" opacity="0.65">
            {a.sub}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function FirmLeakDemoPage() {
  const service = getService("law-firms");
  const checkoutUrl = service ? getMonthlyCheckoutUrl(service) : null;
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 32% at 105% -8%, rgba(252,211,77,.16), transparent 55%), radial-gradient(ellipse 50% 28% at -8% 60%, rgba(252,211,77,.07), transparent 60%)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-14 px-4 py-20 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">
        <div>
          <p className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            The firm leak
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
            Watch where the hours and the <span className="italic text-amber-300">leads actually go.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/60">
            Three simulated steps, one after another: a missed call, a lead going quiet, and a day of billable time
            reconstructed. Nothing here calls a real phone or touches a real calendar; every number and message
            below is an example. The three engines it&apos;s built on (Text-Back, Follow-Up Clerk, Billing Clerk)
            are real and already live.
          </p>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,.6)] backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Three roles, one team</p>
            <div className="mt-4">
              <AgentDiagram />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 sm:max-w-md">
            {LEAK_STATS.map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-5 text-center shadow-[0_16px_40px_-20px_rgba(0,0,0,.5)]"
              >
                <p className="font-[family-name:var(--font-fraunces,serif)] text-xl font-bold tracking-tight text-amber-300">
                  {s.n}
                </p>
                <p className="mt-1.5 text-[10.5px] leading-tight text-white/50">{s.l}</p>
              </div>
            ))}
          </div>

          {checkoutUrl && (
            <div className="mt-10 rounded-3xl border border-amber-300/30 bg-amber-400/[0.07] p-7 shadow-[0_24px_60px_-24px_rgba(252,211,77,.25)] sm:max-w-md">
              <p className="inline-flex items-center rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-300">
                3-day free trial
              </p>
              <p className="mt-3 text-base font-semibold text-white">Ready for your own firm?</p>
              <p className="mt-1.5 text-xs leading-5 text-white/55">
                One system for intake, follow-up, and billing recovery. You approve every entry. Try it free for 3
                days, then {service?.monthlyPriceDisplay} if you keep it.
              </p>
              <a
                href={checkoutUrl}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-amber-300 px-6 py-3.5 text-sm font-semibold text-black shadow-[0_16px_40px_-16px_rgba(252,211,77,.6)] transition hover:scale-[1.02]"
              >
                Start your 3-day free trial
              </a>
            </div>
          )}

          <Link href="/services/law-firm-ai-team" className="mt-7 inline-block text-xs text-white/40 hover:text-white/70">
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
