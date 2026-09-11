"use client";

import { useState } from "react";

/* Purely simulated - the real engine (lead-capture.ts) fires from a real
   form POST to /api/leads/capture/[projectId] on a real client's site;
   a public demo has no real project to post into, so this reproduces the
   same qualify-then-follow-up behavior against a fake enquiry instead.
   Every name, message, and reply below is illustrative example content. */

type Stage = "idle" | "submitted" | "qualified" | "waiting" | "followup1" | "booked";

const SEQUENCE_LABEL: Record<Stage, string> = {
  idle: "",
  submitted: "Enquiry received",
  qualified: "Qualified & replied",
  waiting: "No reply after 2 days",
  followup1: "Follow-up sent",
  booked: "Booked",
};

export default function LeadCaptureDemo() {
  const [stage, setStage] = useState<Stage>("idle");
  const [log, setLog] = useState<string[]>([]);

  function push(line: string) {
    setLog((l) => [...l, line]);
  }

  function start() {
    setStage("submitted");
    setLog([]);
    push("New enquiry: consult request form");
    setTimeout(() => {
      setStage("qualified");
      push("Qualified against your rules (in-scope, real contact info)");
    }, 900);
    setTimeout(() => {
      setStage("waiting");
      push("First reply sent, no response after 2 days");
    }, 2000);
    setTimeout(() => {
      setStage("followup1");
      push("Follow-up 1 of 3 sent");
    }, 3100);
  }

  function simulateBooked() {
    setStage("booked");
    push("They replied and booked. Sequence stopped.");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#060a0d] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-sky-300/70">New enquiry form</p>
        {stage === "idle" && (
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-2 rounded-full bg-sky-300 px-5 py-2.5 text-xs font-bold text-black transition hover:scale-[1.02]"
          >
            Simulate a new enquiry
          </button>
        )}
      </div>

      {stage === "idle" && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/40">
          Amelia Chen &middot; &ldquo;Hi, I&apos;d like to book a consult for next week if possible.&rdquo;
        </div>
      )}

      {stage !== "idle" && (
        <div className="mt-4 flex flex-col gap-2">
          {log.map((line, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-[12.5px] text-white/60">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-300" />
              {line}
            </div>
          ))}

          {stage === "followup1" && (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={simulateBooked}
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-400 px-4 py-2.5 text-xs font-bold text-black transition hover:scale-[1.02]"
              >
                Simulate: they reply and book
              </button>
            </div>
          )}

          {stage === "booked" && (
            <div className="mt-2 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3 text-[12.5px] text-emerald-200">
              Amelia Chen booked for Tuesday 2:00pm. No further follow-ups will send.
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-1.5 border-t border-white/5 pt-4">
        {(["submitted", "qualified", "waiting", "followup1", "booked"] as Stage[]).map((s) => {
          const order: Stage[] = ["submitted", "qualified", "waiting", "followup1", "booked"];
          const reached = order.indexOf(stage) >= order.indexOf(s) && stage !== "idle";
          return (
            <span
              key={s}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] ${
                reached ? "bg-sky-400/15 text-sky-200" : "bg-white/[0.03] text-white/25"
              }`}
            >
              {SEQUENCE_LABEL[s]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
