import { FinalHeader } from "@/components/learn/final/FinalHeader";
import { OutreachStudio } from "@/components/learn/final/OutreachStudio";
import { LEARN_BASE } from "@/components/learn/nav";
import { Icon } from "@/components/obsidian/Icon";
import { getFinalModule } from "@/lib/aie/final-module";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function OutreachPage({ searchParams }: { searchParams: Promise<{ agent?: string }> }) {
  await requireEnrollment("ai-engineering", `${LEARN_BASE}/final/outreach`);
  const [{ agent }, mod] = await Promise.all([searchParams, getFinalModule()]);

  return (
    <>
      <FinalHeader title="Outreach" lede="How to find the right clients, what to send them, and the rules that keep your email legal and out of spam." />

      <section aria-labelledby="find-h" className="flex flex-col gap-3">
        <h2 id="find-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">How to find clients</h2>
        <ol className="glass m-0 flex list-none flex-col gap-1 rounded-3xl p-2.5">
          {mod.findClients.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-[14px] px-4 py-3.5">
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-white/[0.18] font-mono text-[12px] text-mist">{i + 1}</span>
              <div className="flex flex-col gap-1">
                <b className="text-[16px] font-medium">{s.title}</b>
                <span className="text-[14.5px] leading-[1.6] text-mist">{s.detail}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="maps-h" className="flex flex-col gap-3">
        <h2 id="maps-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">Lead maps</h2>
        <div className="flex flex-col gap-3">
          {mod.agents.map((a) => (
            <div key={a.id} className="glass flex flex-col gap-3 rounded-[20px] p-5">
              <b className="text-[17px] font-medium">{a.name}</b>
              <div className="grid gap-3 lg:grid-cols-3">
                {a.cities.map((g) => (
                  <div key={g.region} className="glass-row flex flex-col gap-1.5 rounded-2xl p-4">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">{g.region}</span>
                    <span className="text-[15px] text-frost">{g.cities.join(", ")}</span>
                    <span className="text-[13.5px] leading-[1.5] text-mist">{g.why}</span>
                  </div>
                ))}
              </div>
              <p className="m-0 text-[13.5px] text-mist">Best niches: {a.niches.map((n) => n.name).join("; ")}.</p>
            </div>
          ))}
        </div>
        <p className="m-0 text-[13px] leading-[1.5] text-dim">
          These are starting hypotheses, not market data. Search each city yourself before you commit to it.
        </p>
      </section>

      <section aria-labelledby="tpl-h" className="flex flex-col gap-3">
        <h2 id="tpl-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">Cold email templates</h2>
        <OutreachStudio
          initialAgent={agent}
          agents={mod.agents.map((a) => ({ id: a.id, name: a.name, subjectOptions: a.email.subjectOptions, body: a.email.body, followUp: a.email.followUp }))}
        />
      </section>

      <section aria-labelledby="rules-h" className="flex flex-col gap-3">
        <h2 id="rules-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">The rules</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {mod.compliance.map((c) => (
            <div key={c.region} className="glass flex flex-col gap-2 rounded-[20px] p-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">{c.region}</span>
              <p className="m-0 text-[14.5px] leading-[1.65] text-soft">{c.rule}</p>
              <a href={c.source} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-[14px] text-cyan-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-cyan">
                Read the source
                <Icon name="external" size={13} />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          ))}
        </div>
        <p className="m-0 text-[13px] leading-[1.5] text-dim">This is a summary of the regulators&apos; own guidance, not legal advice. Check the rules that apply where you and your recipients are.</p>
      </section>
    </>
  );
}
