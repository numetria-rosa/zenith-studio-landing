"use client";

import { useState } from "react";
import { Icon } from "@/components/obsidian/Icon";
import { VARIABLES, complianceChecks, fillTemplate, type VarKey } from "@/lib/aie/outreach";

export type OutreachAgent = { id: string; name: string; subjectOptions: string[]; body: string; followUp: string };

const FIELD =
  "min-h-11 w-full rounded-xl border border-white/[0.14] bg-white/[0.04] px-3.5 text-[15px] text-frost placeholder:text-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
      className="glass inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[14px] text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
    >
      <Icon name={done ? "check" : "copy"} size={15} color={done ? "#7FF0BD" : "currentColor"} />
      {done ? "Copied" : label}
    </button>
  );
}

/** Pick an agent, fill in who you are and who you're writing to, and copy a compliant cold email and follow-up. */
export function OutreachStudio({ agents, initialAgent }: { agents: OutreachAgent[]; initialAgent?: string }) {
  const [agentId, setAgentId] = useState(agents.some((a) => a.id === initialAgent) ? initialAgent! : agents[0]!.id);
  const [subjectIdx, setSubjectIdx] = useState(0);
  const [values, setValues] = useState<Partial<Record<VarKey, string>>>({});
  const agent = agents.find((a) => a.id === agentId)!;

  const subject = fillTemplate(agent.subjectOptions[subjectIdx] ?? agent.subjectOptions[0]!, values);
  const body = fillTemplate(agent.body, values);
  const followUp = fillTemplate(agent.followUp, values);
  const checks = complianceChecks(body, values);

  const status = [
    { ok: checks.complete, text: "Every {variable} is filled in" },
    { ok: checks.hasAddress, text: "Your postal address is in the email (required in the US)" },
    { ok: checks.hasOptOut, text: "There is a clear way to opt out" },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <div className="glass flex flex-col gap-4 rounded-[22px] p-5">
        <div>
          <label htmlFor="o-agent" className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Agent</label>
          <select id="o-agent" className={FIELD} value={agentId} onChange={(e) => { setAgentId(e.target.value); setSubjectIdx(0); }}>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="o-subject" className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Subject line</label>
          <select id="o-subject" className={FIELD} value={subjectIdx} onChange={(e) => setSubjectIdx(Number(e.target.value))}>
            {agent.subjectOptions.map((s, i) => <option key={s} value={i}>{s}</option>)}
          </select>
        </div>
        {VARIABLES.map((v) => (
          <div key={v.key}>
            <label htmlFor={`o-${v.key}`} className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-dim">{v.label}</label>
            <input
              id={`o-${v.key}`}
              className={FIELD}
              value={values[v.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [v.key]: e.target.value }))}
              autoComplete="off"
            />
          </div>
        ))}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Before you send">
          {status.map((s) => (
            <li
              key={s.text}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13.5px] ${
                s.ok ? "border-[rgba(61,220,151,0.30)] bg-[rgba(61,220,151,0.08)] text-mint-text" : "border-white/[0.14] text-mist"
              }`}
            >
              <Icon name={s.ok ? "check" : "close"} size={13} color={s.ok ? "#7FF0BD" : "#A9AEBA"} strokeWidth={2.2} />
              {s.text}
              <span className="sr-only">{s.ok ? " (done)" : " (not yet)"}</span>
            </li>
          ))}
        </ul>

        {[
          { title: "First email", text: `Subject: ${subject}\n\n${body}`, id: "first" },
          { title: "Follow-up, four days later", text: followUp, id: "follow" },
        ].map((block) => (
          <section key={block.id} className="glass flex flex-col gap-3 rounded-[22px] p-5" aria-labelledby={`t-${block.id}`}>
            <div className="flex items-center justify-between gap-3">
              <h3 id={`t-${block.id}`} className="m-0 text-[18px] font-medium">{block.title}</h3>
              <CopyButton text={block.text} label={`Copy ${block.id === "first" ? "email" : "follow-up"}`} />
            </div>
            <pre className="m-0 whitespace-pre-wrap break-words rounded-xl bg-ink px-4 py-3.5 font-sans text-[15px] leading-[1.65] text-soft">{block.text}</pre>
          </section>
        ))}
      </div>
    </div>
  );
}
