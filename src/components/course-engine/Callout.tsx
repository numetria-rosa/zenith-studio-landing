import type { ReactNode } from "react";

const TONES = {
  info: { border: "#5fc2e8", label: "#5fc2e8" },
  predict: { border: "#8b7cf6", label: "#8b7cf6" },
  warning: { border: "#f0b429", label: "#f0b429" },
  danger: { border: "#ff8585", label: "#ff8585" },
} as const;

export function Callout({
  tone = "info",
  label,
  children,
}: {
  tone?: keyof typeof TONES;
  label: string;
  children: ReactNode;
}) {
  const c = TONES[tone];
  return (
    <div
      className="mt-5 rounded-xl border bg-[#191d26] px-5 py-4"
      style={{ borderColor: c.border + "55" }}
    >
      <div
        className="mb-1.5 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em]"
        style={{ color: c.label }}
      >
        {label}
      </div>
      <div className="text-[14.5px] leading-relaxed text-[#eeeee7] [&_code]:rounded [&_code]:bg-[#8b7cf6]/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-[family-name:var(--font-course-mono)] [&_code]:text-[13px] [&_code]:text-[#8b7cf6]">
        {children}
      </div>
    </div>
  );
}
