import { Phone, Brain, MessageCircleQuestion, CalendarCheck, UserCheck, ArrowRight } from "lucide-react";

/* A real architecture diagram for the AI Receptionist, not a decorative
   mockup: caller in, AI agent in the middle, the three actual outcomes the
   runtime engine produces (src/lib/vapi.ts's buildAssistantPayload and
   runBookAppointment), an AI-generated diagram would draw a generic
   robot-and-gears illustration, this draws the real three-way branch a
   call actually takes. */

function Node({
  icon: Icon,
  label,
  detail,
  accent = "white",
}: {
  icon: typeof Phone;
  label: string;
  detail: string;
  accent?: "white" | "amber" | "cyan" | "emerald" | "violet";
}) {
  const accentClasses: Record<string, string> = {
    white: "border-white/15 bg-white/[0.04] text-white/80",
    amber: "border-amber-300/30 bg-amber-400/10 text-amber-200",
    cyan: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200",
    emerald: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
    violet: "border-violet-300/30 bg-violet-400/10 text-violet-200",
  };
  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl border px-4 py-5 text-center ${accentClasses[accent]}`}>
      <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="text-xs leading-5 text-white/55">{detail}</p>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center px-1 text-white/25 lg:rotate-0">
      <ArrowRight className="hidden h-5 w-5 lg:block" strokeWidth={1.5} aria-hidden />
      <ArrowRight className="h-5 w-5 rotate-90 lg:hidden" strokeWidth={1.5} aria-hidden />
    </div>
  );
}

export default function ReceptionistFlowDiagram() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">How the AI agent decides what to do</h2>
      <div className="mt-6 flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
        <Node icon={Phone} label="Caller" detail="Calls your number, any time" accent="white" />
        <Connector />
        <Node icon={Brain} label="AI Receptionist" detail="Listens and understands the request" accent="amber" />
        <Connector />
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          <Node icon={MessageCircleQuestion} label="Answers" detail="Hours, services, pricing, from what you gave it" accent="cyan" />
          <Node icon={CalendarCheck} label="Books" detail="Checks your real calendar, confirms a slot" accent="emerald" />
          <Node icon={UserCheck} label="Escalates" detail="Anything it shouldn't answer goes to your team" accent="violet" />
        </div>
      </div>
      <p className="mt-5 text-xs leading-6 text-white/40">
        Every call runs through this same decision every time, nothing is scripted by hand per caller. What it
        knows and does comes entirely from the business details you give it during setup.
      </p>
    </div>
  );
}
