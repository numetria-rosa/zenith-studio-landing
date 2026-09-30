import { Children, isValidElement, type ReactNode } from "react";
import { Reveal } from "./Reveal";

export function Answer({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** "Check yourself" card: the question is always visible, the answer is behind a button. Same look as the quiz options. */
export function Practice({ label, children }: { label?: string; children: ReactNode }) {
  const parts = Children.toArray(children);
  const answer = parts.find((c) => isValidElement(c) && c.type === Answer);
  const question = parts.filter((c) => c !== answer);
  return <Reveal label={label ?? "Check yourself"} question={question} answer={isValidElement(answer) ? (answer.props as { children: ReactNode }).children : null} />;
}
