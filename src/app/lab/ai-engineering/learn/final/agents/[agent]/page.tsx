import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/obsidian/Button";
import { Icon } from "@/components/obsidian/Icon";
import { FinalHeader } from "@/components/learn/final/FinalHeader";
import { KitBrowser } from "@/components/learn/final/KitBrowser";
import { LEARN_BASE } from "@/components/learn/nav";
import {
  callCostUsd,
  flattenFiles,
  getAgent,
  getModelRegistry,
  kitTree,
  readKitFiles,
  type TreeNode,
} from "@/lib/aie/final-module";
import { requireEnrollment } from "@/lib/require-enrollment";

const SECTIONS = ["overview", "model", "code", "deploy", "sell"] as const;
// Example workload used for the cost column: one reply reads about 1,500 tokens of instructions and knowledge base and writes about 200.
const EXAMPLE = { input: 1500, output: 200 };

/** The folders to show for one agent: the shared core, that agent's folder, and the top-level README and app. */
function subtree(tree: TreeNode[], dir: string): TreeNode[] {
  const parts = dir.split("/");
  let level = tree;
  for (const part of parts) {
    const next = level.find((n) => n.name === part);
    if (!next) return [];
    level = next.children ?? [];
  }
  const agentNode: TreeNode = { name: parts[parts.length - 1]!, path: dir, kind: "dir", children: level };
  const agentsRoot: TreeNode = { name: parts[0]!, path: parts[0]!, kind: "dir", children: [agentNode] };
  const core = tree.find((n) => n.name === "core");
  return [...(core ? [core] : []), agentsRoot, ...tree.filter((n) => n.kind === "file" && ["README.md", "app.py"].includes(n.name))];
}

