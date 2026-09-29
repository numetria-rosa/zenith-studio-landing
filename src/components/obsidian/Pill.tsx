import type { ReactNode } from "react";

/** Bordered mono pill used for durations and "Start here" badges. */
export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/[0.14] px-[11px] py-[5px] font-mono text-[12px] text-soft ${className}`}
    >
      {children}
    </span>
  );
}

/** Glass chip used for topic tags. */
export function Chip({ children }: { children: ReactNode }) {
  return <span className="glass rounded-full px-4 py-[9px] text-[15px] text-soft">{children}</span>;
}
