import type { ReactNode } from "react";
import { slugify } from "@/lib/aie/toc";

/** Frame around the old course's interactive widgets: cyan-dot label pill over a glass panel. */
export function InteractiveFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section id={slugify(label)} className="glass flex scroll-mt-24 flex-col gap-4 rounded-[22px] p-6">
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-cyan/10 px-3 py-[5px] font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_#5CC8FF]" />
        {label}
      </span>
      {children}
    </section>
  );
}

type Props = {
  kind: "interactive" | "decision" | "debug";
  id: string;
  label: string;
  data: Record<string, unknown>;
  children?: ReactNode;
  evidence?: string;
  question?: string;
};

/** Picks the ported widget for an interactive block by id. Widgets are added module by module. */
export function InteractiveHost({ label, children }: Props) {
  return (
    <InteractiveFrame label={label}>
      {children}
    </InteractiveFrame>
  );
}
