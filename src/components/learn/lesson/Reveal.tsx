"use client";

import { useId, useState, type ReactNode } from "react";
import { Icon } from "@/components/obsidian/Icon";

export function Reveal({ label, question, answer }: { label: string; question: ReactNode; answer: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <section className="glass flex flex-col gap-3.5 rounded-[20px] p-[22px] [&_p]:text-[16.5px] [&_p]:leading-[1.7]">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">{label}</span>
      {question}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="glass inline-flex min-h-11 w-fit items-center gap-2 rounded-full px-[18px] text-[14.5px] text-frost transition-colors hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
      >
        {open ? "Hide the answer" : "Show the answer"}
        <Icon name="chevron" size={15} className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <div id={id} className="flex flex-col gap-2 rounded-2xl border border-[rgba(61,220,151,0.40)] bg-[rgba(61,220,151,0.07)] px-[18px] py-4 [&_p]:text-[16px] [&_p]:leading-[1.65]">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-mint-text">
            <Icon name="check" size={13} color="#7FF0BD" strokeWidth={2.4} />
            Answer
          </span>
          {answer}
        </div>
      )}
    </section>
  );
}
