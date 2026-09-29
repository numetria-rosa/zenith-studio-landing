import { FinalHeader } from "@/components/learn/final/FinalHeader";
import { RevenueCalculator, type CalcAgent } from "@/components/learn/final/RevenueCalculator";
import { LEARN_BASE } from "@/components/learn/nav";
import { listClients, summarise } from "@/lib/aie/clients";
import { getFinalModule, getModelRegistry } from "@/lib/aie/final-module";
import { requireEnrollment } from "@/lib/require-enrollment";

const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default async function RevenuePage() {
  const { userId } = await requireEnrollment("ai-engineering", `${LEARN_BASE}/final/revenue`);
  const [mod, registry, clients] = await Promise.all([getFinalModule(), getModelRegistry(), listClients(userId)]);
  const totals = summarise(clients);

  const calcAgents: CalcAgent[] = mod.agents.map((a) => {
    const plan = registry.agents[a.modelKey]!;
    return {
      id: a.id,
      name: a.name,
      monthlyUsd: a.pricing.monthlyUsd,
      tiers: (["primary", "budget", "escalation"] as const)
        .filter((k, i, arr) => arr.findIndex((x) => plan[x] === plan[k]) === i)
        .map((k) => {
          const m = registry.models[plan[k]]!;
          return { label: { primary: "Recommended", budget: "Budget", escalation: "Escalation" }[k], model: m.label, priceIn: m.price_in, priceOut: m.price_out };
        }),
    };
  });

  const perAgent = mod.agents
    .map((a) => {
      const mine = clients.filter((c) => c.agentId === a.id && c.status === "live");
      return { name: a.name, count: mine.length, mrr: mine.reduce((n, c) => n + c.monthlyFeeCents, 0) };
    })
    .filter((r) => r.count > 0);

  return (
    <>
      <FinalHeader title="Revenue" lede="What your live clients pay you every month, and a calculator for what a new client is worth after model costs." />

      <section aria-labelledby="live-h" className="flex flex-col gap-3">
        <h2 id="live-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">From your clients</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Monthly revenue, live", value: usd(totals.liveMrrCents) },
            { label: "Yearly at this rate", value: usd(totals.liveMrrCents * 12) },
            { label: "In the pipeline, monthly", value: usd(totals.pipelineMrrCents) },
            { label: "Setup fees collected", value: usd(totals.liveSetupCents) },
          ].map((s) => (
            <div key={s.label} className="glass flex flex-col gap-1.5 rounded-[18px] p-4">
              <b className="text-[28px] font-medium tracking-[-0.03em]">{s.value}</b>
              <span className="text-[13.5px] text-mist">{s.label}</span>
            </div>
          ))}
        </div>
        {perAgent.length > 0 ? (
          <ul className="glass m-0 flex list-none flex-col gap-1 rounded-[20px] p-2.5">
            {perAgent.map((r) => (
              <li key={r.name} className="flex items-center justify-between rounded-[14px] px-4 py-3 text-[15px]">
                <span>{r.name} <span className="text-mist">({r.count} live)</span></span>
                <span className="font-mono text-[13px] text-soft">{usd(r.mrr)}/mo</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-[14.5px] text-mist">Nothing live yet. Mark a client as Live on the Clients page and it appears here.</p>
        )}
      </section>

      <section aria-labelledby="calc-h" className="flex flex-col gap-3">
        <h2 id="calc-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">What is a client worth?</h2>
        <RevenueCalculator agents={calcAgents} />
      </section>
    </>
  );
}
