import type { ReactNode } from "react";

/** Numbered square, bordered and coloured by the module's stage. */
export function StageBadge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] border font-mono text-[16px]"
      style={{ borderColor: color, color }}
    >
      {children}
    </span>
  );
}
