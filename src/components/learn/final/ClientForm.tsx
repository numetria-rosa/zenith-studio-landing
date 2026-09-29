"use client";

import { useActionState } from "react";
import { Icon } from "@/components/obsidian/Icon";
import { addClientAction, type FormState } from "@/app/lab/ai-engineering/learn/final/actions";
import type { Agent } from "@/lib/aie/final-module";

const FIELD =
  "min-h-11 w-full rounded-xl border border-white/[0.14] bg-white/[0.04] px-3.5 text-[15px] text-frost placeholder:text-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";

function Label({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
      {children}
    </label>
  );
}

/** Add-a-client form. Choices are selects; only the client's name, amounts, notes and an 'Other' niche or city are typed. */
export function ClientForm({ agents }: { agents: Agent[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addClientAction, undefined);
  const cityGroups = new Map<string, Set<string>>();
  for (const a of agents) for (const g of a.cities) {
    const set = cityGroups.get(g.region) ?? new Set<string>();
    g.cities.forEach((c) => set.add(c));
    cityGroups.set(g.region, set);
  }

  return (
    <form action={action} className="glass grid gap-4 rounded-[22px] p-6 md:grid-cols-2 lg:grid-cols-3">
      <div>
        <Label id="c-name">Client name</Label>
        <input id="c-name" name="name" required maxLength={120} className={FIELD} autoComplete="off" />
      </div>
      <div>
        <Label id="c-agent">Agent</Label>
        <select id="c-agent" name="agentId" required className={FIELD} defaultValue={agents[0]?.id}>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label id="c-status">Status</Label>
        <select id="c-status" name="status" className={FIELD} defaultValue="draft">
          <option value="draft">Draft (talking)</option>
          <option value="ready">Ready (agreed, not live)</option>
          <option value="live">Live (paying)</option>
        </select>
      </div>
      <div>
        <Label id="c-niche">Niche</Label>
        <select id="c-niche" name="niche" required className={FIELD} defaultValue="">
          <option value="" disabled>Choose a niche</option>
          {agents.map((a) => (
            <optgroup key={a.id} label={a.name}>
              {a.niches.map((n) => (
                <option key={`${a.id}-${n.name}`} value={n.name}>{n.name}</option>
              ))}
            </optgroup>
          ))}
          <option value="__other">Other (type it below)</option>
        </select>
        <input name="nicheOther" aria-label="Niche, if Other" placeholder="If other: niche" maxLength={80} className={`${FIELD} mt-2`} />
      </div>
      <div>
        <Label id="c-city">City</Label>
        <select id="c-city" name="city" required className={FIELD} defaultValue="">
          <option value="" disabled>Choose a city</option>
          {[...cityGroups].map(([region, cities]) => (
            <optgroup key={region} label={region}>
              {[...cities].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
          ))}
          <option value="__other">Other (type it below)</option>
        </select>
        <input name="cityOther" aria-label="City, if Other" placeholder="If other: city" maxLength={80} className={`${FIELD} mt-2`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label id="c-setup">Setup fee ($)</Label>
          <input id="c-setup" name="setupFee" type="number" min={0} max={1000000} step="1" inputMode="decimal" defaultValue={0} className={FIELD} />
        </div>
        <div>
          <Label id="c-monthly">Monthly ($)</Label>
          <input id="c-monthly" name="monthlyFee" type="number" min={0} max={1000000} step="1" inputMode="decimal" defaultValue={0} className={FIELD} />
        </div>
      </div>
      <div className="md:col-span-2 lg:col-span-3">
        <Label id="c-notes">Notes</Label>
        <input id="c-notes" name="notes" maxLength={500} className={FIELD} placeholder="What was agreed, when to follow up" />
      </div>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2 lg:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-frost px-[22px] text-[15px] font-medium text-void hover:bg-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
        >
          <Icon name="plus" size={16} color="#05060A" strokeWidth={2} />
          {pending ? "Adding" : "Add client"}
        </button>
        {state?.error && (
          <p role="alert" className="m-0 flex items-center gap-2 text-[14.5px] text-ember-text">
            <Icon name="close" size={15} color="#FF9BB0" strokeWidth={2.2} />
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
