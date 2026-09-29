import Link from "next/link";
import { Icon } from "./Icon";

export type LessonState = "done" | "current" | "next";

const STATE_TEXT: Record<LessonState, string> = { done: "Completed", current: "Current lesson", next: "Not started" };

/** One lesson in a module list. State is shown by icon and hidden text as well as colour. */
export function LessonRow({
  href,
  number,
  title,
  minutes,
  state,
  compact = false,
}: {
  href: string;
  number: string;
  title: string;
  minutes: number;
  state: LessonState;
  /** Right-rail size: tighter padding and 14px title. */
  compact?: boolean;
}) {
  const current = state === "current";
  return (
    <Link
      href={href}
      aria-current={current ? "step" : undefined}
      className={`flex min-h-11 items-center gap-3.5 rounded-[14px] no-underline ${compact ? "px-3 py-2.5" : "px-4 py-3.5"} transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus,#5CC8FF)] ${
        current ? "bg-[rgba(92,200,255,0.08)] text-frost shadow-[inset_0_0_0_1px_rgba(92,200,255,0.28)]" : state === "done" ? "text-frost" : "text-soft"
      }`}
    >
      {state === "done" && (
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[rgba(61,220,151,0.45)] bg-[rgba(61,220,151,0.14)]">
          <Icon name="check" size={14} color="#7FF0BD" strokeWidth={2.4} />
        </span>
      )}
      {current && (
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-cyan bg-[rgba(92,200,255,0.14)] shadow-[0_0_14px_rgba(92,200,255,0.45)]">
          <span className="h-2 w-2 rounded-[4px] bg-cyan" />
        </span>
      )}
      {state === "next" && <span className="h-[30px] w-[30px] shrink-0 rounded-full border border-white/[0.18]" />}
      <span className={`w-[30px] font-mono text-[12px] ${current ? "text-cyan" : "text-dim"}`}>{number}</span>
      <span className={`flex-1 leading-[1.35] ${compact ? "text-[14px]" : "text-[16px]"}`}>
        {title}
        <span className="sr-only"> ({STATE_TEXT[state]})</span>
      </span>
      <span className="font-mono text-[12px] text-mist">{minutes}m</span>
    </Link>
  );
}
