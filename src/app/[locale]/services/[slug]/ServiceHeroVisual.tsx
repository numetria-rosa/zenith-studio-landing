"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";

function Glass({
  children,
  className = "",
  glow = "amber",
}: {
  children: ReactNode;
  className?: string;
  glow?: "amber" | "cyan" | "violet";
}) {
  const glowClass =
    glow === "cyan"
      ? "shadow-[0_20px_60px_rgba(56,189,248,0.16)]"
      : glow === "violet"
        ? "shadow-[0_20px_60px_rgba(167,139,250,0.18)]"
        : "shadow-[0_20px_60px_rgba(251,146,60,0.2)]";

  return (
    <div
      className={`rounded-[20px] border border-white/20 bg-white/[0.08] p-4 backdrop-blur-2xl ${glowClass} ${className}`}
    >
      {children}
    </div>
  );
}

function Float({
  delay,
  duration,
  children,
}: {
  delay: string;
  duration: string;
  children: ReactNode;
}) {
  return (
    <div
      className="zs-float will-change-transform"
      style={{ animation: `zs-float ${duration} ease-in-out ${delay} infinite` }}
    >
      {children}
    </div>
  );
}

function InboxVisual() {
  return (
    <div className="grid gap-3">
      <Float duration="5.5s" delay="0s">
        <Glass>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">Inbox · Gmail</p>
            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] text-emerald-300">Sorted</span>
          </div>
          <div className="mt-3 space-y-2">
            {[
              ["Tax return documents", "Draft reply ready", "routine"],
              ["Can we move Thursday?", "Scheduling · drafted", "routine"],
              ["Fee dispute, Q2 invoice", "Needs you", "human"],
            ].map(([title, meta, kind]) => (
              <div key={title} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                <p className="text-sm font-semibold">{title}</p>
                <p className={`mt-0.5 text-xs ${kind === "human" ? "text-amber-300" : "text-white/50"}`}>{meta}</p>
              </div>
            ))}
          </div>
        </Glass>
      </Float>
      <div className="grid grid-cols-2 gap-3">
        <Float duration="6.4s" delay="0.4s">
          <Glass glow="cyan" className="h-full">
            <p className="text-[11px] text-white/45">Drafted in</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-400">14s</p>
            <p className="mt-1 text-xs text-white/50">Client never sees the wait</p>
          </Glass>
        </Float>
        <Float duration="7s" delay="0.8s">
          <Glass glow="violet" className="h-full">
            <p className="text-[11px] text-white/45">Left for you</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight">1</p>
            <p className="mt-1 text-xs text-white/50">Exceptions only</p>
          </Glass>
        </Float>
      </div>
    </div>
  );
}

function LeadVisual() {
  return (
    <div className="grid gap-3">
      <Float duration="5.2s" delay="0s">
        <Glass>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">New enquiry</p>
            <span className="text-[11px] text-white/40">web form · now</span>
          </div>
          <p className="mt-2 text-sm font-semibold">Invisalign consult, Dallas</p>
          <p className="mt-1 text-xs text-white/50">Name, phone, and preferred time captured</p>
          <div className="mt-3 flex gap-2 text-[11px]">
            <span className="rounded-full bg-white/10 px-2 py-1">Qualified</span>
            <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-emerald-300">High intent</span>
          </div>
        </Glass>
      </Float>
      <Float duration="6s" delay="0.35s">
        <Glass glow="cyan">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">SMS + email follow-up</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white/10 px-3 py-2">
              Thanks for requesting a consult. We have Thursday 9:40 or Friday 2:15. Which works?
            </div>
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-sky-500/25 px-3 py-2">
              Thursday 9:40 please
            </div>
          </div>
          <p className="mt-3 text-xs text-white/45">Follow-up 1 of 4 · stops when they book or opt out</p>
        </Glass>
      </Float>
      <Float duration="6.8s" delay="0.7s">
        <Glass glow="violet">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300">Booked</p>
              <p className="mt-1 text-lg font-extrabold tracking-tight">Thu 9:40 · consult</p>
            </div>
            <span className="text-2xl font-extrabold text-emerald-400">✓</span>
          </div>
          <p className="mt-1 text-xs text-white/50">Written to the practice calendar. Sequence closed.</p>
        </Glass>
      </Float>
    </div>
  );
}