export default async function AgentPage({ params }: { params: Promise<{ agent: string }> }) {
  const { agent: agentId } = await params;
  await requireEnrollment("ai-engineering", `${LEARN_BASE}/final/agents/${agentId}`);
  const agent = await getAgent(agentId);
  if (!agent) notFound();

  const [registry, tree] = await Promise.all([getModelRegistry(), kitTree()]);
  const plan = registry.agents[agent.modelKey]!;
  const sub = subtree(tree, agent.kitDir);
  const files = await readKitFiles(flattenFiles(sub));
  const first = `${agent.kitDir}/agent.py`;
  const tiers = [
    { label: "Recommended", key: plan.primary },
    { label: "Budget", key: plan.budget },
    { label: "Escalation", key: plan.escalation },
  ];
  const outreachHref = `${LEARN_BASE}/final/outreach?agent=${agent.id}`;

  return (
    <>
      <FinalHeader
        eyebrow={`Final module · Agent`}
        title={agent.name}
        lede={agent.tagline}
        actions={
          <>
            <Button href={`${LEARN_BASE}/final/kit.zip`} size="md">
              <Icon name="download" size={16} color="#05060A" />
              Download the kit
            </Button>
            <Button href={outreachHref} variant="glass" size="md">
              Outreach template
            </Button>
          </>
        }
      />

      <nav aria-label="On this page" className="glass flex flex-wrap gap-0.5 self-start rounded-full p-[5px]">
        {SECTIONS.map((s) => (
          <a key={s} href={`#${s}`} className="inline-flex min-h-11 items-center rounded-full px-4 text-[14.5px] capitalize text-soft no-underline hover:text-frost focus-visible:outline-2 focus-visible:outline-cyan lg:min-h-10">
            {s}
          </a>
        ))}
      </nav>

      <section id="overview" className="flex flex-col gap-4" aria-labelledby="overview-h">
        <h2 id="overview-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">Overview</h2>
        <p className="m-0 max-w-[820px] text-[17px] leading-[1.7] text-soft">{agent.what}</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass flex flex-col gap-3 rounded-[20px] p-5">
            <h3 className="m-0 font-mono text-[12px] uppercase tracking-[0.14em] text-dim">Channels</h3>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {agent.channels.map((c) => (
                <li key={c} className="flex gap-2.5 text-[15px] text-soft">
                  <Icon name="check" size={16} color="#7FF0BD" strokeWidth={2.2} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass flex flex-col gap-3 rounded-[20px] p-5">
            <h3 className="m-0 font-mono text-[12px] uppercase tracking-[0.14em] text-dim">Built on these docs</h3>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {agent.integrations.map((i) => (
                <li key={i.docs} className="flex flex-col gap-0.5">
                  <a href={i.docs} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-cyan-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-cyan">
                    {i.name}
                    <Icon name="external" size={13} />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  <span className="text-[13.5px] leading-[1.5] text-mist">{i.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="model" className="flex flex-col gap-4" aria-labelledby="model-h">
        <h2 id="model-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">Which model to use</h2>
        <p className="m-0 max-w-[820px] text-[15.5px] leading-[1.65] text-mist">{plan.why}</p>
        <div className="grid gap-3 md:grid-cols-3">
          {tiers.map((t) => {
            const m = registry.models[t.key]!;
            return (
              <div key={t.label} className={`glass flex flex-col gap-2 rounded-[20px] p-5 ${t.label === "Recommended" ? "!border-cyan/40" : ""}`}>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">{t.label}</span>
                <b className="text-[18px] font-medium">{m.label}</b>
                <code className="w-fit rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[12.5px] text-soft">{m.id}</code>
                <dl className="m-0 grid grid-cols-2 gap-y-1 text-[13.5px]">
                  <dt className="text-dim">Input</dt><dd className="m-0 text-right text-soft">${m.price_in} / 1M tokens</dd>
                  <dt className="text-dim">Output</dt><dd className="m-0 text-right text-soft">${m.price_out} / 1M tokens</dd>
                  <dt className="text-dim">Context</dt><dd className="m-0 text-right text-soft">{m.context}</dd>
                  <dt className="text-dim">One reply*</dt>
                  <dd className="m-0 text-right text-soft">${callCostUsd(m, EXAMPLE.input, EXAMPLE.output).toFixed(4)}</dd>
                </dl>
                <p className="m-0 text-[13px] leading-[1.5] text-mist">{m.note}</p>
              </div>
            );
          })}
        </div>
        <p className="m-0 text-[13px] text-dim">
          *An example reply of {EXAMPLE.input.toLocaleString()} input and {EXAMPLE.output} output tokens. Prices verified against the providers&apos; docs on {registry.verified}; check them again before you quote a client. Change a client&apos;s model with one environment variable.
        </p>
      </section>

      <section id="code" className="flex flex-col gap-4" aria-labelledby="code-h">
        <h2 id="code-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">The code</h2>
        <p className="m-0 max-w-[820px] text-[15.5px] leading-[1.65] text-mist">
          This is the real folder for the agent, plus the shared <code className="font-mono text-[14px] text-soft">core/</code> it stands on. Read it top to bottom, run the tests, then change one thing.
        </p>
        <KitBrowser tree={sub} files={files} initial={first} />
      </section>

      <section id="deploy" className="flex flex-col gap-4" aria-labelledby="deploy-h">
        <h2 id="deploy-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">Deploy it for a client</h2>
        <ol className="glass m-0 flex list-none flex-col gap-1 rounded-3xl p-2.5">
          {agent.deploy.map((step, i) => (
            <li key={i} className="flex gap-4 rounded-[14px] px-4 py-3.5">
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-white/[0.18] font-mono text-[12px] text-mist">{i + 1}</span>
              <span className="text-[15.5px] leading-[1.6] text-soft">{step}</span>
            </li>
          ))}
        </ol>
        <details className="glass rounded-[20px] p-5">
          <summary className="cursor-pointer text-[15px] font-medium text-frost focus-visible:outline-2 focus-visible:outline-cyan">What the kit tests for this agent</summary>
          <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
            {agent.evals.map((e) => (
              <li key={e} className="flex gap-2.5 text-[14.5px] text-soft">
                <Icon name="check" size={15} color="#7FF0BD" strokeWidth={2.2} />
                {e}
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section id="sell" className="flex flex-col gap-5" aria-labelledby="sell-h">
        <h2 id="sell-h" className="m-0 text-[26px] font-medium tracking-[-0.02em]">Who to sell it to</h2>
        <div className="grid gap-3 lg:grid-cols-3">
          {agent.niches.map((n) => (
            <div key={n.name} className="glass flex flex-col gap-2 rounded-[20px] p-5">
              <b className="text-[17px] font-medium">{n.name}</b>
              <p className="m-0 text-[14px] leading-[1.55] text-mist">{n.why}</p>
              <p className="m-0 text-[14px] leading-[1.55] text-soft"><span className="text-dim">Pain: </span>{n.pain}</p>
              <p className="m-0 text-[14px] leading-[1.55] text-soft"><span className="text-dim">Offer: </span>{n.offer}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {agent.cities.map((g) => (
            <div key={g.region} className="glass flex flex-col gap-2 rounded-[20px] p-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">{g.region}</span>
              <p className="m-0 text-[15px] leading-[1.5] text-frost">{g.cities.join(", ")}</p>
              <p className="m-0 text-[13.5px] leading-[1.5] text-mist">{g.why}</p>
            </div>
          ))}
        </div>
        <p className="m-0 text-[13px] leading-[1.5] text-dim">
          Lead maps are starting hypotheses, not market data. Search each city yourself and check that its businesses fit before you write a single email.
        </p>
        <div className="glass flex flex-col gap-2 rounded-[20px] p-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Starting price to test</span>
          <p className="m-0 text-[22px] font-medium tracking-[-0.02em]">
            ${agent.pricing.setupUsd} setup, ${agent.pricing.monthlyUsd} a month
          </p>
          <p className="m-0 text-[14px] leading-[1.55] text-mist">{agent.pricing.note}</p>
          <Link href={outreachHref} className="mt-1 inline-flex min-h-11 w-fit items-center gap-2 text-[15px] font-medium text-cyan-text no-underline hover:underline focus-visible:outline-2 focus-visible:outline-cyan">
            Open the cold email template
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
