import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/obsidian/Icon";
import { slugify } from "@/lib/aie/toc";

/* Lesson building blocks. Each one maps a block of the old course (or a block the design defines) onto the
   Obsidian primitives: glass surfaces, cyan accent, Geist / Geist Mono. */

const text = (children: ReactNode) => (typeof children === "string" ? children : "");

export function P({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[17.5px] leading-[1.75] text-soft">{children}</p>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[15.5px] leading-[1.65] text-mist">{children}</p>;
}

export function H2({ children }: { children?: ReactNode }) {
  return (
    <h2 id={slugify(text(children))} className="mb-0 mt-3 scroll-mt-24 text-[28px] font-medium tracking-[-0.025em]">
      {children}
    </h2>
  );
}

export function H3({ children }: { children?: ReactNode }) {
  return <h3 className="mb-0 mt-2 text-[21px] font-medium tracking-[-0.02em]">{children}</h3>;
}

export function InlineCode({ children }: { children?: ReactNode }) {
  return <code className="font-mono text-[15px] text-cyan-text">{children}</code>;
}

export function Ul({ children }: { children?: ReactNode }) {
  return <ul className="m-0 flex list-disc flex-col gap-1.5 pl-6 text-[17.5px] leading-[1.75] text-soft marker:text-dim">{children}</ul>;
}

export function Ol({ children }: { children?: ReactNode }) {
  return <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-6 text-[17.5px] leading-[1.75] text-soft marker:font-mono marker:text-dim">{children}</ol>;
}

export function Strong({ children }: { children?: ReactNode }) {
  return <strong className="font-semibold text-frost">{children}</strong>;
}

export function A({ href, children }: { href?: string; children?: ReactNode }) {
  return (
    <a href={href} className="text-cyan-text underline underline-offset-2 hover:text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">
      {children}
    </a>
  );
}

/** Definition: a glass card with a mono label. */
export function Def({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section id={slugify(title)} className="glass flex scroll-mt-24 flex-col gap-2.5 rounded-[20px] p-[22px] [&_p]:text-[16.5px] [&_p]:leading-[1.7]">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">{title}</span>
      {children}
    </section>
  );
}

/** The design's "Key idea" callout. */
export function Callout({ children, label = "Key idea" }: { children: ReactNode; label?: string }) {
  return (
    <aside className="flex gap-4 rounded-[20px] border border-cyan/35 bg-cyan/[0.07] px-6 py-[22px]">
      <Icon name="bulb" size={24} color="#5CC8FF" className="shrink-0" />
      <div className="flex flex-col gap-1.5 [&_p]:text-[19px] [&_p]:font-medium [&_p]:leading-[1.45] [&_p]:tracking-[-0.01em] [&_p]:text-frost [&_strong]:font-medium">
        <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-cyan">{label}</span>
        {children}
      </div>
    </aside>
  );
}

export function Assume({ children }: { children: ReactNode }) {
  return (
    <div className="glass-row flex items-start gap-3 rounded-[14px] px-4 py-3.5 [&_p]:text-[16px] [&_p]:leading-[1.6]">
      <Icon name="check" size={17} color="#7FF0BD" strokeWidth={2.2} className="mt-1 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Connection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      id={slugify(title)}
      className="flex scroll-mt-24 flex-col gap-2.5 rounded-[20px] border border-white/10 p-[22px] [&_p]:text-[16.5px] [&_p]:leading-[1.7]"
      style={{ background: "linear-gradient(135deg, rgba(92,200,255,0.08), rgba(59,107,255,0.05) 60%, rgba(255,255,255,0.02))", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">{title}</span>
      {children}
    </section>
  );
}

export function ProdWarn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      id={slugify(title)}
      className="flex scroll-mt-24 flex-col gap-3 rounded-[20px] border border-[rgba(255,210,122,0.30)] bg-[rgba(255,210,122,0.05)] p-[22px] [&_li]:text-[16px] [&_li]:leading-[1.65] [&_ul]:text-[16px]"
    >
      <span className="inline-flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-[0.14em] text-amber-text">
        <Icon name="warn" size={15} color="#FFD27A" />
        {title}
      </span>
      {children}
    </section>
  );
}

export function Rule({ children }: { children: ReactNode }) {
  return <div className="glass-row rounded-[14px] px-4 py-3.5 [&_p]:text-[15.5px] [&_p]:leading-[1.65]">{children}</div>;
}

/** Link card to the module's exercise, replacing the old in-page editor. */
export function ExerciseLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="glass flex items-center gap-4 rounded-[20px] p-[18px] text-frost no-underline transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
    >
      <span className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[14px] border border-white/[0.12] bg-white/[0.05]">
        <Icon name="code" size={22} color="#5CC8FF" />
      </span>
      <span className="flex flex-1 flex-col gap-[3px]">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">Code exercise</span>
        <b className="text-[16.5px] font-medium">{title}</b>
        <span className="text-[13px] text-mist">Runs in the browser, with real tests</span>
      </span>
      <Icon name="arrow" size={18} color="#A9AEBA" />
    </Link>
  );
}