function ReceptionVisual() {
  return (
    <div className="grid gap-3">
      <Float duration="5.4s" delay="0s">
        <Glass>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">Incoming · 21:14</p>
            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] text-emerald-300">Answered</span>
          </div>
          <p className="mt-2 text-sm font-semibold">“Do you have anything tomorrow morning?”</p>
          <p className="mt-1 text-xs text-white/50">After hours · common question handled</p>
        </Glass>
      </Float>
      <Float duration="6.2s" delay="0.4s">
        <Glass glow="cyan">
          <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-200">Calendar</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            {[
              ["9:00", "taken"],
              ["10:30", "open"],
              ["14:00", "taken"],
            ].map(([t, s]) => (
              <div
                key={t}
                className={`rounded-xl border px-2 py-3 ${
                  s === "open" ? "border-amber-300/50 bg-amber-400/15 text-amber-100" : "border-white/10 bg-black/25 text-white/40"
                }`}
              >
                {t}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-white/50">Offered 10:30 · booked into your existing calendar</p>
        </Glass>
      </Float>
      <Float duration="7s" delay="0.75s">
        <Glass glow="violet">
          <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300">Reminder sent</p>
          <p className="mt-1 text-sm font-semibold">Tomorrow 10:30 · confirmation + no-show reminder</p>
        </Glass>
      </Float>
    </div>
  );
}

function LawVisual() {
  return (
    <div className="grid gap-3">
      <Float duration="5.3s" delay="0s">
        <Glass>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">Free case evaluation</p>
          <p className="mt-2 text-sm font-semibold">Motor vehicle · Houston</p>
          <p className="mt-1 text-xs text-white/50">Injury date, insurer, and treatment captured</p>
        </Glass>
      </Float>
      <Float duration="6.1s" delay="0.35s">
        <Glass glow="cyan">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Qualification</p>
            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] text-emerald-300">In scope</span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-white/60">
            <p>Liability signal · yes</p>
            <p>Treatment started · yes</p>
            <p>Conflicts · none flagged</p>
          </div>
        </Glass>
      </Float>
      <Float duration="6.9s" delay="0.7s">
        <Glass glow="violet">
          <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300">Consult booked</p>
          <p className="mt-1 text-lg font-extrabold tracking-tight">Mon 11:00 · intake attorney</p>
          <p className="mt-1 text-xs text-white/50">Follow-up stops. File stays with the firm.</p>
        </Glass>
      </Float>
    </div>
  );
}

function BrokerVisual() {
  return (
    <div className="grid gap-3">
      <Float duration="5.4s" delay="0s">
        <Glass>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">Seller enquiry</p>
          <p className="mt-2 text-sm font-semibold">Valuation · Oak Lawn 3 bed</p>
          <p className="mt-1 text-xs text-white/50">Budget, timing, and address captured</p>
        </Glass>
      </Float>
      <Float duration="6.2s" delay="0.4s">
        <Glass glow="cyan">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-200">Viewing booked</p>
              <p className="mt-1 text-lg font-extrabold tracking-tight">Sat 11:00</p>
            </div>
            <span className="text-xs text-white/45">Agent assigned</span>
          </div>
          <p className="mt-2 text-xs text-white/50">Buyer qualified. Written to the diary.</p>
        </Glass>
      </Float>
      <Float duration="7s" delay="0.75s">
        <Glass glow="violet">
          <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300">Database</p>
          <p className="mt-1 text-sm font-semibold">14 dormant contacts woken this week</p>
          <p className="mt-1 text-xs text-white/50">Sequences you approved. Agents are not the CRM.</p>
        </Glass>
      </Float>
    </div>
  );
}

const VISUALS: Record<string, () => ReactNode> = {
  "ai-inbox-manager": InboxVisual,
  "ai-lead-capture": LeadVisual,
  "ai-receptionist": ReceptionVisual,
  "law-firms": LawVisual,
  brokerages: BrokerVisual,
};

export default function ServiceHeroVisual({ serviceId }: { serviceId: string }) {
  const stageRef = useRef<HTMLDivElement>(null);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1200px) rotateY(${x * 7}deg) rotateX(${-y * 5}deg)`;
  }

  function onLeave() {
    const el = stageRef.current;
    if (!el) return;
    el.style.transform = "perspective(1200px) rotateY(0deg) rotateX(0deg)";
  }

  const Visual = VISUALS[serviceId] ?? LeadVisual;

  return (
    <div className="relative flex items-center justify-center py-4">
      <div className="pointer-events-none absolute inset-y-8 inset-x-6 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.26),transparent_64%)] blur-2xl" />
      <div
        ref={stageRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="relative w-full max-w-[460px] transition-transform duration-200 ease-out will-change-transform"
        style={{ transform: "perspective(1200px) rotateY(0deg) rotateX(0deg)" }}
      >
        <Visual />
      </div>
    </div>
  );
}
