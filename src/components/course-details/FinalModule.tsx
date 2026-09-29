import { Eyebrow } from "@/components/obsidian/Eyebrow";
import { Icon } from "@/components/obsidian/Icon";
import { getFinalModule, getModelRegistry } from "@/lib/aie/final-module";
import { fillTemplate } from "@/lib/aie/outreach";

const INCLUDED = [
  "Organized Python code for all 5 agents, with tests",
  "The best model for each agent, with verified prices",
  "Niches and cities to sell each one to",
  "Cold email templates and the rules to follow",
  "Client tracker, revenue calculator and a 30-day sell plan",
];

/** Marketing showcase of the Final module: the agents, best model per agent, niches, cities and the cold email for each. */
export async function FinalModule() {
  const [mod, registry] = await Promise.all([getFinalModule(), getModelRegistry()]);

  return (
    <section id="final-module" className="relative overflow-hidden bg-void">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[200px] -top-[260px] h-[900px] w-[900px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.22), rgba(5,6,10,0) 62%)" }}
      />
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
          {mod.agents.map((agent) => {
            const plan = registry.agents[agent.modelKey]!;
            const model = registry.models[plan.primary]!;
            return (
              <li key={agent.id} className="glass grid gap-6 rounded-3xl p-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
                <div className="flex items-start gap-4">
                  <span className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[14px] border bg-white/[0.05]" style={{ borderColor: `${agent.color}66` }}>
                    <Icon name={agent.icon} size={22} color={agent.color} />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="m-0 text-[22px] font-medium tracking-[-0.02em]">{agent.name}</h3>
                    <p className="m-0 text-[14.5px] leading-[1.55] text-mist">{agent.tagline}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Best model</span>
                  <b className="text-[17px] font-medium">{model.label}</b>
                  <span className="font-mono text-[12px] text-mist">
                    ${model.price_in} in, ${model.price_out} out per 1M tokens
                  </span>
                  <p className="m-0 text-[13.5px] leading-[1.55] text-mist">{plan.why}</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Best niches</span>
                    <ul className="m-0 flex list-none flex-col gap-1 p-0">
                      {agent.niches.map((n) => (
                        <li key={n.name} className="text-[14.5px] text-soft">{n.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Best cities</span>
                    <p className="m-0 text-[14.5px] leading-[1.5] text-soft">
                      {agent.cities.flatMap((g) => g.cities).slice(0, 6).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Cold email, ready to send</span>
                  <p className="m-0 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3 text-[14px] leading-[1.55] text-soft">
                    <span className="text-dim">Example subject: </span>
                    {fillTemplate(agent.email.subjectOptions[0]!, { business: "Sunrise Dental", first_name: "Sam" })}
                  </p>
                  <p className="m-0 text-[13.5px] leading-[1.55] text-mist">
                    Plus a follow-up, a legal footer, and the starting price to test: ${agent.pricing.setupUsd} setup, ${agent.pricing.monthlyUsd} a month.
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="m-0 max-w-[820px] text-[13.5px] leading-[1.6] text-dim">
          Model prices were checked against Anthropic and Groq documentation on {registry.verified}. Niche and city lists are starting points to research, not market data.
          Starting prices are suggestions to test, not promises of income.
        </p>
      </div>
    </section>
  );
}
