"use client";

import { useState } from "react";

/* Purely simulated - Method A from the demo-strategy memory (a UI sandbox,
   no real backend). AI Inbox Manager's real runtime (inbox-manager.ts,
   mail-imap.ts) connects to a client's own Gmail/Yahoo inbox; a public
   demo can't do that safely for a random visitor, so this shows the same
   triage/draft behavior against a fake inbox instead. Every email and
   draft below is illustrative example content, never live data. */

type EmailStatus = "unread" | "processing" | "routine" | "flagged";

type DemoEmail = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  draft: string;
  outcome: "routine" | "flagged";
};

const EMAILS: DemoEmail[] = [
  {
    id: "e1",
    from: "Marcus Webb",
    subject: "Tax return documents",
    preview: "Hi, just checking if you received the W-2s I sent over last week...",
    draft: "Hi Marcus, yes, we have your W-2s on file and everything looks complete. We'll follow up once your return is ready for review.",
    outcome: "routine",
  },
  {
    id: "e2",
    from: "Priya Nair",
    subject: "Can we move Thursday?",
    preview: "Something came up, would it be possible to reschedule our call...",
    draft: "Hi Priya, no problem at all. I've moved your call to Friday at the same time and sent an updated invite.",
    outcome: "routine",
  },
  {
    id: "e3",
    from: "Dale Ostrander",
    subject: "Fee dispute, Q2 invoice",
    preview: "I need to talk to someone about the charge on my Q2 invoice, this doesn't look right...",
    draft: "",
    outcome: "flagged",
  },
];

export default function InboxManagerDemo() {
  const [statuses, setStatuses] = useState<Record<string, EmailStatus>>(
    Object.fromEntries(EMAILS.map((e) => [e.id, "unread"]))
  );
  const [running, setRunning] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  function runTriage() {
    setRunning(true);
    EMAILS.forEach((email, i) => {
      setTimeout(() => {
        setStatuses((s) => ({ ...s, [email.id]: "processing" }));
      }, i * 900);
      setTimeout(() => {
        setStatuses((s) => ({ ...s, [email.id]: email.outcome }));
        if (i === EMAILS.length - 1) setRunning(false);
      }, i * 900 + 650);
    });
  }

  const allDone = EMAILS.every((e) => statuses[e.id] === "routine" || statuses[e.id] === "flagged");

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0a06] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-amber-300/70">Inbox &middot; Gmail</p>
          <p className="mt-1 text-sm text-white/50">3 unread</p>
        </div>
        {!allDone && (
          <button
            type="button"
            onClick={runTriage}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 text-xs font-bold text-black transition hover:scale-[1.02] disabled:opacity-60"
          >
            {running ? "Sorting..." : "Run AI triage"}
          </button>
        )}
        {allDone && (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            Inbox sorted
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {EMAILS.map((email) => {
          const status = statuses[email.id];
          const isOpen = openId === email.id;
          return (
            <div
              key={email.id}
              className={`rounded-xl border px-4 py-3 transition ${
                status === "flagged"
                  ? "border-amber-300/40 bg-amber-400/[0.05]"
                  : status === "routine"
                    ? "border-emerald-400/25 bg-emerald-400/[0.04]"
                    : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <button
                type="button"
                onClick={() => (email.draft ? setOpenId(isOpen ? null : email.id) : null)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {email.from} <span className="font-normal text-white/40">&middot; {email.subject}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-white/40">{email.preview}</p>
                </div>
                <span
                  className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.04em] ${
                    status === "unread"
                      ? "text-white/25"
                      : status === "processing"
                        ? "animate-pulse text-amber-300"
                        : status === "flagged"
                          ? "text-amber-300"
                          : "text-emerald-300"
                  }`}
                >
                  {status === "unread" && "Unread"}
                  {status === "processing" && "Reading..."}
                  {status === "flagged" && "Needs you"}
                  {status === "routine" && "Draft ready"}
                </span>
              </button>
              {isOpen && email.draft && (
                <div className="mt-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-[12.5px] leading-5 text-white/70">
                  {email.draft}
                  <div className="mt-2 flex gap-2">
                    <span className="text-[10px] uppercase tracking-[0.06em] text-emerald-400/80">
                      Drafted, waiting for your send
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
