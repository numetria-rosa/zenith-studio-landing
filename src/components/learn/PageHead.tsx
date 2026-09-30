import type { ReactNode } from "react";

/** Eyebrow, title and subtitle at the top of a shared (non-module) course-app page. */
export function PageHead({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end lg:gap-8">
      <div className="flex flex-col gap-2.5">
        <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-cyan">{eyebrow}</span>
        <h1 className="m-0 text-[36px] font-medium leading-[1.05] tracking-[-0.04em] sm:text-[44px]">{title}</h1>
        {subtitle && <p className="m-0 max-w-[680px] text-[17px] leading-[1.6] text-mist">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Small glass status chip. */
export function Tag({ tone = "neutral", children }: { tone?: "neutral" | "mint" | "cyan" | "amber" | "ember"; children: ReactNode }) {
  const tones = {
    neutral: "border-white/[0.18] bg-white/[0.05] text-soft",
    mint: "border-[rgba(61,220,151,0.5)] bg-[rgba(61,220,151,0.10)] text-mint-text",
    cyan: "border-[rgba(92,200,255,0.4)] bg-[rgba(92,200,255,0.10)] text-cyan-text",
    amber: "border-[rgba(245,184,61,0.4)] bg-[rgba(245,184,61,0.10)] text-amber-text",
    ember: "border-[rgba(255,92,122,0.4)] bg-[rgba(255,92,122,0.10)] text-ember-text",
  } as const;
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[11.5px] tracking-[0.06em] ${tones[tone]}`}>{children}</span>;
}