type Failure = { label: string; color: string; title: string; text: string; tag: string };

/** The design's row of three "ways it fails" cards. */
export function FailureCards({ items }: { items: Failure[] }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row">
      {items.map((f) => (
        <div key={f.label} className="glass flex flex-1 flex-col gap-2.5 rounded-[20px] p-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: f.color }}>{f.label}</span>
          <b className="text-[17px] font-medium">{f.title}</b>
          <span className="text-[14.5px] leading-[1.55] text-mist">{f.text}</span>
          <span className="pt-1 font-mono text-[12px]" style={{ color: f.color }}>{f.tag}</span>
        </div>
      ))}
    </div>
  );
}

const NODE = "whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-[14px]";
const LINE = <span aria-hidden className="h-[1.5px] min-w-[18px] flex-1 bg-frost/35" />;

/** The design's pipeline diagram: a main path, and a failure branch underneath. */
export function Flow({ steps, failureLabel, failureSteps }: { steps: string[]; failureLabel: string; failureSteps: string[] }) {
  const last = steps.length - 1;
  return (
    <div className="flex flex-col gap-[18px] overflow-x-auto rounded-[22px] border border-white/10 bg-ink p-[26px]" role="img" aria-label={`${steps.join(", then ")}. ${failureLabel}: ${failureSteps.join(", then ")}.`}>
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <span key={s} className="contents">
            <span
              className={`${NODE} ${i === last ? "border-[rgba(61,220,151,0.5)] bg-[rgba(61,220,151,0.08)] text-mint-text" : "border-white/[0.14] bg-white/[0.04] text-frost"}`}
            >
              {s}
            </span>
            {i < last && LINE}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 pl-[110px]">
        <span className="font-mono text-[12px] text-amber-text">{failureLabel}</span>
        {LINE}
        {failureSteps.map((s, i) => (
          <span key={s} className="contents">
            <span
              className={`${NODE} ${i === failureSteps.length - 1 ? "border-[rgba(255,92,122,0.5)] bg-[rgba(255,92,122,0.08)] text-ember-text" : "border-[rgba(245,184,61,0.5)] bg-[rgba(245,184,61,0.07)] text-amber-text"}`}
            >
              {s}
            </span>
            {i < failureSteps.length - 1 && LINE}
          </span>
        ))}
      </div>
    </div>
  );
}

/** "The course, end to end": one card per module (module 8's recap). */
export function RecapGrid({ items }: { items: { n: string; t: string; d: string }[] }) {
  return (
    <ul className="m-0 grid list-none gap-3.5 p-0 sm:grid-cols-2">
      {items.map((i) => (
        <li key={i.n} className="glass flex flex-col gap-1.5 rounded-[20px] p-[18px]">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">{i.n}</span>
          <b className="text-[16.5px] font-medium tracking-[-0.01em]">{i.t}</b>
          <span className="text-[14.5px] leading-[1.55] text-mist">{i.d}</span>
        </li>
      ))}
    </ul>
  );
}
