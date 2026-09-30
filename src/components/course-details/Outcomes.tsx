import { Button } from "@/components/obsidian/Button";
import { Icon } from "@/components/obsidian/Icon";
import { Chip } from "@/components/obsidian/Pill";
import { Eyebrow } from "@/components/obsidian/Eyebrow";
import { SectionHead } from "@/components/obsidian/SectionHead";
import { courseContent } from "./data";
import { PriceLockup, type Price } from "./PriceLockup";

export function Outcomes({ checkoutHref, price }: { checkoutHref: string; price: Price | null }) {
  const { careerPath } = courseContent;
  return (
    <section id="outcomes" className="relative overflow-hidden bg-void">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_20%,#000_80%,transparent)]">
        <div
          className="pointer-events-none absolute -left-[300px] top-[900px] h-[1000px] w-[1000px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18), rgba(5,6,10,0) 62%)" }}
        />
        </div>
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-12 px-5 py-24 lg:px-20">
        <SectionHead
          eyebrow="What you’ll actually do"
          title="Skills you ship, not slides you watch."
          intro={`${numberWord(courseContent.outcomes.length)} things you can do by the end, each one practised on a real product rather than a toy example.`}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courseContent.outcomes.map((o) => (
            <div key={o} className="glass flex flex-col gap-[18px] rounded-[22px] p-6">
              <span className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-[rgba(199,176,255,0.35)] bg-[rgba(139,92,246,0.12)]">
                <Icon name="check" size={18} color="#C7B0FF" strokeWidth={2.2} />
              </span>
              <span className="text-[19px] font-medium leading-[1.35] tracking-[-0.01em]">{o}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="mr-2 font-mono text-[12px] uppercase tracking-[0.14em] text-dim">Tools and topics covered</span>
          {courseContent.topics.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>

        <div className="my-6 h-px bg-white/[0.08]" />

        <div className="grid gap-10 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-16">
          <div className="flex flex-col gap-4">
            <Eyebrow className="text-violet-text">Why it matters</Eyebrow>
            <h2 className="m-0 text-[40px] font-medium leading-[1.04] tracking-[-0.045em] sm:text-[52px]">
              The gap between a demo and a product.
            </h2>
          </div>
          <ol className="m-0 list-none p-0">
            {courseContent.whyItMatters.map((w, i) => (
              <li
                key={w}
                className={`grid grid-cols-[56px_minmax(0,1fr)] items-baseline gap-4 py-5 ${i > 0 ? "border-t border-white/[0.08]" : ""}`}
              >
                <span className="font-mono text-[13px] text-violet-text">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[21px] leading-[1.4] tracking-[-0.01em] text-frost">{w}</span>
              </li>
            ))}
          </ol>
        </div>

        <div id="career-path" className="mt-6">
          <div
            className="relative flex flex-col justify-between gap-12 overflow-hidden rounded-[32px] p-8 sm:p-14 lg:flex-row lg:items-center"
            style={{
              border: "1px solid rgba(199,176,255,0.30)",
              background: "linear-gradient(120deg, rgba(139,92,246,0.22), rgba(59,107,255,0.14) 55%, rgba(92,200,255,0.08))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            <div className="flex max-w-[760px] flex-col gap-4">
              <Eyebrow className="text-violet-soft">{careerPath.eyebrow}</Eyebrow>
              <h2 className="m-0 text-[36px] font-medium leading-[1.05] tracking-[-0.04em] sm:text-[48px]">{careerPath.title}</h2>
              <p className="m-0 text-[18px] leading-[1.6] text-soft">{careerPath.body}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3">
              {price && <PriceLockup price={price} compact />}
              <Button href={checkoutHref} size="xl" arrow>
                Start the course
              </Button>
              <Button href="#curriculum" variant="glass" size="xl">
                See the curriculum
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function numberWord(n: number) {
  return ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"][n] ?? String(n);
}
