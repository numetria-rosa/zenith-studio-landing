import { Fragment, type ReactNode } from "react";
import { Icon } from "@/components/obsidian/Icon";
import { inlineTokens, type CheatSheet } from "@/lib/aie/cheatsheets";
import { CopyButton } from "./CopyButton";
import { PrintButton } from "./PrintButton";

const glass = "border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
/** Section colours cycle through the design's accents. `ac` is the darker ink used on white paper, matching the PDF. */
const ACCENTS = [
  { screen: "#5CC8FF", ac: "#1F6F97", tint: "#EAF5FB", line: "#BFE0F0" },
  { screen: "#FFD27A", ac: "#A8700C", tint: "#FDF5E3", line: "#F0DDAE" },
  { screen: "#7FF0BD", ac: "#23795A", tint: "#E8F6EF", line: "#B9E2CF" },
  { screen: "#C7B0FF", ac: "#6444B4", tint: "#F0EBFB", line: "#D3C6F0" },
] as const;
type Accent = (typeof ACCENTS)[number];

function Inline({ text }: { text: string }) {
  return (
    <>
      {inlineTokens(text).map((t, i) =>
        t.code ? (
          <code key={i} className="font-mono text-[0.92em] text-cyan-text">
            {t.t}
          </code>
        ) : t.bold ? (
          <b key={i} className="font-medium text-frost">
            {t.t}
          </b>
        ) : (
          <Fragment key={i}>{t.t}</Fragment>
        ),
      )}
    </>
  );
}

function Card({ label, n, accent, children }: { label: string; n: number; accent: Accent; children: ReactNode }) {
  return (
    <section
      data-card
      className={`mb-[18px] flex break-inside-avoid flex-col gap-3.5 rounded-[22px] p-[22px] ${glass}`}
      style={{ "--ac": accent.ac, "--tint": accent.tint, "--line": accent.line } as React.CSSProperties}
    >
      <h2 className="m-0 flex items-center gap-2.5 font-mono text-[11.5px] font-normal uppercase tracking-[0.14em]" style={{ color: accent.screen }}>
        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold text-void print:text-white" style={{ background: accent.screen }}>
          {n}
        </span>
        {label}
      </h2>
      {children}
    </section>
  );
}

/** One module's cheat sheet in the design's card layout (two balanced columns, one on a phone). Print styles live in globals.css. */
export function CheatSheetView({
  sheet,
  glossary,
  eyebrow,
  title,
  pdfHref,
}: {
  sheet: CheatSheet;
  glossary?: { term: string; definition: string }[];
  eyebrow: string;
  title: string;
  pdfHref: string;
}) {
  return (
    <div data-cheatsheet className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-mint-text">{eyebrow}</span>
          <h1 className="m-0 text-[36px] font-medium leading-[1.02] tracking-[-0.045em] sm:text-[48px]">{title}</h1>
        </div>
        <div className="flex gap-3 print:hidden">
          <PrintButton />
          <a
            href={pdfHref}
            download
            className="inline-flex min-h-[46px] items-center gap-2.5 rounded-full bg-frost px-[22px] text-[15px] font-medium text-void no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            Download PDF
            <Icon name="download" size={16} color="#05060A" strokeWidth={2} />
          </a>
        </div>
      </div>

      <div className="columns-1 gap-[18px] md:columns-2">
        {sheet.sections.map((s, i) => (
          <Card key={s.label} label={s.label} n={i + 1} accent={ACCENTS[i % ACCENTS.length]!}>
            {s.items && (
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {s.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-[1.5] text-soft">
                    <Icon name="check" size={16} color="#7FF0BD" strokeWidth={2.4} className="mt-[3px] shrink-0" />
                    <span>
                      <Inline text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {s.formula && (
              <div data-formula className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-ink px-[18px] py-4">
                <code className="break-words font-mono text-[13px] leading-[22px] text-code-default">{s.formula}</code>
                <span className="print:hidden"><CopyButton text={s.formula} /></span>
              </div>
            )}
            {s.checklist && (
              <ul className="m-0 flex list-none flex-col p-0">
                {s.checklist.map((c) => (
                  <li key={c}>
                    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-[15px] leading-[1.5] text-soft">
                      <input type="checkbox" className="mt-1 h-[18px] w-[18px] shrink-0 accent-[#5CC8FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan" />
                      <span>
                        <Inline text={c} />
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
        {glossary && glossary.length > 0 && (
          <Card label="Glossary" n={sheet.sections.length + 1} accent={ACCENTS[sheet.sections.length % ACCENTS.length]!}>
            <dl className="m-0 flex flex-col gap-3">
              {glossary.map((g) => (
                <div key={g.term}>
                  <dt className="font-mono text-[13px] text-cyan-text">{g.term}</dt>
                  <dd className="m-0 text-[14.5px] leading-[1.5] text-soft">{g.definition}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </div>
    </div>
  );
}

