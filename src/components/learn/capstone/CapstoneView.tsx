"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { capstoneAction, type CapstoneInput, type CapstoneResult } from "@/app/lab/ai-engineering/learn/actions";
import { ExerciseView } from "@/components/learn/exercise/ExerciseView";
import { InteractiveFrame } from "@/components/learn/lesson/InteractiveHost";
import { LEARN_BASE } from "@/components/learn/nav";
import { CodeBlock } from "@/components/obsidian/CodeBlock";
import { Icon } from "@/components/obsidian/Icon";
import { Btn, OptionButton, Result } from "@/components/learn/interactives/ui";
import type { CapstoneContent, CapstoneText, DesignStatus, Scores } from "@/lib/aie/capstone";
import type { CapstoneState } from "@/lib/aie/capstone-db";

const glass = "border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const area =
  "w-full rounded-xl border border-white/[0.12] bg-white/[0.03] px-3.5 py-2.5 text-[15px] leading-[1.55] text-frost placeholder:text-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";

/** `code` spans in the exercise brief. */
function Inline({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(/(`+)([\s\S]+?)\1(?!`)/g)) {
    out.push(<Fragment key={last}>{text.slice(last, m.index)}</Fragment>);
    out.push(
      <code key={m.index} className="font-mono text-[0.92em] text-cyan-text">
        {m[2]!.trim()}
      </code>,
    );
    last = m.index! + m[0].length;
  }
  out.push(<Fragment key="end">{text.slice(last)}</Fragment>);
  return <>{out}</>;
}

/** A part's heading and intro, in the lesson's own type. */
function PartHead({ id, title, intro }: { id: string; title: string; intro: string }) {
  return (
    <div id={id} className="flex scroll-mt-24 flex-col gap-3">
      <h2 className="m-0 text-[28px] font-medium leading-[1.1] tracking-[-0.03em] sm:text-[32px]">{title}</h2>
      <p className="m-0 max-w-[720px] text-[15.5px] leading-[1.65] text-mist">{intro}</p>
    </div>
  );
}

function ScoreBar({ label, value, empty }: { label: string; value: number | null; empty: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5">
      <div className="flex items-center justify-between text-[14.5px]">
        <span>{label}</span>
        <b className="font-mono font-medium" aria-live="polite">
          {value === null ? empty : `${value}%`}
        </b>
      </div>
      <div className="h-1.5 rounded-[3px] bg-white/[0.08]" role="img" aria-label={value === null ? empty : `${value}%`}>
        <div className="h-full rounded-[3px] transition-[width] duration-300" style={{ width: `${value ?? 0}%`, background: value === 100 ? "#3DDC97" : "#5CC8FF" }} />
      </div>
    </div>
  );
}

type Props = {
  content: CapstoneContent;
  text: CapstoneText;
  state: CapstoneState;
  harnessSource: string;
  brief: ReactNode;
  reference: ReactNode;
  after?: ReactNode;
};

