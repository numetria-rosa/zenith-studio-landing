"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { markDashboardTourSeen } from "./onboarding-actions";
import s from "./tour.module.css";

/* First-visit guided tour of the client dashboard. Shown once per account
   (User.dashboardTourSeenAt). Steps whose target isn't on screen (e.g. the
   setup checklist once everything is connected, or the sidebar on a phone)
   are skipped instead of pointing at nothing. */

type Step = { target?: string; title: string; body: string };

const STEPS: Step[] = [
  { title: "Welcome to your dashboard", body: "A one-minute tour of where everything is. You can skip it anytime." },
  {
    target: "setup",
    title: "Start here",
    body: "These are the tools your agents need connected. Click Start on the first step; each one takes a couple of minutes and switches that agent on. This list disappears once everything is connected.",
  },
  {
    target: "team-map",
    title: "Your team at a glance",
    body: "Every agent and what it's doing right now. Blue is running, amber needs you, green is ready, grey dashed is coming soon. Click any agent to open it.",
  },
  { target: "nav-agents", title: "Agents", body: "Each agent's setup, its step-by-step workflow, and its most recent work." },
  {
    target: "nav-approvals",
    title: "Approvals",
    body: "Anything an agent drafted that needs your OK before it goes out, like email replies, time entries, or renewal reminders.",
  },
  { target: "nav-activity", title: "Activity", body: "A plain-English log of everything your team has done." },
  { target: "nav-settings", title: "Settings", body: "Your connected tools, your plan, and cancel anytime." },
  {
    target: "ask",
    title: "Ask your team",
    body: "Quick answers from your live data: what needs you, what got done, and what's left to set up.",
  },
];

type Rect = { top: number; left: number; width: number; height: number };
const PAD = 8;

function findTarget(name?: string): HTMLElement | null {
  if (!name) return null;
  const el = document.querySelector<HTMLElement>(`[data-tour="${name}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}

export function DashboardTour() {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // Decide the steps once the page has laid out, keeping only visible targets.
  useEffect(() => {
    const t = setTimeout(() => setSteps(STEPS.filter((st) => !st.target || findTarget(st.target))), 300);
    return () => clearTimeout(t);
  }, []);

  const step = steps?.[index];

  const measure = useCallback(() => {
    const el = findTarget(step?.target);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, [step]);

  useLayoutEffect(() => {
    const el = findTarget(step?.target);
    if (el) {
      const r = el.getBoundingClientRect();
      // Instant, not smooth: a smooth scroll interrupted by the next step
      // left targets off-screen.
      if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: "center" });
    }
    const raf = requestAnimationFrame(measure);
    const t = setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, measure]);

  const close = useCallback(() => {
    setSteps([]);
    void markDashboardTourSeen();
  }, []);

  const next = useCallback(() => {
    if (!steps) return;
    if (index >= steps.length - 1) close();
    else setIndex((i) => i + 1);
  }, [steps, index, close]);

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, next, back]);

  if (!steps || !step) return null;

  // Card goes below the target if there's room, else above; centered when no target.
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const cardW = Math.min(360, vw - 32);
  let cardStyle: React.CSSProperties;
  if (!rect) {
    cardStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: cardW };
  } else {
    const roomRight = vw - (rect.left + rect.width);
    const sideBySide = roomRight > cardW + 32 && rect.height > vh * 0.35;
    if (sideBySide) {
      cardStyle = { top: Math.max(16, Math.min(rect.top, vh - 260)), left: rect.left + rect.width + 16, width: cardW };
    } else {
      const below = rect.top + rect.height + 16;
      const top = Math.min(vh - 246, Math.max(16, below + 230 < vh ? below : rect.top - 246));
      const left = Math.max(16, Math.min(rect.left, vw - cardW - 16));
      cardStyle = { top, left, width: cardW };
    }
  }

  return (
    <div className={s.layer} role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {rect ? (
        <div className={s.spotlight} style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />
      ) : (
        <div className={s.scrim} />
      )}
      <div className={s.card} style={cardStyle}>
        <span className={s.counter}>
          {index + 1} / {steps.length}
        </span>
        <h2 id="tour-title" className={s.title}>
          {step.title}
        </h2>
        <p className={s.body}>{step.body}</p>
        <div className={s.actions}>
          <button type="button" className={s.skip} onClick={close}>
            Skip tour
          </button>
          <div className={s.nav}>
            {index > 0 && (
              <button type="button" className={s.back} onClick={back}>
                Back
              </button>
            )}
            <button type="button" className={s.next} onClick={next} autoFocus>
              {index === steps.length - 1 ? "Finish" : index === 0 ? "Show me around" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
