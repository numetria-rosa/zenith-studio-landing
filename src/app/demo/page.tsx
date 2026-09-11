import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Try Every AI System" };

type DemoCard = {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  glow: string;
  tag: string;
};

const DEMOS: DemoCard[] = [
  {
    href: "/demo/ai-receptionist",
    eyebrow: "AI Receptionist",
    title: "Call it. Really.",
    description: "A real phone line answers, books onto a real calendar, and the booking shows up live on screen.",
    accent: "border-emerald-400/30 hover:border-emerald-400/60",
    glow: "bg-emerald-400/10",
    tag: "Real phone line",
  },
  {
    href: "/demo/ai-inbox-manager",
    eyebrow: "AI Inbox Manager",
    title: "Your inbox, sorted.",
    description: "Run AI triage on a sample inbox and watch it split routine replies from anything that needs you.",
    accent: "border-amber-300/30 hover:border-amber-300/60",
    glow: "bg-amber-300/10",
    tag: "Sandboxed",
  },
  {
    href: "/demo/ai-lead-capture-follow-up",
    eyebrow: "AI Lead Capture & Follow-Up",
    title: "No enquiry waits.",
    description: "Submit a fake enquiry and watch it get qualified, followed up, and booked, step by step.",
    accent: "border-sky-300/30 hover:border-sky-300/60",
    glow: "bg-sky-300/10",
    tag: "Sandboxed",
  },
  {
    href: "/demo/law-firm-ai-team",
    eyebrow: "Law Firm AI Team",
    title: "The Firm Leak.",
    description: "A 3-step ops console: a missed call, a lead going quiet, a day of billable time reconstructed.",
    accent: "border-amber-300/30 hover:border-amber-300/60",
    glow: "bg-amber-300/10",
    tag: "Simulated walkthrough",
  },
  {
    href: "/demo/brokerage-ai-team",
    eyebrow: "Brokerage AI Team",
    title: "Three roles, one team.",
    description: "Inside sales, transaction coordination, and a dormant database, all running the same console.",
    accent: "border-sky-300/30 hover:border-sky-300/60",
    glow: "bg-sky-300/10",
    tag: "Build preview",
  },
];

export default function DemoHubPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Try it yourself</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          Five AI systems. Pick one and see it work.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
          Every demo below is a real, click-through walkthrough of what actually gets built, not a screenshot or a
          sales video. The Receptionist runs on a real phone line and a real calendar; the rest are sandboxed so you
          can try them with zero setup.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DEMOS.map((demo, i) => (
            <Link
              key={demo.href}
              href={demo.href}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white/[0.02] p-6 transition hover:-translate-y-1 hover:bg-white/[0.04] ${demo.accent} ${
                i === 0 ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${demo.glow}`} />
              <span className="relative text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/40">
                {demo.eyebrow}
              </span>
              <h2 className="relative mt-2 text-xl font-extrabold tracking-tight">{demo.title}</h2>
              <p className="relative mt-2 flex-1 text-[13px] leading-5 text-white/55">{demo.description}</p>
              <div className="relative mt-5 flex items-center justify-between">
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] text-white/40">
                  {demo.tag}
                </span>
                <span className="text-sm font-semibold text-white/70 transition group-hover:translate-x-1 group-hover:text-white">
                  Try it &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>

        <Link href="/" className="mt-12 inline-block text-xs text-white/40 hover:text-white/70">
          &larr; Back to Zenith Studio
        </Link>
      </div>
    </div>
  );
}
