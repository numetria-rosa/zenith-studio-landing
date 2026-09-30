"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/obsidian/Icon";

/* Atoms shared by the ported course widgets: same glass, cyan and mint/ember status language as the quiz. */

export const fmt = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));

export function Btn({ primary, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-[18px] text-[14.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan disabled:cursor-not-allowed disabled:opacity-40 ${
        primary ? "bg-frost text-void hover:bg-white" : "glass text-frost hover:bg-white/[0.07]"
      } ${className}`}
    />
  );
}

export function Slider({
  id,
  label,
  shown,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: ReactNode;
  /** The value as displayed in the label. */
  shown: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14.5px] text-soft">
        {label} <b className="font-mono font-medium text-cyan-text">{shown}</b>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full cursor-pointer accent-[#5CC8FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
      />
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

/** A number with a caption. `warn` adds the ember tint plus a warning icon, so the state is not colour alone. */
export function Stat({ value, label, warn }: { value: ReactNode; label: ReactNode; warn?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-[14px] border p-4 ${warn ? "border-[rgba(255,92,122,0.40)] bg-[rgba(255,92,122,0.06)]" : "border-white/[0.07] bg-white/[0.03]"}`}>
      <b className="flex items-center gap-2 text-[26px] font-medium tracking-[-0.03em]">
        {warn && <Icon name="warn" size={17} color="#FF9BB0" />}
        {warn && <span className="sr-only">Warning: </span>}
        {value}
      </b>
      <span className="text-[13px] leading-[1.4] text-mist">{label}</span>
    </div>
  );
}

/** Result box. `ok` is mint with a check, `bad` is ember with a cross, `info` is neutral. */
export function Result({ tone, children }: { tone: "ok" | "bad" | "info"; children: ReactNode }) {
  const style = {
    ok: "border-[rgba(61,220,151,0.40)] bg-[rgba(61,220,151,0.07)]",
    bad: "border-[rgba(255,92,122,0.40)] bg-[rgba(255,92,122,0.07)]",
    info: "border-white/[0.09] bg-white/[0.03]",
  }[tone];
  return (
    <div role="status" className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-[15px] leading-[1.6] text-soft ${style}`}>
      {tone === "ok" && <Icon name="check" size={17} color="#7FF0BD" strokeWidth={2.4} className="mt-0.5 shrink-0" />}
      {tone === "bad" && <Icon name="close" size={17} color="#FF9BB0" strokeWidth={2.4} className="mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-ink px-4 py-3 font-mono text-[13px] leading-[1.6] text-code-default">{children}</pre>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[14px] leading-[1.6] text-mist">{children}</p>;
}

export function Caption({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">{children}</span>;
}

/** Horizontal bar: label, track, value. */
export function BarRow({ label, percent, value, color = "#5CC8FF" }: { label: ReactNode; percent: number; value: ReactNode; color?: string }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)_72px] items-center gap-3 text-[13px] sm:grid-cols-[110px_minmax(0,1fr)_88px]">
      <span className="font-mono text-[12px] text-mist">{label}</span>
      <span className="h-2 overflow-hidden rounded bg-white/[0.07]">
        <span className="block h-full rounded" style={{ width: `${Math.max(0, Math.min(100, percent))}%`, background: color }} />
      </span>
      <span className="text-right font-mono text-[12px] text-soft">{value}</span>
    </div>
  );
}

const ROLE_COLORS: Record<string, string> = { reason: "#A9AEBA", act: "#5CC8FF", observe: "#FFD27A", final: "#7FF0BD" };

/** One line of an agent trace: role tag, then text. */
export function TraceLine({ role, children }: { role: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-white/[0.06] py-2.5 last:border-b-0">
      <span className="w-[68px] shrink-0 font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: ROLE_COLORS[role] ?? "#A9AEBA" }}>
        {role}
      </span>
      <span className="min-w-0 flex-1 break-words font-mono text-[13px] leading-[1.6] text-soft">{children}</span>
    </div>
  );
}

/** One answer option, in the quiz's language: idle, correct (mint), chosen-wrong (ember). */
export function OptionButton({ state, disabled, onClick, children }: { state: "idle" | "correct" | "wrong"; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  const look = {
    idle: "border-white/[0.12] hover:border-cyan/40 hover:bg-white/[0.04]",
    correct: "border-[rgba(61,220,151,0.55)] bg-[rgba(61,220,151,0.08)]",
    wrong: "border-[rgba(255,92,122,0.55)] bg-[rgba(255,92,122,0.08)]",
  }[state];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-11 w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] leading-[1.55] text-frost transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${look}`}
    >
      <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        {state === "correct" && <Icon name="check" size={17} color="#7FF0BD" strokeWidth={2.4} />}
        {state === "wrong" && <Icon name="close" size={17} color="#FF9BB0" strokeWidth={2.4} />}
        {state === "idle" && <span className="h-[14px] w-[14px] rounded-full border border-white/25" />}
      </span>
      <span className="flex-1">
        {children}
        {state === "correct" && <span className="sr-only"> (correct answer)</span>}
        {state === "wrong" && <span className="sr-only"> (your answer, not correct)</span>}
      </span>
    </button>
  );
}
