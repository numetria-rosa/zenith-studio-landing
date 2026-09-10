"use client";

import { useState } from "react";

/* Purely simulated — no real SignalWire number, Groq call, or Cal.com
   booking fires here, on purpose (see demo-number-policy.md and the "never
   demo against real client infra" principle in memory). Text-Back,
   Follow-Up Clerk, and Billing Clerk are all real and live already
   (signalwire-text-back.ts, follow-up-clerk.ts, billing-clerk.ts); this
   page's only job is showing a prospect what those three already do,
   without spinning up a real phone number or real Groq spend per demo
   view. Every string below is illustrative example content, never live
   data. */

type StepId = "textback" | "followup" | "billing";

function StepShell({
  id,
  active,
  done,
  index,
  title,
  subtitle,
  children,
}: {
  id: StepId;
  active: boolean;
  done: boolean;
  index: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={`rounded-2xl border p-6 transition ${
        active ? "border-amber-300/40 bg-amber-400/[0.04]" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            done ? "bg-amber-300 text-black" : "border border-white/20 text-white/50"
          }`}
        >
          {done ? "✓" : index}
        </span>
        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="text-xs text-white/50">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export default function FirmLeakDemo() {
  const [unlocked, setUnlocked] = useState<Record<StepId, boolean>>({ textback: true, followup: false, billing: false });
  const [textbackPhase, setTextbackPhase] = useState<"idle" | "ringing" | "sent">("idle");
  const [followupPhase, setFollowupPhase] = useState<"idle" | "ghosted" | "queued">("idle");
  const [billingPhase, setBillingPhase] = useState<"idle" | "drafting" | "done">("idle");

  function simulateCall() {
    setTextbackPhase("ringing");
    setTimeout(() => setTextbackPhase("sent"), 1100);
    setTimeout(() => setUnlocked((u) => ({ ...u, followup: true })), 1600);
  }

  function simulateGhost() {
    setFollowupPhase("ghosted");
    setTimeout(() => setFollowupPhase("queued"), 1300);
    setTimeout(() => setUnlocked((u) => ({ ...u, billing: true })), 1900);
  }

  function simulateBilling() {
    setBillingPhase("drafting");
    setTimeout(() => setBillingPhase("done"), 1400);
  }

  return (
    <div className="flex flex-col gap-5">
      <StepShell
        id="textback"
        index={1}
        active={unlocked.textback && textbackPhase === "idle"}
        done={textbackPhase === "sent"}
        title="AI Missed Call Text-Back"
        subtitle="A caller hangs up after one ring, unanswered."
      >
        {textbackPhase === "idle" && (
          <button
            type="button"
            onClick={simulateCall}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 text-xs font-bold text-black transition hover:scale-[1.02]"
          >
            Simulate a missed call
          </button>
        )}
        {textbackPhase !== "idle" && (
          <div className="flex flex-col gap-2">
            <div className="w-fit rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs text-white/60">
              Incoming call &middot; (614) 555-0148 &middot; 1 ring, no answer
            </div>
            {textbackPhase === "sent" && (
              <div className="mt-1 w-fit max-w-sm rounded-xl rounded-tl-sm border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                &ldquo;Hi, this is Reeves &amp; Cole&apos;s AI assistant. Sorry we missed you &mdash; if this is about
                a recent accident, reply YES and I can get some quick details started.&rdquo;
                <div className="mt-2 text-[10px] uppercase tracking-[0.08em] text-amber-300/70">Sent in 8 seconds</div>
              </div>
            )}
          </div>
        )}
      </StepShell>

      <StepShell
        id="followup"
        index={2}
        active={unlocked.followup && followupPhase === "idle"}
        done={followupPhase === "queued"}
        title="AI Follow-Up Clerk"
        subtitle="The lead replies once, then goes quiet."
      >
        {!unlocked.followup && <p className="text-xs text-white/40">Complete step 1 first.</p>}
        {unlocked.followup && followupPhase === "idle" && (
          <button
            type="button"
            onClick={simulateGhost}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 text-xs font-bold text-black transition hover:scale-[1.02]"
          >
            Simulate the lead going quiet
          </button>
        )}
        {followupPhase !== "idle" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="text-[10px] uppercase tracking-[0.08em] text-white/40">New</div>
              <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-xs text-white/50 line-through decoration-white/20">
                (614) 555-0148 &middot; replied once
              </div>
            </div>
            <div className="rounded-xl border border-amber-300/30 bg-amber-400/[0.06] p-3">
              <div className="text-[10px] uppercase tracking-[0.08em] text-amber-300/70">Stale leads &middot; follow-up queue</div>
              {followupPhase === "ghosted" && (
                <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-xs text-white/50">
                  Moving lead&hellip;
                </div>
              )}
              {followupPhase === "queued" && (
                <div className="mt-2 rounded-lg border border-amber-300/20 bg-black/30 p-2.5 text-xs text-amber-100">
                  &ldquo;Just checking back in &mdash; still want to talk through what happened? Totally fine either
                  way, just say the word.&rdquo;
                  <div className="mt-1.5 text-[10px] uppercase tracking-[0.08em] text-amber-300/70">
                    Day 2 follow-up, drafted
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </StepShell>

      <StepShell
        id="billing"
        index={3}
        active={unlocked.billing && billingPhase === "idle"}
        done={billingPhase === "done"}
        title="AI Billing Clerk"
        subtitle="A day's calendar, reconstructed into billable entries."
      >
        {!unlocked.billing && <p className="text-xs text-white/40">Complete step 2 first.</p>}
        {unlocked.billing && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/60">
              <div>9:00 &middot; Client call &mdash; Smith v. Acme Freight</div>
              <div>11:00 &middot; Deposition prep &mdash; Whitfield matter</div>
              <div>2:00 &middot; Client meeting &mdash; Rodriguez intake</div>
            </div>
            {billingPhase === "idle" && (
              <button
                type="button"
                onClick={simulateBilling}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 text-xs font-bold text-black transition hover:scale-[1.02]"
              >
                Run billing reconstruction
              </button>
            )}
            {billingPhase === "drafting" && <p className="text-xs text-white/50">Drafting entries&hellip;</p>}
            {billingPhase === "done" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <div className="rounded-lg border border-amber-300/20 bg-black/30 p-2.5 text-xs text-amber-100">
                    0.6h &middot; Smith v. Acme Freight &mdash; &ldquo;Client call regarding treatment status and
                    outstanding medical records.&rdquo;
                  </div>
                  <div className="rounded-lg border border-amber-300/20 bg-black/30 p-2.5 text-xs text-amber-100">
                    1.2h &middot; Whitfield matter &mdash; &ldquo;Prepared deposition outline and reviewed prior
                    testimony.&rdquo;
                  </div>
                  <div className="rounded-lg border border-amber-300/20 bg-black/30 p-2.5 text-xs text-amber-100">
                    0.8h &middot; Rodriguez intake &mdash; &ldquo;Initial client meeting, discussed case timeline and
                    next steps.&rdquo;
                  </div>
                </div>
                <div className="mt-1 rounded-xl border border-amber-300/30 bg-amber-400/10 p-3 text-xs text-amber-100">
                  <strong>2.6 hours reconstructed</strong> from one day &middot; write-downs run 6% at 14 days vs 18%
                  at 45 &mdash; every entry above still waits for a partner to approve before it counts toward
                  anything.
                </div>
              </>
            )}
          </div>
        )}
      </StepShell>
    </div>
  );
}
