import { highlight } from "./highlight";

/** Code card: header strip (file name, language label) over a highlighted, horizontally scrollable body. */
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
  const tokens = highlight(code, language);
  return (
    <figure className="m-0 overflow-hidden rounded-[18px] border border-white/10 bg-ink">
      <figcaption className="flex items-center justify-between border-b border-white/[0.08] px-[18px] py-3 font-mono text-[12px]">
        <span className="text-mist">{filename ?? ""}</span>
        <span className="uppercase tracking-[0.12em] text-dim">{language}</span>
      </figcaption>
      <pre
        tabIndex={0}
        className="m-0 overflow-auto px-[18px] py-4 font-mono text-[13.5px] leading-[22px] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <code>
          {tokens.map((t, i) => (
            <span key={i} style={{ color: t.color }}>
              {t.text}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
