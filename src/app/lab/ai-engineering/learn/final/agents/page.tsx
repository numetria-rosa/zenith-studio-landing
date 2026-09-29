import Link from "next/link";
import { Button } from "@/components/obsidian/Button";
import { Icon } from "@/components/obsidian/Icon";
import { FinalHeader } from "@/components/learn/final/FinalHeader";
import { LEARN_BASE } from "@/components/learn/nav";
import { listClients } from "@/lib/aie/clients";
import { flattenFiles, getFinalModule, getModelRegistry, kitTree } from "@/lib/aie/final-module";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function AgentsPage() {
  const { userId } = await requireEnrollment("ai-engineering", `${LEARN_BASE}/final/agents`);
  const [mod, registry, tree, clients] = await Promise.all([getFinalModule(), getModelRegistry(), kitTree(), listClients(userId)]);
  const liveAgents = new Set(clients.filter((c) => c.status === "live").map((c) => c.agentId));
  const fileCount = flattenFiles(tree).length;

  return (
    <>
      <FinalHeader
        title={mod.headline}
        lede={mod.lede}
        actions={
          <Button href={`${LEARN_BASE}/final/kit.zip`} size="md">
            <Icon name="download" size={16} color="#05060A" />
            Download the code kit
          </Button>
        }
      />

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {mod.agents.map((agent) => {
          const plan = registry.agents[agent.modelKey]!;
          const model = registry.models[plan.primary]!;
          const live = liveAgents.has(agent.id);
          return (
            <li
              key={agent.id}
              className="glass grid items-center gap-5 rounded-[22px] p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]"
              style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)` }}
            >
              <div className="flex items-start gap-4">
                <span
                  className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[14px] border bg-white/[0.05]"
                  style={{ borderColor: `${agent.color}66` }}
                >
                  <Icon name={agent.icon} size={22} color={agent.color} />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="m-0 text-[20px] font-medium tracking-[-0.02em]">{agent.name}</h2>
                  <p className="m-0 text-[14.5px] leading-[1.5] text-mist">{agent.tagline}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Best model</span>
                <span className="text-[15px] text-soft">{model.label}</span>
                <span className="font-mono text-[12px] text-mist">
                  ${model.price_in} in, ${model.price_out} out per 1M tokens
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(61,220,151,0.30)] bg-[rgba(61,220,151,0.08)] px-3 py-1.5 font-mono text-[12px] text-mint-text">
                  <Icon name="check" size={13} color="#7FF0BD" strokeWidth={2.2} />
                  {agent.evals.length} tested behaviours
                </span>
                {live && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-[rgba(92,200,255,0.10)] px-3 py-1.5 font-mono text-[12px] text-cyan-text">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                    Live for a client
                  </span>
                )}
                <Link
                  href={`${LEARN_BASE}/final/agents/${agent.id}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-frost px-5 text-[15px] font-medium text-void no-underline hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
                >
                  Open
                  <Icon name="arrow" size={16} color="#05060A" strokeWidth={2} />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="glass flex flex-col gap-3 rounded-[22px] p-6" aria-labelledby="kit-heading">
        <h2 id="kit-heading" className="m-0 text-[22px] font-medium tracking-[-0.02em]">
          One kit, {fileCount} files
        </h2>
        <p className="m-0 max-w-[760px] text-[15px] leading-[1.6] text-mist">
          Every agent shares one core: a model interface, retrieval, pre-send guardrails, webhook safety and an eval harness. A new client is a
          JSON file and a knowledge-base folder, not a code change. Model prices were verified against the providers&apos; docs on{" "}
          {mod.modelPricingVerified}; re-check them before you quote a client.
        </p>
      </section>
    </>
  );
}
