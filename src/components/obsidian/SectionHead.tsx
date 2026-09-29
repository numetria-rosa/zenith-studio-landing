import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

/** Eyebrow + H2 on the left, intro copy on the right aligned to the baseline. */
export function SectionHead({
  eyebrow,
  title,
  intro,
  accent = "text-violet-text",
}: {
  eyebrow: string;
  title: ReactNode;
  intro: ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
      <div className="flex flex-col gap-4">
        <Eyebrow className={accent}>{eyebrow}</Eyebrow>
        <h2 className="m-0 text-[40px] font-medium leading-[1.02] tracking-[-0.045em] sm:text-[60px]">{title}</h2>
      </div>
      <p className="m-0 max-w-[440px] text-[18px] leading-[1.6] text-mist">{intro}</p>
    </div>
  );
}
