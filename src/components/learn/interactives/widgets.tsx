"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BarRow, Btn, Caption, Mono, Note, OptionButton, Result, Slider, Stat, StatRow, TraceLine, fmt } from "./ui";

/* The old course's interactive widgets, ported to React with identical behaviour. Wording lives in
   content/ai-engineering/interactives/N.text.json, data in N.json; nothing here is course copy. */

type Data = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- the widgets' own JSON, shape-checked by tests
type Props = { data: Data };
type Option = { t: string; correct: boolean; why: string };

// ---------------------------------------------------------------------------------------------- shared

/** Pick one option; the answer and the explanation are revealed, and the choice is locked. */
function OptionsQuiz({ options, prefix }: { options: Option[]; prefix: { correct: string; wrong: string } }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((o, i) => (
        <OptionButton
          key={o.t}
          disabled={picked !== null}
          state={picked === null ? "idle" : o.correct ? "correct" : i === picked ? "wrong" : "idle"}
          onClick={() => picked === null && setPicked(i)}
        >
          {o.t}
        </OptionButton>
      ))}
      {picked !== null && (
        <Result tone={options[picked]!.correct ? "ok" : "bad"}>
          {options[picked]!.correct ? prefix.correct : prefix.wrong}
          {options[picked]!.why}
        </Result>
      )}
    </div>
  );
}

export function Decision({ data, children }: Props & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-[16.5px] leading-[1.7] text-soft [&_p]:m-0 [&_strong]:text-frost">{children}</div>
      <OptionsQuiz options={data.decision} prefix={data.common.decision} />
    </div>
  );
}

export function DebugCase({ data, evidence, question, children }: Props & { evidence: string; question: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-[16px] leading-[1.65] text-mist [&_p]:m-0 [&_strong]:text-frost">{children}</div>
      <Mono>{evidence}</Mono>
      <b className="text-[15.5px] font-medium">{question}</b>
      <OptionsQuiz options={data.debugCase} prefix={data.common.debug} />
    </div>
  );
}

type SpotItem = { id: string; code: string; valid: boolean; explanation: string };

/** Cards that ask "would this pass?"; each locks after one guess, and a summary (when given) appears once all are answered. */
function SpotCards({ items, yes, no, summary, columns = 1 }: { items: SpotItem[]; yes: string; no: string; summary?: { line: string; ok: string; bad: string }; columns?: 1 | 2 }) {
  const [guesses, setGuesses] = useState<Record<string, boolean>>({});
  const answered = Object.keys(guesses).length;
  const correct = items.filter((i) => guesses[i.id] === i.valid).length;
  return (
    <div className="flex flex-col gap-3">
      <div className={`grid gap-3 ${columns === 2 ? "md:grid-cols-2" : ""}`}>
        {items.map((item) => {
          const guess = guesses[item.id];
          const done = guess !== undefined;
          const right = done && guess === item.valid;
          return (
            <div key={item.id} className={`flex flex-col gap-3 rounded-2xl border p-4 ${!done ? "border-white/[0.09] bg-white/[0.03]" : right ? "border-[rgba(61,220,151,0.45)] bg-[rgba(61,220,151,0.05)]" : "border-[rgba(255,92,122,0.45)] bg-[rgba(255,92,122,0.05)]"}`}>
              <Mono>{item.code}</Mono>
              <div className="flex flex-wrap gap-2.5">
                <Btn disabled={done} onClick={() => setGuesses((g) => ({ ...g, [item.id]: true }))}>{yes}</Btn>
                <Btn disabled={done} onClick={() => setGuesses((g) => ({ ...g, [item.id]: false }))}>{no}</Btn>
              </div>
              {done && <Result tone={right ? "ok" : "bad"}>{item.explanation}</Result>}
            </div>
          );
        })}
      </div>
      {summary && answered === items.length && (
        <Result tone={correct === items.length ? "ok" : "bad"}>
          {fmt(summary.line, { correct, total: items.length })}
          {correct === items.length ? summary.ok : summary.bad}
        </Result>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- module 1

export function M1Spot({ data }: Props) {
  const t = data.text.spot;
  const items: SpotItem[] = data.SAMPLES.map((x: { id: string; text: string; validJson: boolean; why: string }) => ({ id: x.id, code: x.text, valid: x.validJson, explanation: x.why }));
  return <SpotCards items={items} yes={t.validBtn} no={t.invalidBtn} columns={2} />;
}

type PipeStep = { name: string; detail: string; ok: boolean | null };

function runPipeline(raw: string, required: string[], t: Data): PipeStep[] {
  const steps: PipeStep[] = [{ name: t.original, detail: raw, ok: null }];
  let text = raw;
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) {
    text = fenced[1]!.trim();
    steps.push({ name: t.fenceName, detail: fmt(t.fenceFound, { text }), ok: true });
  } else steps.push({ name: t.fenceName, detail: t.fenceNone, ok: null });

  const before = text;
  text = text.replace(/,\s*([}\]])/g, "$1");
  if (text !== before) steps.push({ name: t.commaName, detail: fmt(t.commaFound, { text }), ok: true });
  else steps.push({ name: t.commaName, detail: t.commaNone, ok: null });

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
    steps.push({ name: t.parseName, detail: t.parseOk, ok: true });
  } catch (e) {
    steps.push({ name: t.parseName, detail: fmt(t.parseFail, { error: e instanceof Error ? e.message : String(e) }), ok: false });
    return steps;
  }
  const missing = required.filter((f) => !(f in parsed));
  if (missing.length === 0) steps.push({ name: t.validName, detail: fmt(t.validOk, { fields: required.join(", ") }), ok: true });
  else steps.push({ name: t.validName, detail: fmt(t.validMissing, { missing: missing.join(", ") }), ok: false });
  return steps;
}

