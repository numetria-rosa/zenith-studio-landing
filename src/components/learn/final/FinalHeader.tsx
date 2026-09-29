import type { ReactNode } from "react";
import { Eyebrow } from "@/components/obsidian/Eyebrow";

/** Page header for the Final module screens: eyebrow, H1, lede, optional actions on the right. */
export function FinalHeader({
  eyebrow = "Final module",
  title,
  lede,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lede: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div className="flex max-w-[760px] flex-col gap-4">
        <Eyebrow className="!text-[12.5px] text-cyan">{eyebrow}</Eyebrow>
        <h1 className="m-0 text-[36px] font-medium leading-[1.05] tracking-[-0.04em] sm:text-[44px]">{title}</h1>
        <p className="m-0 text-[18px] leading-[1.6] text-soft">{lede}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
