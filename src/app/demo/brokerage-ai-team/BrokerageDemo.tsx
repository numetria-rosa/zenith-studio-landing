"use client";

import { useState } from "react";

/* Purely simulated - unlike the Law Firm AI Team demo, none of the three
   roles here (Inside Sales Agent, Transaction Coordinator, Database
   Manager) has a generic runtime built yet; each brokerage client's build
   is custom. This shows the intended workflow, not a packaged product
   already running for real brokerages - framed as such in the page copy,
   never claimed as already-live anywhere. */

type StepStatus = "pending" | "active" | "done";
type Phase = "idle" | "running" | "done";

const STEPS = [
  { id: "isa", label: "Inside Sales" },
  { id: "tc", label: "Transaction" },
  { id: "dbm", label: "Database" },
] as const;

export default function BrokerageDemo() {
  const [current, setCurrent] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [phases, setPhases] = useState<[Phase, Phase, Phase]>(["idle", "idle", "idle"]);
  const [logStep, setLogStep] = useState(0);

  function setPhaseAt(index: number, phase: Phase) {
    setPhases((p) => {
      const next = [...p] as [Phase, Phase, Phase];
      next[index] = phase;
      return next;
    });
  }

  function runStep(index: number) {
    setPhaseAt(index, "running");
    setLogStep(0);
    const lineDelay = 550;
    for (let i = 1; i <= 3; i++) {
      setTimeout(() => setLogStep(i), i * lineDelay);
    }
    setTimeout(() => {
      setPhaseAt(index, "done");
      if (index < 2) {
        setUnlocked((u) => Math.max(u, index + 1));
        setCurrent(index + 1);
      }
    }, 4 * lineDelay);
  }

  function statusFor(index: number): StepStatus {
    if (phases[index] === "done") return "done";
    if (index === current) return "active";
    return "pending";
  }

  function selectStep(index: number) {
    if (index <= unlocked) setCurrent(index);
  }

  const railColor = (status: StepStatus) =>
    status === "done" ? "text-emerald-400" : status === "active" ? "text-sky-300" : "text-white/30";

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#060a0d] font-[family-name:var(--font-mono,monospace)]">
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
        <div className="border-b border-white/10 bg-[#0a1216] py-5 sm:border-b-0 sm:border-r">
          <div className="px-5 pb-3 text-[10px] uppercase tracking-[0.1em] text-white/30">Pipeline</div>
          <div className="flex gap-2 px-2 sm:flex-col sm:gap-0 sm:px-0">
            {STEPS.map((step, i) => {
              const status = statusFor(i);
              const clickable = i <= unlocked;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => selectStep(i)}
                  disabled={!clickable}
                  className={`flex flex-1 items-center gap-2.5 border-l-2 px-4 py-3 text-left text-[11.5px] transition sm:flex-none ${
                    status === "active" ? "border-sky-300 bg-sky-400/[0.06]" : "border-transparent"
                  } ${clickable ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current ${railColor(status)}`} />
                  <span className={railColor(status)}>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-7 sm:p-9">
          {current === 0 && (
            <StepPanel
              liveLabel="AI Inside Sales Agent"
              heading="A new lead hits your site at 9:40pm."
              sub="Zillow inquiry &middot; 3br in Maple Heights"
              phase={phases[0]}
              logStep={logStep}
              logLines={["Lead submitted", "Qualifying motivation & timeline", "Checking financing status"]}
              onRun={() => runStep(0)}
              runLabel="Simulate a new lead"
              result={
                <>
                  &ldquo;Hi, thanks for reaching out about the Maple Heights listing! Are you looking to move in the
                  next few months, and have you started the financing conversation yet?&rdquo;
                  <div className="mt-2 text-[10px] uppercase tracking-[0.08em] text-emerald-400/80">
                    Replied in 12 seconds, appointment offered
                  </div>
                </>
              }
            />
          )}
          {current === 1 && (
            <StepPanel
              liveLabel="AI Transaction Coordinator"
              heading="A deal just went under contract."
              sub="412 Birchwood Ave &middot; closing in 28 days"
              phase={phases[1]}
              logStep={logStep}
              logLines={["Contract received", "Inspection deadline: 7 days", "Lender docs requested"]}
              onRun={() => runStep(1)}
              runLabel="Simulate contract to close"
              result={
                <>
                  &ldquo;Reminder: inspection contingency expires Friday. Lender still needs the buyer&apos;s updated
                  pay stubs, follow-up sent automatically.&rdquo;
                  <div className="mt-2 text-[10px] uppercase tracking-[0.08em] text-emerald-400/80">
                    Every party notified, nobody had to ask
                  </div>
                </>
              }
            />
          )}
          {current === 2 && (
            <StepPanel
              liveLabel="AI Database Manager"
              heading="A past client from 18 months ago, gone quiet."
              sub="CRM contact &middot; last touch: 2025-03"
              phase={phases[2]}
              logStep={logStep}
              logLines={["Scanning dormant contacts", "412 contacts, no touch in 6+ months", "Drafting check-in for top 40"]}
              onRun={() => runStep(2)}
              runLabel="Run the dormant database"
              result={
                <>
                  &ldquo;Hey Sarah, it&apos;s been a while! Just checking in, how&apos;s the house treating you? Let me
                  know if you ever think about that investment property we talked about.&rdquo;
                  <div className="mt-2 text-[10px] uppercase tracking-[0.08em] text-emerald-400/80">
                    40 check-ins drafted, waiting on your send
                  </div>
                </>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StepPanel({
  liveLabel,
  heading,
  sub,
  phase,
  logStep,
  logLines,
  onRun,
  runLabel,
  result,
}: {
  liveLabel: string;
  heading: string;
  sub: React.ReactNode;
  phase: Phase;
  logStep: number;
  logLines: [string, string, string];
  onRun: () => void;
  runLabel: string;
  result: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.08em] text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Live &middot; {liveLabel}
      </div>
      <h3 className="mt-2 font-sans text-lg font-semibold text-white">{heading}</h3>
      <p className="mt-1 text-[12px] text-white/40">{sub}</p>

      {phase === "idle" && (
        <button
          type="button"
          onClick={onRun}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-300 px-5 py-2.5 font-sans text-xs font-bold text-black transition hover:scale-[1.02]"
        >
          {runLabel}
        </button>
      )}

      {phase !== "idle" && (
        <div className="mt-5">
          {logLines.map((line, i) => (
            <div
              key={line}
              className={`flex gap-3 border-b border-white/5 py-2 text-[11.5px] transition-opacity duration-300 ${
                i < logStep ? "opacity-100" : "opacity-0"
              } ${i === logStep - 1 && phase === "running" ? "text-sky-300" : "text-white/50"}`}
            >
              <span className="text-white/25">{String(i * 4).padStart(2, "0")}:00</span>
              <span>{line}</span>
            </div>
          ))}
          {phase === "done" && (
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] leading-6 text-white/80">
              {result}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
