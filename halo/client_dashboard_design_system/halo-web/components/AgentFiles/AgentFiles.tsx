"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { FILE_AGENTS, type AgentKey } from "./agents";
import s from "./AgentFiles.module.css";

type Phase = "rest" | "out" | "detail" | "back";

/** Folder slots back to front. Agents sit in slots 1, 3 and 5; the rest are plain files. */
const SLOTS: (number | null)[] = [null, 0, null, 1, null, 2, null];
const AGENT_SLOT = [1, 3, 5];

const STAGE_W = 1280;

// Timeline per agent (ms)
const T_OUT = 450; // folder starts sliding out
const T_DETAIL = 1300; // card + text reveal
const T_RETURN = 1000; // card hides and folder returns, then the next agent starts

const SHEET_LINES = [
  { w: "70%", a: 0.14 },
  { w: "90%", a: 0.1 },
  { w: "55%", a: 0.1 },
  { w: "80%", a: 0.08 },
];

function AgentIcon({ k }: { k: AgentKey }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (k === "billing")
    return (
      <svg {...common}>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </svg>
    );
  if (k === "missed")
    return (
      <svg {...common}>
        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
        <path d="M16 3l5 5M21 3l-5 5" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M20 11a8 8 0 0 0-14.9-3M4 5v4h4M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4" />
    </svg>
  );
}

type Props = {
  /** Seconds each agent's card stays visible */
  holdSeconds?: number;
  /** Loop through agents automatically */
  autoplay?: boolean;
  className?: string;
};

export function AgentFiles({ holdSeconds = 5.5, autoplay = true, className }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [inView, setInView] = useState(true);
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState<Phase>("rest");
  const [runId, setRunId] = useState(0);

  const hold = Math.max(2, holdSeconds) * 1000;

  // Scale the 1280x800 stage to the container width
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / STAGE_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Only animate while on screen
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Timeline for the current agent
  useEffect(() => {
    if (!inView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setPhase("rest");
    timers.push(setTimeout(() => setPhase("out"), T_OUT));
    timers.push(setTimeout(() => setPhase("detail"), T_DETAIL));
    if (autoplay) {
      timers.push(setTimeout(() => setPhase("back"), T_DETAIL + hold));
      timers.push(
        setTimeout(() => {
          setActive((a) => (a + 1) % FILE_AGENTS.length);
          setRunId((r) => r + 1);
        }, T_DETAIL + hold + T_RETURN),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [active, runId, inView, autoplay, hold]);

  const go = useCallback((k: number) => {
    setActive(k);
    setRunId((r) => r + 1);
  }, []);

  const out = phase === "out" || phase === "detail";
  const show = phase === "detail";
  const activeSlot = AGENT_SLOT[active];
  const agent = FILE_AGENTS[active];

  const reveal = (delay: number): CSSProperties => ({
    opacity: show ? 1 : 0,
    transform: `translateY(${show ? 0 : 14}px)`,
    transitionDelay: `${show ? delay : 0}ms`,
  });

  return (
    <div ref={frameRef} className={`${s.frame} ${className ?? ""}`}>
      <div
        className={s.stage}
        style={{ transform: `scale(${scale ?? 1})`, visibility: scale === null ? "hidden" : "visible" }}
      >
        <div className={s.glow} style={{ opacity: out ? 1 : 0.35 }} aria-hidden="true" />

        <div className={s.eyebrow}>
          <span className={s.eyebrowDot} />
          <span className={s.eyebrowText}>YOUR AI TEAM</span>
        </div>

        <div className={s.scene} aria-hidden="true">
          {SLOTS.map((agentIdx, i) => {
            const isActive = out && i === activeSlot;
            const x = 480 + i * 92 + (out && i > activeSlot ? 44 : 0);
            const y = 330;
            const a = agentIdx === null ? null : FILE_AGENTS[agentIdx];
            return (
              <div
                key={i}
                className={s.folder}
                style={{
                  transform: isActive
                    ? `translate3d(${x - 50}px, ${y - 175}px, 170px) rotateY(-20deg) rotateX(3deg)`
                    : `translate3d(${x}px, ${y}px, 0px) rotateY(-42deg) rotateX(6deg)`,
                  opacity: out && !isActive ? 0.55 : 1,
                  zIndex: isActive ? 40 : i + 1,
                }}
              >
                <div
                  className={s.tab}
                  style={{ background: isActive ? "rgba(110,231,160,0.95)" : "rgba(230,233,238,0.5)" }}
                />
                <div
                  className={s.body}
                  style={{
                    boxShadow: isActive
                      ? "0 30px 70px rgba(0,0,0,0.5), 0 0 70px rgba(61,220,132,0.55)"
                      : "0 20px 50px rgba(0,0,0,0.45)",
                  }}
                >
                  <div className={s.sheet}>
                    {SHEET_LINES.map((l, j) => (
                      <div key={j} className={s.line} style={{ width: l.w, background: `rgba(20,24,30,${l.a})` }} />
                    ))}
                  </div>
                  <div className={s.green} style={{ opacity: isActive ? 1 : 0 }} />
                  {a && (
                    <div className={s.label} style={{ color: isActive ? "#FFFFFF" : "#1A1D23" }}>
                      <AgentIcon k={a.key} />
                      <span className={s.labelText}>{a.short}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={s.card}
          aria-live="polite"
          style={{
            opacity: show ? 1 : 0,
            transform: `translateY(${show ? 0 : 28}px) scale(${show ? 1 : 0.97})`,
          }}
        >
          <div className={s.cardOrb} aria-hidden="true" />
          <div className={s.cardInner}>
            <div className={`${s.cardTop} ${s.reveal}`} style={reveal(150)}>
              <span className={s.cardNum}>
                AI AGENT · {agent.num} / {String(FILE_AGENTS.length).padStart(2, "0")}
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F1115" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
            <h2 className={`${s.cardTitle} ${s.reveal}`} style={reveal(250)}>
              {agent.name}
            </h2>
            <p className={`${s.cardDesc} ${s.reveal}`} style={reveal(380)}>
              {agent.desc}
            </p>
            <div className={s.divider} style={{ opacity: show ? 1 : 0, transitionDelay: `${show ? 520 : 0}ms` }} />
            <div className={`${s.highlights} ${s.reveal}`} style={reveal(520)}>
              {agent.stat && (
                <div className={s.stat}>
                  <span className={s.statValue}>{agent.stat.value}</span>
                  <span className={s.statCaption}>{agent.stat.caption}</span>
                </div>
              )}
              {agent.note && (
                <div className={s.note}>
                  <span className={s.noteDot}>
                    <span className={s.noteDotCore} />
                  </span>
                  <span className={s.noteText} style={{ fontSize: agent.note.size }}>
                    {agent.note.text}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={s.pills} role="group" aria-label="Choose an agent">
          {FILE_AGENTS.map((a, k) => {
            const isCur = k === active;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => go(k)}
                aria-pressed={isCur}
                className={`${s.pill} ${isCur ? s.pillActive : ""}`}
              >
                <span className={s.pillNum}>{a.num}</span>
                {a.short}
                <span
                  className={s.pillBar}
                  style={{ width: `${isCur && show ? 100 : 0}%`, transitionDuration: `${isCur && show ? hold : 0}ms` }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
