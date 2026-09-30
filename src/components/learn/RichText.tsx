import { Fragment, type ReactNode } from "react";

/** Plain text with `code` spans and **bold**, as stored in the Python Foundations content. No MDX, so `{` and `<` are safe. */
export function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(/`([^`]+)`|\*\*([^*]+)\*\*/g)) {
    parts.push(<Fragment key={last}>{text.slice(last, m.index)}</Fragment>);
    parts.push(m[1] !== undefined
      ? <code key={m.index} className="font-mono text-[0.9em] text-cyan-text">{m[1]}</code>
      : <b key={m.index} className="font-medium text-frost">{m[2]}</b>);
    last = m.index! + m[0].length;
  }
  parts.push(<Fragment key="end">{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}
