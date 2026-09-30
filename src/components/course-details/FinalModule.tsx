import { Eyebrow } from "@/components/obsidian/Eyebrow";
import { Icon } from "@/components/obsidian/Icon";
import { getFinalModule } from "@/lib/aie/final-module";

const INCLUDED = [
  "Organized Python code for all 5 agents, with tests",
  "The best model for each agent, with verified prices",
  "Niches and cities to sell each one to",
  "Cold email templates and the rules to follow",
  "A client guide and tracker, a revenue guide and calculator, and a 30-day sell plan",
];

/** Stand-in text for the blurred preview. Deliberately not the real content. */
const LOCKED = [
  { label: "Best model", lines: ["Model name and version", "$0.00 in, $0.00 out per 1M tokens", "Why this model fits this agent best"] },
  { label: "Best niches", lines: ["First niche to approach", "Second niche to approach", "Third niche to approach", "Best cities: Place, ST, Place, ST, Place"] },
  { label: "Cold email, ready to send", lines: ["Example subject line for this agent", "Plus a follow-up, a legal footer and the starting price to test"] },
];

/** Teaser for the Final module: the five agents are named, everything else is blurred until the student enrols. */
export async function FinalModule() {
  const mod = await getFinalModule();

  return (
    <section id="final-module" className="relative overflow-hidden bg-void">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_20%,#000_80%,transparent)]">
        <div
          className="pointer-events-none absolute -left-[200px] -top-[260px] h-[900px] w-[900px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.22), rgba(5,6,10,0) 62%)" }}
        />
        </div>
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-14 px-5 py-24 lg:px-12 xl:px-20">
        <div className="flex flex-col gap-6">
          <Eyebrow className="text-violet-text">The final module</Eyebrow>
          <h2 className="m-0 max-w-[1000px] text-[40px] font-medium leading-[1.02] tracking-[-0.045em] sm:text-[60px]">
            Finish the course with 5 AI agents you can start{" "}
            <span className="bg-[linear-gradient(100deg,#C7B0FF,#E2D6FF)] bg-clip-text text-transparent">selling.</span>
          </h2>
          <p className="m-0 max-w-[640px] text-[18px] leading-[1.6] text-mist">{mod.lede}</p>
          <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
            {INCLUDED.map((t) => (
              <li key={t} className="glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[14.5px] text-soft">
                <Icon name="check" size={14} color="#C7B0FF" strokeWidth={2.2} />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {mod.agents.map((agent) => (
            <li key={agent.id} className="glass grid gap-6 rounded-3xl p-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
              <div className="flex items-start gap-4">
                <span className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[14px] border bg-white/[0.05]" style={{ borderColor: `${agent.color}66` }}>
                  <Icon name={agent.icon} size={22} color={agent.color} />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="m-0 text-[22px] font-medium tracking-[-0.02em]">{agent.name}</h3>
                  <p className="m-0 text-[14.5px] leading-[1.55] text-mist">{agent.tagline}</p>
                </div>
              </div>

              {/* The details are placeholder text, blurred: the real content is only inside the course. */}
              <div className="relative overflow-hidden rounded-2xl">
                <div aria-hidden className="pointer-events-none grid select-none gap-5 blur-[7px] md:grid-cols-3">
                  {LOCKED.map((col) => (
                    <div key={col.label} className="flex flex-col gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">{col.label}</span>
                      {col.lines.map((l) => (
                        <span key={l} className="text-[14.5px] leading-[1.5] text-soft">{l}</span>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-void/30">
                  <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] text-frost">
                    <Icon name="lock" size={14} color="#C7B0FF" />
                    Model, niches, cities and emails unlock inside the course
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="m-0 max-w-[820px] text-[13.5px] leading-[1.6] text-dim">
          Starting prices and niche lists inside the course are suggestions to test and research, not promises of income.
        </p>
      </div>
    </section>
  );
}
