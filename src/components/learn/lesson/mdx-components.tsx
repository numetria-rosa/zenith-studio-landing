import { isValidElement, type ReactNode } from "react";
import { CodeBlock } from "@/components/obsidian/CodeBlock";
import { Answer, Practice } from "./Practice";
import {
  A, Assume, Callout, Connection, Def, ExerciseLink, FailureCards, Flow, H2, H3, InlineCode, Muted, Ol, P, ProdWarn, RecapGrid, Rule, Strong, Ul,
} from "./blocks";
import { InteractiveHost } from "./InteractiveHost";

/** The MDX component map for a lesson. `data` is the module's interactive data, `exercise` links to its Exercise tab. */
export function lessonComponents(opts: { module: number; data: Record<string, unknown>; exercise?: { href: string; title: string } }) {
  return {
    p: P,
    h2: H2,
    h3: H3,
    ul: Ul,
    ol: Ol,
    code: InlineCode,
    strong: Strong,
    a: A,
    Muted,
    Def,
    Callout,
    Assume,
    Connection,
    ProdWarn,
    Rule,
    Practice,
    Answer,
    FailureCards,
    Flow,
    RecapGrid,
    // Fenced code becomes the design's code card. ```python filename="ticket.py" sets the file name.
    pre: ({ children }: { children?: ReactNode }) => {
      const el = isValidElement(children) ? (children as { props: { className?: string; children?: ReactNode; "data-meta"?: string } }) : null;
      const language = /language-(\w+)/.exec(el?.props.className ?? "")?.[1];
      const filename = /filename="([^"]+)"/.exec(el?.props["data-meta"] ?? "")?.[1];
      return <CodeBlock code={String(el?.props.children ?? "").replace(/\n$/, "")} language={language} filename={filename} />;
    },
    ExerciseLink: () => (opts.exercise ? <ExerciseLink href={opts.exercise.href} title={opts.exercise.title} /> : null),
    Interactive: (p: { id: string; label: string }) => <InteractiveHost kind="interactive" {...p} data={opts.data} />,
    Decision: (p: { id: string; label: string; children: ReactNode }) => <InteractiveHost kind="decision" {...p} data={opts.data} />,
    DebugCase: (p: { id: string; label: string; evidence: string; question: string; children: ReactNode }) => (
      <InteractiveHost kind="debug" {...p} data={opts.data} />
    ),
  };
}
