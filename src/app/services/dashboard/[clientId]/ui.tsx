import type { ReactNode } from "react";
import s from "./ui.module.css";

export type Tone = "run" | "need" | "done" | "dim";

const TONE_LABEL: Record<Tone, string> = { run: "Running", need: "Needs you", done: "Done", dim: "Idle" };
const TONE_CLASS: Record<Tone, string> = { run: s.pillRun, need: s.pillNeed, done: s.pillDone, dim: s.pillDim };

export function StatusPill({ tone, children }: { tone: Tone; children?: ReactNode }) {
  return (
    <span className={`${s.pill} ${TONE_CLASS[tone]}`}>
      <span className={s.pillDot} />
      {children ?? TONE_LABEL[tone]}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className={s.eyebrow}>{children}</span>;
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`${s.btnPrimary} ${props.className ?? ""}`} />;
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`${s.btnGhost} ${props.className ?? ""}`} />;
}

export function KpiTile({ label, value, need }: { label: string; value: string | number; need?: boolean }) {
  return (
    <div className={`${s.kpiTile} ${need ? s.kpiNeed : ""}`}>
      <div className={s.kpiLabel}>{label}</div>
      <div className={s.kpiValue}>{value}</div>
    </div>
  );
}

export function ActivityRow({ tone, text, meta }: { tone: Tone; text: string; meta: string }) {
  const dotColor = tone === "run" ? "var(--zc-run)" : tone === "need" ? "var(--zc-need)" : tone === "done" ? "var(--zc-done)" : "var(--zc-dim)";
  return (
    <div className={s.activityItem}>
      <span className={s.activityDot} style={{ background: dotColor }} />
      <div>
        <div className={s.activityText}>{text}</div>
        <div className={s.activityMeta}>{meta}</div>
      </div>
    </div>
  );
}

export { s as uiStyles };
