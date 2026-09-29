import { Icon } from "@/components/obsidian/Icon";
import { Pill } from "@/components/obsidian/Pill";
import { SectionHead } from "@/components/obsidian/SectionHead";
import { StageBadge } from "@/components/obsidian/StageBadge";
import { allModules, courseContent, type Module } from "./data";

const MINT = "#3DDC97";

function ModuleCard({ m, color, capstone }: { m: Module; color: string; capstone: boolean }) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-3.5 rounded-3xl p-[26px] ${capstone ? "" : "glass"}`}
      style={
        capstone
          ? {
              border: "1px solid rgba(61,220,151,0.45)",
              background: "linear-gradient(135deg, rgba(61,220,151,0.09), rgba(255,255,255,0.02))",
              boxShadow: "0 0 60px rgba(61,220,151,0.10), inset 0 1px 0 rgba(255,255,255,0.08)",
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        <StageBadge color={color}>{m.number}</StageBadge>
        {m.minutes === null ? (
          <Pill>Start here</Pill>
        ) : (
          <Pill>
            <Icon name="clock" size={13} color="#A9AEBA" />
            {m.minutes}m
          </Pill>
        )}
      </div>
      <h3 className="m-0 text-[23px] font-medium leading-[1.2] tracking-[-0.02em]">{m.title}</h3>
      <p className="m-0 text-[15.5px] leading-[1.6] text-mist">{m.summary}</p>
      {capstone && (
        <ul className="m-0 mt-1 flex list-none flex-wrap gap-2 p-0">
          {courseContent.capstoneRubric.map((r) => (
            <li
              key={r}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(61,220,151,0.30)] bg-[rgba(61,220,151,0.08)] px-[13px] py-[7px] text-[13.5px] text-mint-text"
            >
              <Icon name="check" size={14} color="#7FF0BD" strokeWidth={2.2} />
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Curriculum() {
  const lastNumber = allModules[allModules.length - 1].number;
  return (
    <section id="curriculum" className="relative overflow-hidden bg-void">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[500px] left-1/2 -ml-[550px] h-[900px] w-[1100px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(61,220,151,0.10), rgba(5,6,10,0) 62%)" }}
      />
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-[72px] px-5 py-24 lg:px-20">
        <SectionHead
          eyebrow="Full curriculum"
          title={`${allModules.length} modules, in order.`}
          intro="Orientation first, then four stages that each build on the last, ending in a capstone graded against a rubric, not vibes."
        />
        <div className="relative flex flex-col gap-9">
          <div
            aria-hidden
            className="absolute bottom-[60px] left-1 top-[22px] hidden w-px lg:block"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(61,220,151,0.5))" }}
          />
          {courseContent.stages.map((stage) => (
            <div key={stage.label} className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
              <div className="flex flex-col gap-2.5 lg:pt-2.5">
                <span className="inline-flex items-center gap-2.5 font-mono text-[13px] uppercase tracking-[0.14em] text-mist">
                  <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: stage.color }} />
                  {stage.label}
                </span>
                {stage.name && <span className="text-[20px] font-medium tracking-[-0.01em]">{stage.name}</span>}
              </div>
              <div className="flex flex-col gap-4 md:flex-row">
                {stage.modules.map((m) => (
                  <ModuleCard
                    key={m.number}
                    m={m}
                    color={m.number === lastNumber ? MINT : stage.color}
                    capstone={m.number === lastNumber}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
