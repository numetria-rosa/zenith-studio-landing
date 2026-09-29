"use client";

import { useState } from "react";

export type CalcAgent = {
  id: string;
  name: string;
  monthlyUsd: number;
  tiers: { label: string; model: string; priceIn: number; priceOut: number }[];
};

const FIELD =
  "min-h-11 w-full rounded-xl border border-white/[0.14] bg-white/[0.04] px-3.5 text-[15px] text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n < 10 ? 2 : 0 });

/** Monthly revenue against model cost for N clients on one agent. Prices per million tokens come from the kit's model registry. */
export function RevenueCalculator({ agents }: { agents: CalcAgent[] }) {
  const [agentId, setAgentId] = useState(agents[0]!.id);
  const agent = agents.find((a) => a.id === agentId)!;
  const [tier, setTier] = useState(0);
  const [clients, setClients] = useState(3);
  const [fee, setFee] = useState<number | null>(null);
  const [replies, setReplies] = useState(1000);
  const [inTok, setInTok] = useState(1500);
  const [outTok, setOutTok] = useState(200);
  const [hosting, setHosting] = useState(15);

  const monthly = fee ?? agent.monthlyUsd;
  const t = agent.tiers[Math.min(tier, agent.tiers.length - 1)]!;
  const out = (() => {
    const perReply = (inTok * t.priceIn + outTok * t.priceOut) / 1_000_000;
    const modelPerClient = perReply * replies;
    const costPerClient = modelPerClient + hosting;
    const revenue = clients * monthly;
    const cost = clients * costPerClient;
    return { perReply, modelPerClient, costPerClient, revenue, cost, profit: revenue - cost, margin: revenue > 0 ? (revenue - cost) / revenue : 0 };
  })();

  const num = (set: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => set(Math.max(0, Number(e.target.value) || 0));

  return (
    <div className="glass grid gap-6 rounded-[22px] p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label htmlFor="r-agent" className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Agent</label>
          <select id="r-agent" className={FIELD} value={agentId} onChange={(e) => { setAgentId(e.target.value); setFee(null); setTier(0); }}>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label htmlFor="r-model" className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Model</label>
          <select id="r-model" className={FIELD} value={tier} onChange={(e) => setTier(Number(e.target.value))}>
            {agent.tiers.map((x, i) => <option key={x.label} value={i}>{x.label}: {x.model}</option>)}
          </select>
        </div>
        {[
          { id: "r-clients", label: "Clients", value: clients, set: setClients },
          { id: "r-fee", label: "Monthly fee per client ($)", value: monthly, set: (n: number) => setFee(n) },
          { id: "r-replies", label: "Replies a month, per client", value: replies, set: setReplies },
          { id: "r-host", label: "Hosting and tools per client ($)", value: hosting, set: setHosting },
          { id: "r-in", label: "Input tokens per reply", value: inTok, set: setInTok },
          { id: "r-out", label: "Output tokens per reply", value: outTok, set: setOutTok },
        ].map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-dim">{f.label}</label>
            <input id={f.id} type="number" min={0} inputMode="decimal" className={FIELD} value={f.value} onChange={num(f.set)} />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3" aria-live="polite">
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-row rounded-2xl p-4"><span className="text-[13px] text-mist">Revenue a month</span><b className="mt-1 block text-[28px] font-medium tracking-[-0.03em]">{usd(out.revenue)}</b></div>
          <div className="glass-row rounded-2xl p-4"><span className="text-[13px] text-mist">Costs a month</span><b className="mt-1 block text-[28px] font-medium tracking-[-0.03em]">{usd(out.cost)}</b></div>
          <div className="glass-row rounded-2xl p-4"><span className="text-[13px] text-mist">Profit a month</span><b className="mt-1 block text-[28px] font-medium tracking-[-0.03em]" style={{ color: out.profit >= 0 ? "#7FF0BD" : "#FF9BB0" }}>{usd(out.profit)}</b></div>
          <div className="glass-row rounded-2xl p-4"><span className="text-[13px] text-mist">Margin</span><b className="mt-1 block text-[28px] font-medium tracking-[-0.03em]">{Math.round(out.margin * 100)}%</b></div>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-y-1.5 text-[14px]">
          <dt className="text-dim">One reply costs</dt><dd className="m-0 text-right text-soft">{usd(out.perReply)}</dd>
          <dt className="text-dim">Model cost per client</dt><dd className="m-0 text-right text-soft">{usd(out.modelPerClient)} a month</dd>
          <dt className="text-dim">All costs per client</dt><dd className="m-0 text-right text-soft">{usd(out.costPerClient)} a month</dd>
        </dl>
        <p className="m-0 text-[13px] leading-[1.55] text-dim">
          Reply cost = (input tokens x input price + output tokens x output price) / 1,000,000, using the per-million prices in the kit&apos;s model registry. It does not
          include what a WhatsApp client pays Meta on their own account, your own time, or tax. Your numbers, not a forecast.
        </p>
      </div>
    </div>
  );
}