export function CapstoneView({ content, text, state, harnessSource, brief, reference, after }: Props) {
  const [scores, setScores] = useState<Scores>(state.scores);
  const [final, setFinal] = useState<{ total: number; complete: boolean }>(() => {
    const parts = [state.scores.design, state.scores.impl, state.scores.debug];
    const total = parts.some((p) => p !== null) ? Math.round(parts.reduce<number>((a, b) => a + (b ?? 0), 0) / 3) : 0;
    return { total, complete: total >= content.passMark };
  });
  const send = async (input: CapstoneInput): Promise<CapstoneResult> => {
    const r = await capstoneAction(input);
    setScores(r.scores);
    setFinal({ total: r.total, complete: r.complete });
    return r;
  };

  // ---- Part 1
  const [design, setDesign] = useState<Record<string, string>>(state.design);
  const [statuses, setStatuses] = useState<Record<string, DesignStatus>>({});
  const [checking, setChecking] = useState(false);
  // one pending save per field, so switching fields quickly never drops the last edit of the first
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const autosave = (key: string, input: CapstoneInput) => {
    clearTimeout(timers.current.get(key));
    timers.current.set(key, setTimeout(() => void capstoneAction(input).catch(() => {}), 800));
  };
  const flush = () => timers.current.forEach(clearTimeout);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ---- Part 3
  const d = content.debugging;
  const [q1, setQ1] = useState<number | null>(state.debugQ1);
  const [answer, setAnswer] = useState(state.debugAnswer);
  const [verdict, setVerdict] = useState<{ ok: boolean; message: string } | null>(null);
  const [review, setReview] = useState<Record<string, string>>(state.review);

  const impl = content.implementation;
  const pick = q1 === null ? null : d.options[q1]!;

  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-6">{brief}</div>

      <section aria-labelledby="part-1" className="flex flex-col gap-5">
        <PartHead id="part-1" title={content.design.title} intro={content.design.intro} />
        <InteractiveFrame label={content.design.frame}>
          <div className="flex flex-col gap-5">
            {content.design.fields.map((f) => {
              const st = statuses[f.id];
              return (
                <div key={f.id} className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor={`df-${f.id}`} className="text-[15.5px] font-medium">
                      {f.label}
                    </label>
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">{f.mod}</span>
                  </div>
                  <textarea
                    id={`df-${f.id}`}
                    rows={3}
                    value={design[f.id] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => {
                      setDesign((v) => ({ ...v, [f.id]: e.target.value }));
                      autosave(f.id, { kind: "draft", design: { [f.id]: e.target.value } });
                    }}
                    className={area}
                  />
                  <span role="status" className={`flex items-center gap-2 text-[13.5px] ${st?.state === "pass" ? "text-mint-text" : st?.state === "fail" ? "text-ember-text" : "text-dim"}`}>
                    {st?.state === "pass" && <Icon name="check" size={14} color="#7FF0BD" strokeWidth={2.4} />}
                    {st?.state === "fail" && <Icon name="warn" size={14} color="#FF9BB0" />}
                    {st ? st.message : text.design.notWritten}
                  </span>
                </div>
              );
            })}
            <div>
              <Btn
                primary
                disabled={checking}
                onClick={async () => {
                  setChecking(true);
                  flush();
                  try {
                    setStatuses((await send({ kind: "design", values: design })).statuses ?? {});
                  } finally {
                    setChecking(false);
                  }
                }}
              >
                <Icon name="play" size={15} color="#05060A" strokeWidth={2} />
                {content.design.check}
              </Btn>
            </div>
            <ScoreBar label={content.design.scoreLabel} value={scores.design} empty={content.design.scoreEmpty} />
          </div>
        </InteractiveFrame>
      </section>

      <section aria-labelledby="part-2" className="flex flex-col gap-5">
        <PartHead id="part-2" title={impl.title} intro={impl.intro} />
        <ExerciseView
          module={8}
          exerciseId="8"
          eyebrow={impl.frame}
          title={impl.fileName.replace(".py", "")}
          description={<Inline text={impl.instructions} />}
          fileName={impl.fileName}
          starter={impl.starter}
          resetToStarter={impl.reset}
          tests={impl.tests}
          harnessSource={harnessSource}
          functionName={impl.functionName}
          save={(code, passed) => send({ kind: "impl", code, passed })}
          initial={{ code: state.implCode, attempted: state.scores.impl !== null, passed: 0 }}
          next={{ label: d.title, href: "#part-3" }}
        />
        <ScoreBar label={impl.scoreLabel} value={scores.impl} empty={impl.scoreEmpty} />
      </section>

      <section aria-labelledby="part-3" className="flex flex-col gap-5">
        <PartHead id="part-3" title={d.title} intro={d.intro} />
        <InteractiveFrame label={d.frame}>
          <div className="flex flex-col gap-5">
            <CodeBlock code={d.code.replace(/\n$/, "")} language="python" filename="call_model_with_retry.py" />
            <div className="flex flex-col gap-2.5">
              <b className="text-[15.5px] font-medium">{d.q1}</b>
              {d.options.map((o, i) => (
                <OptionButton
                  key={o.text}
                  disabled={q1 !== null}
                  state={q1 === null ? "idle" : o.correct ? "correct" : i === q1 ? "wrong" : "idle"}
                  onClick={() => {
                    setQ1(i);
                    void send({ kind: "debugQ1", index: i }).catch(() => {});
                  }}
                >
                  {o.text}
                </OptionButton>
              ))}
              {pick && <Result tone={pick.correct ? "ok" : "bad"}>{pick.correct ? text.debug.correct : `${text.debug.wrong}${pick.reason ?? ""}`}</Result>}
              {pick && !pick.correct && (
                <div>
                  <Btn
                    onClick={() => {
                      setQ1(null);
                      void send({ kind: "debugQ1", index: null }).catch(() => {});
                    }}
                  >
                    <Icon name="reset" size={15} />
                    {d.retry}
                  </Btn>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              <label htmlFor="debug-answer" className="text-[15.5px] font-medium">
                {d.q2}
              </label>
              <textarea
                id="debug-answer"
                rows={3}
                value={answer}
                aria-label={d.answerLabel}
                placeholder={d.placeholder}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  autosave("debug", { kind: "draft", debugAnswer: e.target.value });
                }}
                className={area}
              />
              <div>
                <Btn
                  onClick={async () => {
                    flush();
                    const r = await send({ kind: "debugText", answer });
                    setVerdict({ ok: !!r.ok, message: r.message ?? "" });
                  }}
                >
                  {d.check}
                </Btn>
              </div>
              {verdict && <Result tone={verdict.ok ? "ok" : "bad"}>{verdict.message}</Result>}
            </div>
            <ScoreBar label={d.scoreLabel} value={scores.debug} empty={d.scoreEmpty} />
          </div>
        </InteractiveFrame>
      </section>

      <section aria-labelledby="part-4" className="flex flex-col gap-5">
        <PartHead id="part-4" title={content.final.title} intro={content.final.intro} />
        <div className={`flex flex-col gap-3 rounded-[24px] p-6 ${glass}`}>
          {content.final.rows.map((label, i) => {
            const v = [scores.design, scores.impl, scores.debug][i] ?? null;
            return (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-3 text-[15px]">
                <span>{label}</span>
                <b className={`flex items-center gap-1.5 font-mono font-medium ${v === null ? "text-dim" : v >= 70 ? "text-mint-text" : "text-ember-text"}`}>
                  {v !== null && <Icon name={v >= 70 ? "check" : "close"} size={14} strokeWidth={2.4} />}
                  {v === null ? content.final.empty : `${v}%`}
                </b>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-1 text-[16px]">
            <span>{content.final.totalLabel}</span>
            <b className="text-[30px] font-medium tracking-[-0.03em]" aria-live="polite">
              {final.total}%
            </b>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Btn onClick={() => void send({ kind: "draft" }).catch(() => {})}>{content.final.recompute}</Btn>
          <span className="font-mono text-[13.5px] text-mist">{text.final.score.replace("{total}", String(final.total))}</span>
          {final.complete ? (
            <Link href={LEARN_BASE} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-frost px-[18px] text-[14.5px] font-medium text-void no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">
              {text.final.ready}
            </Link>
          ) : (
            <span className="text-[13.5px] text-dim">{text.final.locked}</span>
          )}
        </div>
        {final.complete && (
          <div role="status" className="flex flex-col items-start gap-2 rounded-[22px] border border-[rgba(61,220,151,0.5)] bg-[rgba(61,220,151,0.08)] p-6">
            <Icon name="award" size={28} color="#7FF0BD" />
            <h3 className="m-0 text-[24px] font-medium tracking-[-0.02em]">{text.final.banner}</h3>
            <p className="m-0 max-w-[640px] text-[15.5px] leading-[1.65] text-soft">{text.final.bannerText}</p>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-6">{reference}</div>

      <section aria-labelledby="review" className="flex flex-col gap-5">
        <PartHead id="review" title={content.review.title} intro={content.review.intro} />
        <div className="grid gap-4 md:grid-cols-2">
          {content.review.questions.map((q, i) => {
            const id = `review${i + 1}`;
            return (
              <div key={id} className={`flex flex-col gap-2.5 rounded-[20px] p-5 ${glass}`}>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">{q.tag}</span>
                <label htmlFor={id} className="text-[15.5px] leading-[1.5]">
                  {q.text}
                </label>
                <textarea
                  id={id}
                  rows={3}
                  value={review[id] ?? ""}
                  placeholder={q.placeholder}
                  onChange={(e) => {
                    setReview((r) => ({ ...r, [id]: e.target.value }));
                    autosave(id, { kind: "draft", review: { [id]: e.target.value } });
                  }}
                  className={area}
                />
              </div>
            );
          })}
        </div>
      </section>

      {after}
    </div>
  );
}
