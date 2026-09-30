import { FinalHeader } from "@/components/learn/final/FinalHeader";
import { ClientForm } from "@/components/learn/final/ClientForm";
import { LEARN_BASE } from "@/components/learn/nav";
import { Icon } from "@/components/obsidian/Icon";
import { CLIENT_STATUSES, listClients, summarise } from "@/lib/aie/clients";
import { getFinalModule } from "@/lib/aie/final-module";
import { requireEnrollment } from "@/lib/require-enrollment";
import { deleteClientAction, setClientStatusAction } from "../actions";

const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const STATUS_LABEL = { draft: "Draft", ready: "Ready", live: "Live" } as const;

export default async function ClientsPage() {
  const { userId } = await requireEnrollment("ai-engineering", `${LEARN_BASE}/final/clients`);
  const [mod, clients] = await Promise.all([getFinalModule(), listClients(userId)]);
  const agentName = Object.fromEntries(mod.agents.map((a) => [a.id, a.name]));
  const totals = summarise(clients);
  const g = mod.clientsGuide;
  const ex = g.example;
  const exAgent = mod.agents.find((a) => a.id === ex.agentId) ?? mod.agents[0]!;

  return (
    <>
      <FinalHeader title="Your clients" lede="How to run a client from first conversation to Live, and the list that tracks every one. Revenue is worked out from this list." />

      <section aria-labelledby="how-h" className="flex flex-col gap-4">
        <h2 id="how-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">How client work runs</h2>
        <p className="m-0 max-w-[760px] text-[16px] leading-[1.65] text-soft">{g.intro}</p>
        <ol className="glass m-0 flex list-none flex-col gap-1 rounded-3xl p-2.5">
          {g.steps.map((s, i) => (
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

      <section aria-labelledby="states-h" className="flex flex-col gap-3">
        <h2 id="states-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">What Draft, Ready and Live mean</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {g.statuses.map((st) => (
            <div key={st.key} className="glass flex flex-col gap-2 rounded-[20px] p-5">
              <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-cyan">{st.key}</span>
              <span className="text-[15px] leading-[1.55] text-frost">{st.meaning}</span>
              <span className="text-[13.5px] leading-[1.55] text-mist">{st.move}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="demo-h" className="flex flex-col gap-3">
        <h2 id="demo-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">Worked example</h2>
        <div className="glass flex flex-col gap-4 rounded-[22px] p-6">
          <div className="grid items-center gap-3 rounded-[18px] border border-white/[0.1] bg-white/[0.03] p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
            <div className="flex min-w-0 flex-col gap-0.5">
              <b className="text-[16px] font-medium">{ex.business}</b>
              <span className="text-[13.5px] text-mist">{ex.niche} · {ex.city}</span>
              <span className="text-[13px] text-dim">{ex.notes}</span>
            </div>
            <span className="text-[14.5px] text-soft">{exAgent.name}</span>
            <span className="font-mono text-[12.5px] text-mist">{usd(exAgent.pricing.monthlyUsd * 100)}/mo · {usd(exAgent.pricing.setupUsd * 100)} setup</span>
          </div>
          <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-[15px] leading-[1.6] text-soft">
            {ex.steps.map((t) => <li key={t}>{t}</li>)}
          </ol>
          <p className="m-0 text-[14px] leading-[1.6] text-mist">
            Once it is Live, this one client adds {usd(exAgent.pricing.monthlyUsd * 100)} a month to your revenue and {usd(exAgent.pricing.setupUsd * 100)} in setup fees. {exAgent.pricing.note}
          </p>
          <p className="m-0 text-[13px] text-dim">A made-up business, only to show the flow. Fees are the starting prices for this agent.</p>
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Live clients", value: String(totals.liveCount) },
          { label: "Live monthly revenue", value: usd(totals.liveMrrCents) },
          { label: "In the pipeline, monthly", value: usd(totals.pipelineMrrCents) },
          { label: "Setup fees from live clients", value: usd(totals.liveSetupCents) },
        ].map((s) => (
          <div key={s.label} className="glass flex flex-col gap-1.5 rounded-[18px] p-4">
            <b className="text-[28px] font-medium tracking-[-0.03em]">{s.value}</b>
            <span className="text-[13.5px] text-mist">{s.label}</span>
          </div>
        ))}
      </div>

      <section aria-labelledby="list-h" className="flex flex-col gap-3">
        <h2 id="list-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">Your client list</h2>
        {clients.length === 0 ? (
          <p className="glass m-0 rounded-[20px] p-6 text-[15px] text-mist">No clients yet. Add the first one below, even if it is only a conversation you are having.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {clients.map((c) => (
              <li key={c.id} className="glass grid items-center gap-3 rounded-[18px] p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_auto_auto]">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <b className="truncate text-[16px] font-medium">{c.name}</b>
                  <span className="truncate text-[13.5px] text-mist">{c.niche} · {c.city}</span>
                  {c.notes && <span className="truncate text-[13px] text-dim">{c.notes}</span>}
                </div>
                <span className="text-[14.5px] text-soft">{agentName[c.agentId] ?? c.agentId}</span>
                <span className="font-mono text-[12.5px] text-mist">{usd(c.monthlyFeeCents)}/mo · {usd(c.setupFeeCents)} setup</span>
                <form action={setClientStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <label className="sr-only" htmlFor={`s-${c.id}`}>Status for {c.name}</label>
                  <select
                    id={`s-${c.id}`}
                    name="status"
                    defaultValue={c.status}
                    className="min-h-11 rounded-xl border border-white/[0.14] bg-white/[0.04] px-3 text-[14.5px] text-frost focus-visible:outline-2 focus-visible:outline-cyan"
                  >
                    {CLIENT_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                  <button type="submit" className="glass min-h-11 rounded-full px-4 text-[14px] text-frost focus-visible:outline-2 focus-visible:outline-cyan">Save</button>
                </form>
                <form action={deleteClientAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" aria-label={`Delete ${c.name}`} className="flex h-11 w-11 items-center justify-center rounded-full text-mist hover:text-ember-text focus-visible:outline-2 focus-visible:outline-cyan">
                    <Icon name="trash" size={17} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="add-h" className="flex flex-col gap-3">
        <h2 id="add-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">Add a client</h2>
        <ClientForm agents={mod.agents} />
      </section>
    </>
  );
}
