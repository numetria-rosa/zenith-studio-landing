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

  return (
    <>
      <FinalHeader title="Your clients" lede="Every client you are talking to or serving, which agent they get, and what they pay. Revenue is worked out from this list." />

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
        <h2 id="list-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">Client list</h2>
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
