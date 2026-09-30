import { Icon } from "@/components/obsidian/Icon";
import { FinalHeader } from "@/components/learn/final/FinalHeader";
import { RevenueCalculator, type CalcAgent } from "@/components/learn/final/RevenueCalculator";
import { LEARN_BASE } from "@/components/learn/nav";
import { clientEconomics, EXAMPLE } from "@/lib/aie/economics";
import { listClients, summarise } from "@/lib/aie/clients";
import { getFinalModule, getModelRegistry } from "@/lib/aie/final-module";
import { requireEnrollment } from "@/lib/require-enrollment";

const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default async function RevenuePage() {
  const { userId } = await requireEnrollment("ai-engineering", `${LEARN_BASE}/final/revenue`);
  const [mod, registry, clients] = await Promise.all([getFinalModule(), getModelRegistry(), listClients(userId)]);
  const totals = summarise(clients);
  const g = mod.revenueGuide;
  const exAgent = mod.agents.find((a) => a.id === "support-agent") ?? mod.agents[0]!;
  const exPlan = registry.agents[exAgent.modelKey]!;
  const exModel = registry.models[exPlan.primary]!;
  const eco = clientEconomics(exModel, exAgent.pricing.monthlyUsd);
  const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: n < 0.1 ? 4 : 2 });

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
      <FinalHeader title="Revenue" lede="How the money works, a worked example, what your live clients pay you every month, and a calculator for what a new client is worth after model costs." />

      <section aria-labelledby="how-h" className="flex flex-col gap-4">
        <h2 id="how-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">How the money works</h2>
        <p className="m-0 max-w-[760px] text-[16px] leading-[1.65] text-soft">{g.intro}</p>
        <dl className="m-0 grid gap-3 md:grid-cols-2">
          {g.terms.map((t) => (
            <div key={t.term} className="glass flex flex-col gap-1.5 rounded-[18px] p-5">
              <dt className="font-mono text-[12px] uppercase tracking-[0.14em] text-cyan">{t.term}</dt>
              <dd className="m-0 text-[15px] leading-[1.6] text-soft">{t.meaning}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="demo-h" className="flex flex-col gap-3">
        <h2 id="demo-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">Worked example</h2>
        <div className="glass flex flex-col gap-4 rounded-[22px] p-6">
          <p className="m-0 text-[15px] leading-[1.65] text-soft">
            Take {EXAMPLE.clients} clients on the {exAgent.name}, each paying {money(exAgent.pricing.monthlyUsd)} a month. Each client gets about {EXAMPLE.replies.toLocaleString("en-US")} replies a month,
            and each reply uses about {EXAMPLE.inputTokens.toLocaleString("en-US")} input and {EXAMPLE.outputTokens} output tokens on {exModel.label}.
          </p>
          <ol className="m-0 flex list-none flex-col gap-2 p-0 text-[15px]">
            {[
              ["One reply costs", `(${EXAMPLE.inputTokens} x $${exModel.price_in} + ${EXAMPLE.outputTokens} x $${exModel.price_out}) / 1,000,000 = ${money(eco.perReplyUsd)}`],
              ["Model cost per client", `${money(eco.perReplyUsd)} x ${EXAMPLE.replies.toLocaleString("en-US")} replies = ${money(eco.modelPerClientUsd)}`],
              ["All costs per client", `${money(eco.modelPerClientUsd)} model + ${money(EXAMPLE.hostingUsd)} hosting and tools = ${money(eco.costPerClientUsd)}`],
              ["Revenue", `${EXAMPLE.clients} x ${money(exAgent.pricing.monthlyUsd)} = ${money(eco.revenueUsd)} a month`],
              ["Profit", `${money(eco.revenueUsd)} - ${money(eco.costUsd)} = ${money(eco.profitUsd)} a month (${Math.round(eco.margin * 100)}% margin)`],
            ].map(([label, math], i) => (
              <li key={label} className="glass-row flex flex-col gap-1 rounded-2xl px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <span><span className="mr-2 font-mono text-[12px] text-dim">{i + 1}</span>{label}</span>
                <span className="font-mono text-[13px] text-mist">{math}</span>
              </li>
            ))}
          </ol>
          <p className="m-0 text-[13px] leading-[1.55] text-dim">
            Model prices come from the kit&apos;s registry (checked {registry.verified}). The reply and token counts are assumptions for this example: change them in the calculator below to match a real client.
          </p>
        </div>
      </section>

      <section aria-labelledby="tips-h" className="flex flex-col gap-3">
        <h2 id="tips-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">Tips</h2>
        <ul className="glass m-0 flex list-none flex-col gap-1 rounded-3xl p-2.5">
          {g.tips.map((t) => (
            <li key={t} className="flex gap-3 rounded-[14px] px-4 py-3 text-[15px] leading-[1.6] text-soft"><Icon name="check" size={16} color="#7FF0BD" /><span>{t}</span></li>
          ))}
        </ul>
      </section>

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
