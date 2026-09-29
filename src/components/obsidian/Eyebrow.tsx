import type { ReactNode } from "react";

/** Mono uppercase label. Colour comes from `className` (e.g. text-violet-text). */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[13px] uppercase tracking-[0.16em] ${className}`}>{children}</span>
  );
}
