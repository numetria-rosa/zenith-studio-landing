import { Icon } from "./Icon";
import { highlightLines } from "./highlight";

/** Code card from the design: header strip (file name with icon, language label) over numbered, highlighted lines. */
export function CodeBlock({
  code,
  language = "python",
  filename,
  maxHeight,
}: {
  code: string;
  language?: string;
  filename?: string;
  maxHeight?: number;
}) {
  const lines = highlightLines(code.replace(/\n$/, ""), language);
  return (
    <figure className="m-0 overflow-hidden rounded-[18px] border border-white/10 bg-ink">
      <figcaption className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.025] px-4 py-2.5">
        <span className="inline-flex items-center gap-2 font-mono text-[12px] text-soft">
          <Icon name="code" size={14} color="#9BDDFF" />
          {filename ?? language}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">{language}</span>
      </figcaption>
      <pre
        tabIndex={0}
        className="m-0 overflow-auto px-[18px] py-4 font-mono text-[14px] leading-6 text-code-default focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <code className="block">
          {lines.map((tokens, i) => (
            <span key={i} className="flex min-h-6 gap-[18px]">
              <span aria-hidden className="w-[22px] shrink-0 select-none text-right text-line-num">
                {i + 1}
              </span>
              <span className="whitespace-pre">
                {tokens.length ? tokens.map((t, j) => <span key={j} style={{ color: t.color }}>{t.text}</span>) : "​"}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