export function M1Pipeline({ data }: Props) {
  const t = data.text.pipe;
  const [picked, setPicked] = useState<number | null>(null);
  const steps = picked === null ? [] : runPipeline(data.PIPE_SAMPLES[picked].text, data.PIPE_REQUIRED, t);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2.5">
        {data.PIPE_SAMPLES.map((s: { id: string; label: string }, i: number) => (
          <Btn key={s.id} primary={picked === i} aria-pressed={picked === i} onClick={() => setPicked(i)}>
            {s.label}
          </Btn>
        ))}
      </div>
      {steps.length > 0 && (
        <div className="flex flex-col gap-2">
          {steps.map((s) => (
            <Result key={s.name} tone={s.ok === true ? "ok" : s.ok === false ? "bad" : "info"}>
              <b className="font-medium text-frost">{s.name}</b>
              <br />
              <span className="whitespace-pre-wrap break-words">{s.detail}</span>
            </Result>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- module 2

export function M2Context({ data }: Props) {
  const t = data.text.ctx;
  const [win, setWin] = useState(8000);
  const [out, setOut] = useState(1000);
  const avail = win - out;
  const words = Math.max(0, Math.round((avail / 4) * (4 / 5.3)));
  return (
    <div className="flex flex-col gap-5">
      <Slider id="ctx-win" label={t.winLabel} shown={`${win} ${t.winUnit}`} value={win} min={2000} max={32000} step={500} onChange={setWin} />
      <Slider id="ctx-out" label={t.outLabel} shown={`${out} ${t.outUnit}`} value={out} min={200} max={4000} step={100} onChange={setOut} />
      <StatRow>
        <Stat value={avail} label={t.availLabel} warn={avail <= 0} />
        <Stat value={avail > 0 ? `~${words}` : "0"} label={t.wordsLabel} />
        <Stat value={`${Math.round((out / win) * 100)}%`} label={t.pctLabel} />
      </StatRow>
    </div>
  );
}

export function M2Rag({ data }: Props) {
  const t = data.text.rag;
  const [docChars, setDocChars] = useState(400000);
  const [chunk, setChunk] = useState(500);
  const [overlap, setOverlap] = useState(15);
  const docTokens = docChars / 4;
  const newPerChunk = chunk - Math.round(chunk * (overlap / 100));
  let chunks = "∞";
  let total = "–";
  let overhead = "n/a";
  let warnChunks = true;
  let warnOverhead = true;
  if (newPerChunk > 0) {
    const n = docTokens <= chunk ? 1 : 1 + Math.ceil((docTokens - chunk) / newPerChunk);
    const totalTokens = n * chunk;
    const pct = docTokens > 0 ? Math.round((Math.max(0, totalTokens - docTokens) / totalTokens) * 100) : 0;
    chunks = n.toLocaleString("en-US");
    total = Math.round(totalTokens).toLocaleString("en-US");
    overhead = `${pct}%`;
    warnChunks = false;
    warnOverhead = pct >= 40;
  }
  return (
    <div className="flex flex-col gap-5">
      <Slider id="rag-doc" label={t.docLabel} shown={`${docChars.toLocaleString("en-US")} ${t.docUnit}`} value={docChars} min={20000} max={2000000} step={20000} onChange={setDocChars} />
      <Slider id="rag-chunk" label={t.chunkLabel} shown={`${chunk} ${t.chunkUnit}`} value={chunk} min={100} max={4000} step={100} onChange={setChunk} />
      <Slider id="rag-overlap" label={t.overlapLabel} shown={`${overlap}%`} value={overlap} min={0} max={80} step={5} onChange={setOverlap} />
      <StatRow>
        <Stat value={chunks} label={t.chunksLabel} warn={warnChunks} />
        <Stat value={total} label={t.totalLabel} />
        <Stat value={overhead} label={t.overheadLabel} warn={warnOverhead} />
      </StatRow>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- module 3

export function M3Angle({ data }: Props) {
  const t = data.text.angle;
  const [deg, setDeg] = useState(45);
  const cos = Math.cos((deg * Math.PI) / 180);
  const read = cos > 0.9 ? t.reads[0] : cos > 0.5 ? t.reads[1] : cos > 0.1 ? t.reads[2] : cos > -0.1 ? t.reads[3] : t.reads[4];
  return (
    <div className="flex flex-col gap-5">
      <Slider id="angle" label={t.label} shown={`${deg}°`} value={deg} min={0} max={180} step={1} onChange={setDeg} />
      <StatRow>
        <Stat value={cos.toFixed(3)} label={t.cosLabel} warn={cos < 0} />
        <Stat value={read} label={t.readLabel} />
      </StatRow>
    </div>
  );
}

type Chunk = { id: string; text: string; score: number };

function ScoredChunk({ label, chunk, scoreLabel, tone, dim }: { label: string; chunk: Chunk; scoreLabel: string; tone: "idle" | "best" | "picked"; dim?: boolean }) {
  const look = tone === "best" ? "border-[rgba(61,220,151,0.5)] bg-[rgba(61,220,151,0.06)]" : tone === "picked" ? "border-cyan bg-cyan/[0.08]" : "border-white/[0.09] bg-white/[0.03]";
  return (
    <div className={`flex flex-col gap-1.5 rounded-2xl border p-4 text-left ${look} ${dim ? "opacity-50" : ""}`}>
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">{label}</span>
      <span className="text-[15px] leading-[1.55] text-frost">{chunk.text}</span>
      <span className="font-mono text-[12.5px] text-mist">
        {scoreLabel} {chunk.score.toFixed(2)}
      </span>
    </div>
  );
}

export function M3Rank({ data }: Props) {
  const t = data.text.rank;
  const chunks: Chunk[] = data.RANK_CANDIDATES;
  const best = [...chunks].sort((a, b) => b.score - a.score)[0]!;
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      {chunks.map((c, i) =>
        picked === null ? (
          <button key={c.id} type="button" onClick={() => setPicked(c.id)} className="rounded-2xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">
            <div className="flex flex-col gap-1.5 rounded-2xl border border-white/[0.09] bg-white/[0.03] p-4 hover:border-cyan/40">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                {t.chunk} {i + 1}
              </span>
              <span className="text-[15px] leading-[1.55] text-frost">{c.text}</span>
            </div>
          </button>
        ) : (
          <ScoredChunk key={c.id} label={`${t.chunk} ${i + 1}`} chunk={c} scoreLabel={t.score} tone={c.id === best.id ? "best" : c.id === picked ? "picked" : "idle"} />
        ),
      )}
      {picked !== null && <Result tone={picked === best.id ? "ok" : "bad"}>{fmt(picked === best.id ? t.ok : t.bad, { score: best.score.toFixed(2) })}</Result>}
    </div>
  );
}

export function M3TopK({ data }: Props) {
  const t = data.text.hr;
  const [threshold, setThreshold] = useState(0.3);
  const sorted: Chunk[] = [...data.HR_CHUNKS].sort((a: Chunk, b: Chunk) => b.score - a.score);
  const included = new Set(sorted.filter((c) => c.score >= threshold).slice(0, data.HR_K).map((c) => c.id));
  return (
    <div className="flex flex-col gap-4">
      <Slider id="threshold" label={t.label} shown={threshold.toFixed(2)} value={threshold} min={0} max={1} step={0.01} onChange={setThreshold} />
      <div className="flex flex-col gap-3">
        {sorted.map((c) => (
          <ScoredChunk key={c.id} label={included.has(c.id) ? t.retrieved : t.excluded} chunk={c} scoreLabel={t.score} tone={included.has(c.id) ? "best" : "idle"} dim={!included.has(c.id)} />
        ))}
      </div>
      <StatRow>
        <Stat value={included.size} label={t.countLabel} warn={included.size === 0} />
      </StatRow>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- module 4

export function M4Spot({ data }: Props) {
  const t = data.text.spot;
  return <SpotCards items={data.SPOT_CALLS} yes={t.safeBtn} no={t.rejectBtn} summary={{ line: t.summary, ok: t.summaryOk, bad: t.summaryBad }} />;
}

type IdemLine = { text: string; tone?: "ok" | "bad" };

export function M4Idempotency({ data }: Props) {
  const t = data.text.idem;
  const callId: string = data.IDEM_CALL_ID;
  const [cacheOn, setCacheOn] = useState(true);
  const [stock, setStock] = useState<number>(data.idemState.stock);
  const [handlerCalls, setHandlerCalls] = useState(0);
  const [seen, setSeen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [retried, setRetried] = useState(false);
  const [log, setLog] = useState<IdemLine[]>([]);
  const [verdict, setVerdict] = useState<boolean | null>(null);

  const submit = () => {
    const after = stock - 5;
    setStock(after);
    setHandlerCalls(1);
    setSeen(cacheOn);
    setSubmitted(true);
    setLog([{ text: fmt(t.attempt1, { before: stock, after }) }, { text: t.lost }]);
  };
  const retry = () => {
    setRetried(true);
    if (cacheOn && seen) {
      setLog((l) => [...l, { text: fmt(t.cached, { id: callId, stock }), tone: "ok" }]);
      setVerdict(true);
    } else {
      const after = stock - 5;
      setLog((l) => [...l, { text: fmt(t.again, { before: stock, after }), tone: "bad" }]);
      setStock(after);
      setHandlerCalls((n) => n + 1);
      setVerdict(false);
    }
  };
  const reset = () => {
    setStock(data.idemState.stock);
    setHandlerCalls(0);
    setSeen(false);
    setSubmitted(false);
    setRetried(false);
    setLog([]);
    setVerdict(null);
  };
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[14.5px] text-mist">
        {t.callId} <code className="font-mono text-cyan-text">{callId}</code> · <code className="font-mono text-cyan-text">{t.callSignature}</code>
      </p>
      <label className="flex min-h-11 items-center gap-3 text-[14.5px] text-soft">
        <input type="checkbox" checked={cacheOn} onChange={(e) => setCacheOn(e.target.checked)} className="h-5 w-5 accent-[#5CC8FF]" />
        {t.toggle}
      </label>
      <StatRow>
        <Stat value={stock} label={t.stock} />
        <Stat value={handlerCalls} label={t.handler} />
      </StatRow>
      <div className="flex flex-wrap gap-2.5">
        <Btn primary disabled={submitted} onClick={submit}>{t.submit}</Btn>
        <Btn disabled={!submitted || retried} onClick={retry}>{t.retry}</Btn>
        <Btn onClick={reset}>{t.reset}</Btn>
      </div>
      {log.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 font-mono text-[12.5px]" aria-live="polite">
          {log.map((l, i) => (
            <li key={i} className={l.tone === "ok" ? "text-mint-text" : l.tone === "bad" ? "text-ember-text" : "text-mist"}>{l.text}</li>
          ))}
        </ul>
      )}
      {verdict !== null && <Result tone={verdict ? "ok" : "bad"}>{verdict ? t.verdictOk : t.verdictBad}</Result>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- module 5

export function M5Trace({ data }: Props) {
  const t = data.text.trace;
  const steps: { role: string; text: string }[] = data.TRACE_STEPS;
  const [shown, setShown] = useState(0);
  const done = shown >= steps.length;
  return (
    <div className="flex flex-col gap-4">
      {shown > 0 && (
        <div className="rounded-2xl bg-ink px-4 py-1" aria-live="polite">
          {steps.slice(0, shown).map((s, i) => (
            <TraceLine key={i} role={s.role}>{s.text}</TraceLine>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2.5">
        <Btn primary disabled={done} onClick={() => setShown((n) => n + 1)}>{done ? t.done : t.next}</Btn>
        <Btn onClick={() => setShown(0)}>{t.reset}</Btn>
      </div>
    </div>
  );
}

export function M5Travel({ data }: Props) {
  const t = data.text.travel;
  const steps: { action: string; observe: string }[] = data.TRAVEL_STEPS;
  const max: number = data.TRAVEL_MAX_STEPS;
  const [threshold, setThreshold] = useState(3);
  const [idx, setIdx] = useState(0);
  const [lines, setLines] = useState<{ role: string; text: string }[]>([]);
  const [last, setLast] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [status, setStatus] = useState<"idle" | "running" | "stuck" | "limit">("idle");
  const ended = status === "stuck" || status === "limit";

  const step = () => {
    if (ended || idx >= steps.length) return;
    const s = steps[idx]!;
    const nextStreak = s.action === last ? streak + 1 : 1;
    const nextIdx = idx + 1;
    const added = [
      { role: "act", text: s.action },
      { role: "observe", text: s.observe },
    ];
    let next: "idle" | "running" | "stuck" | "limit" = "running";
    if (nextStreak >= threshold) {
      added.push({ role: "final", text: fmt(t.stoppedStuck, { streak: nextStreak, threshold }) });
      next = "stuck";
    } else if (nextIdx >= max) {
      added.push({ role: "final", text: t.stoppedLimit });
      next = "limit";
    }
    setLines((l) => [...l, ...added]);
    setLast(s.action);
    setStreak(nextStreak);
    setIdx(nextIdx);
    setStatus(next);
  };
  const reset = () => {
    setIdx(0);
    setLines([]);
    setLast(null);
    setStreak(0);
    setStatus("idle");
  };
  const statusText = { idle: t.notStarted, running: t.running, stuck: t.stuck, limit: t.limit }[status];
  return (
    <div className="flex flex-col gap-4">
      <Slider id="stuck" label={t.thresholdLabel} shown={threshold} value={threshold} min={2} max={6} step={1} onChange={setThreshold} />
      {lines.length > 0 && (
        <div className="rounded-2xl bg-ink px-4 py-1" aria-live="polite">
          {lines.map((l, i) => (
            <TraceLine key={i} role={l.role}>{l.text}</TraceLine>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2.5">
        <Btn primary disabled={ended} onClick={step}>{t.next}</Btn>
        <Btn onClick={reset}>{t.reset}</Btn>
      </div>
      <StatRow>
        <Stat value={`${idx} / ${max}`} label={t.steps} />
        <Stat value={streak} label={t.streak} />
        <Stat value={statusText} label={t.status} warn={ended} />
      </StatRow>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- module 6

export function M6Backoff({ data }: Props) {
  const t = data.text.backoff;
  const base: number = data.BACKOFF_BASE;
  const cap: number = data.BACKOFF_CAP;
  const capped = (attempt: number) => Math.min(cap, base * Math.pow(2, attempt - 1));
  const [attempt, setAttempt] = useState(1);
  const now = capped(attempt);
  return (
    <div className="flex flex-col gap-5">
      <Slider id="attempt" label={t.attLabel} shown={attempt} value={attempt} min={1} max={8} step={1} onChange={setAttempt} />
      <StatRow>
        <Stat value={Math.round(now)} label={t.statLabel} warn={now >= cap} />
      </StatRow>
      <Note>{t.note}</Note>
      <div className="flex flex-col gap-2.5">
        {[1, 3, 6].map((a, i) => (
          <BarRow key={a} label={t.bars[i]} percent={Math.round((capped(a) / cap) * 100)} value={fmt(t.barValue, { ms: Math.round(capped(a)) })} />
        ))}
      </div>
    </div>
  );
}

export function M6Thunder({ data }: Props) {
  const t = data.text.thunder;
  const capMs: number = data.TH_CAP;
  const bucket: number = data.TH_BUCKET_SIZE;
  const buckets = capMs / bucket;
  const [callers, setCallers] = useState(30);
  const [jitter, setJitter] = useState<number[] | null>(null);

  const simulate = (n: number) => {
    const counts = new Array<number>(buckets).fill(0);
    for (let i = 0; i < n; i++) counts[Math.min(buckets - 1, Math.floor(Math.random() * capMs / bucket))]!++;
    setJitter(counts);
  };
  // The random draw runs after mount, so the server-rendered markup and the first client render agree.
  useEffect(() => simulate(30), []); // eslint-disable-line react-hooks/exhaustive-deps

  const fixed = new Array<number>(buckets).fill(0);
  fixed[buckets - 1] = callers;
  const label = (i: number) => `${i * bucket}-${(i + 1) * bucket}ms`;
  const chart = (counts: number[]) => (
    <div className="flex flex-col gap-1.5">
      {counts.map((c, i) => (
        <BarRow key={i} label={label(i)} percent={callers > 0 ? Math.round((c / callers) * 100) : 0} value={c} />
      ))}
    </div>
  );
  return (
    <div className="flex flex-col gap-5">
      <Slider id="callers" label={t.callersLabel} shown={callers} value={callers} min={5} max={80} step={1} onChange={(n) => { setCallers(n); simulate(n); }} />
      <div>
        <Btn primary onClick={() => simulate(callers)}>{t.reroll}</Btn>
      </div>
      <StatRow>
        <Stat warn value={Math.max(...fixed)} label={t.fixedPeak} />
        <Stat value={jitter ? Math.max(...jitter) : "–"} label={t.jitterPeak} />
      </StatRow>
      <Note>{t.note}</Note>
      <Caption>{t.fixedChart}</Caption>
      {chart(fixed)}
      <Caption>{t.jitterChart}</Caption>
      {jitter && chart(jitter)}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- module 7

export function M7Spot({ data }: Props) {
  const t = data.text.spot;
  return <SpotCards items={data.SPOT_CASES} yes={t.usableBtn} no={t.missingBtn} summary={{ line: t.summary, ok: t.summaryOk, bad: t.summaryBad }} />;
}

export function M7Regression({ data }: Props) {
  const t = data.text.reg;
  const baseline: number = data.REG_DEMO_BASELINE;
  const [pct, setPct] = useState(Math.round(baseline * 100));
  const score = pct / 100;
  const delta = score - baseline;
  const regression = score < baseline;
  return (
    <div className="flex flex-col gap-5">
      <Slider id="candidate" label={t.scoreLabel} shown={score.toFixed(2)} value={pct} min={50} max={100} step={1} onChange={setPct} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat value={baseline.toFixed(2)} label={t.baseline} />
        <Stat value={score.toFixed(2)} label={t.candidate} />
        <Stat value={`${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`} label={t.delta} />
        <Stat value={regression ? t.regression : t.pass} label={t.flag} warn={regression} />
      </div>
      <Result tone={regression ? "bad" : "ok"}>
        {regression ? t.badA : t.okA} <code className="font-mono text-cyan-text">regression</code> {regression ? t.badB : t.okB}{" "}
        <code className="font-mono text-cyan-text">{regression ? t.true : t.false}</code>
        {regression ? ` ${fmt(t.badC, { score: score.toFixed(2), baseline: baseline.toFixed(2) })}` : t.okC}
      </Result>
    </div>
  );
}
