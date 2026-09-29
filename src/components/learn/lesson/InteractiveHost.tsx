import type { ComponentType, ReactNode } from "react";
import { DebugCase, Decision, M1Pipeline, M1Spot, M2Context, M2Rag, M3Angle, M3Rank, M3TopK, M4Idempotency, M4Spot, M5Trace, M5Travel, M6Backoff, M6Thunder, M7Regression, M7Spot } from "@/components/learn/interactives/widgets";
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

type Data = Record<string, unknown>;

/** Widget id (module, old section number) -> its ported component. */
const WIDGETS: Record<string, ComponentType<{ data: Data }>> = {
  "m1-s4": M1Spot,
  "m1-s11": M1Pipeline,
  "m2-s2": M2Context,
  "m2-s11": M2Rag,
  "m3-s3": M3Angle,
  "m3-s4": M3Rank,
  "m3-s11": M3TopK,
  "m4-s2": M4Spot,
  "m4-s11": M4Idempotency,
  "m5-s2": M5Trace,
  "m5-s11": M5Travel,
  "m6-s2": M6Backoff,
  "m6-s11": M6Thunder,
  "m7-s2": M7Spot,
  "m7-s11": M7Regression,
};

type Props = {
  kind: "interactive" | "decision" | "debug";
  id: string;
  label: string;
  data: Data;
  children?: ReactNode;
  evidence?: string;
  question?: string;
};

/** Renders the widget for an interactive block. A block with no ported widget fails loudly, so nothing is silently dropped. */
export function InteractiveHost({ kind, id, label, data, children, evidence, question }: Props) {
  if (kind === "decision") {
    return (
      <InteractiveFrame label={label}>
        <Decision data={data}>{children}</Decision>
      </InteractiveFrame>
    );
  }
  if (kind === "debug") {
    return (
      <InteractiveFrame label={label}>
        <DebugCase data={data} evidence={evidence ?? ""} question={question ?? ""}>{children}</DebugCase>
      </InteractiveFrame>
    );
  }
  const Widget = WIDGETS[id];
  if (!Widget) throw new Error(`No widget ported for interactive "${id}"`);
  return (
    <InteractiveFrame label={label}>
      <Widget data={data} />
    </InteractiveFrame>
  );
}
