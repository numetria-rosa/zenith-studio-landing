"use client";

import { useState } from "react";

/* Purely simulated, "live ops console" treatment - no real SignalWire
   number, Groq call, or Cal.com booking fires here, on purpose (see
   demo-number-policy.md and the "never demo against real client infra"
   principle in memory). Text-Back, Follow-Up Clerk, and Billing Clerk are
   all real and live already (signalwire-text-back.ts, follow-up-clerk.ts,
   billing-clerk.ts); this page's only job is showing a prospect what those
   three already do, framed like watching the real admin console rather
   than a marketing slideshow - every string below is illustrative example
   content, never live data. */

type StepStatus = "pending" | "active" | "done";
type Phase = "idle" | "running" | "done";

const STEPS = [
  { id: "textback", label: "Text-back" },
  { id: "followup", label: "Follow-up" },
  { id: "billing", label: "Billing" },
] as const;

export default function FirmLeakDemo() {
  const [current, setCurrent] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [phases, setPhases] = useState<[Phase, Phase, Phase]>(["idle", "idle", "idle"]);
  const [logStep, setLogStep] = useState(0); // how many log lines are revealed for the current running step

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
      if (index < 2) setUnlocked((u) => Math.max(u, index + 1));
    }, 4 * lineDelay);
  }

  function goToNextStep(index: number) {
    setCurrent(index + 1);
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
    status === "done" ? "text-emerald-400" : status === "active" ? "text-amber-300" : "text-white/30";

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0d0d] font-[family-name:var(--font-mono,monospace)]">
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
        {/* Rail */}
        <div className="border-b border-white/10 bg-[#0f1414] py-5 sm:border-b-0 sm:border-r">
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
                    status === "active" ? "border-amber-300 bg-amber-400/[0.06]" : "border-transparent"
                  } ${clickable ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current ${railColor(status)}`} />
                  <span className={railColor(status)}>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main panel */}
        <div className="p-7 sm:p-9">
          {current === 0 && (
            <StepPanel
              liveLabel="AI Missed Call Text-Back"
              heading="A caller hangs up after one ring, unanswered."
              sub={<>(614) 555-0148 &middot; Reeves &amp; Cole intake line</>}
              phase={phases[0]}
              logStep={logStep}
              logLines={["Incoming call detected", "1 ring, no answer", "Drafting text-back"]}
              onRun={() => runStep(0)}
              runLabel="Simulate a missed call"
              result={
                <>
                  &ldquo;Hi, this is Reeves &amp; Cole&apos;s AI assistant. Sorry we missed you - if this is about a
                  recent accident, reply YES and I can get some quick details started.&rdquo;
                  <div className="mt-2 text-[10px] uppercase tracking-[0.08em] text-emerald-400/80">
                    Sent in 8 seconds
                  </div>
                </>
              }
              onContinue={() => goToNextStep(0)}
              continueLabel="Continue to Follow-up"
            />
          )}
          {current === 1 && (
            <StepPanel
              liveLabel="AI Follow-Up Clerk"
              heading="The lead replies once, then goes quiet."
              sub={<>(614) 555-0148 &middot; last reply 24 hours ago</>}
              phase={phases[1]}
              logStep={logStep}
              logLines={["Inbound reply received", "No response after 24h, flagged stale", "Moved to Stale Leads queue"]}
              onRun={() => runStep(1)}
              runLabel="Simulate the lead going quiet"
              result={
                <>
                  &ldquo;Just checking back in - still want to talk through what happened? Totally fine either way,
                  just say the word.&rdquo;
                  <div className="mt-2 text-[10px] uppercase tracking-[0.08em] text-emerald-400/80">
                    Day 2 follow-up, drafted
                  </div>
                </>
              }
              onContinue={() => goToNextStep(1)}
              continueLabel="Continue to Billing"
            />
          )}
          {current === 2 && (
            <StepPanel
              liveLabel="AI Billing Clerk"
              heading="A day's calendar, reconstructed into billable entries."
              sub={<>Attorney: D. Tschantz &middot; today&apos;s calendar</>}
              phase={phases[2]}
              logStep={logStep}
              logLines={[
                "9:00 Client call - Smith v. Acme Freight",
                "11:00 Deposition prep - Whitfield matter",
                "2:00 Client meeting - Rodriguez intake",
              ]}
              onRun={() => runStep(2)}
              runLabel="Run billing reconstruction"
              result={
                <>
                  <div className="flex flex-col gap-2 font-sans">
                    <div className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2 text-[12.5px] text-emerald-100/90">
                      0.6h &middot; Smith v. Acme Freight - &ldquo;Client call regarding treatment status and
                      outstanding medical records.&rdquo;
                    </div>
                    <div className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2 text-[12.5px] text-emerald-100/90">
                      1.2h &middot; Whitfield matter - &ldquo;Prepared deposition outline and reviewed prior
                      testimony.&rdquo;
                    </div>
                    <div className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2 text-[12.5px] text-emerald-100/90">
                      0.8h &middot; Rodriguez intake - &ldquo;Initial client meeting, discussed case timeline and next
                      steps.&rdquo;
                    </div>
                  </div>
                  <div className="mt-3 rounded-md border border-amber-300/25 bg-amber-400/[0.06] px-3 py-2.5 font-sans text-[12px] text-amber-100/90">
                    <strong>2.6 hours reconstructed</strong> from one day - every entry above still waits for a
                    partner to approve before it counts toward anything.
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
  onContinue,
  continueLabel,
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
  onContinue?: () => void;
  continueLabel?: string;
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
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 font-sans text-xs font-bold text-black transition hover:scale-[1.02]"
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
              } ${i === logStep - 1 && phase === "running" ? "text-amber-300" : "text-white/50"}`}
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
          {phase === "done" && onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-sans text-xs font-bold text-black transition hover:scale-[1.02]"
            >
              {continueLabel} &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
