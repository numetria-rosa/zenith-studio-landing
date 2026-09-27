import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOwnedServiceProject } from "@/lib/service-workspace";
import { planAgents, isSupportedPlan } from "@/lib/client-console-data";
import { adjustableSettings, readSettings, SETTINGS, optionLabel } from "@/lib/agent-settings";
import { applyAgentChange, parseChanges } from "@/lib/agent-changes";
import { Eyebrow } from "../../../ui";
import u from "../../../ui.module.css";
import s from "./adjust.module.css";

/* "Request a change": fixed options only, applied by code the instant the
   client saves. No free text, no human step, no AI deciding anything. */
export default async function AdjustAgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; agentId: string }>;
  searchParams: Promise<{ flash?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { clientId, agentId } = await params;
  const { flash, error } = await searchParams;
  const project = await getOwnedServiceProject(clientId, session.user.id);
  if (!project || !isSupportedPlan(project.sourceServiceId)) notFound();
  const agent = planAgents(project.sourceServiceId).find((a) => a.id === agentId);
  if (!agent) notFound();

  const keys = agent.real ? adjustableSettings(agentId) : [];
  const current = readSettings(project.agentSettings);
  const history = await db.agentChangeRequest.findMany({
    where: { projectId: clientId, agentId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const here = `/services/dashboard/${clientId}/agents/${agentId}/adjust`;

  async function save(formData: FormData): Promise<void> {
    "use server";
    const session2 = await auth();
    if (!session2?.user?.id) redirect(`/sign-in?callbackUrl=${encodeURIComponent(here)}`);
    const submitted: Record<string, string> = {};
    for (const [k, v] of formData.entries()) if (typeof v === "string") submitted[k] = v;
    const result = await applyAgentChange(clientId, session2.user.id, agentId, submitted);
    if (!result.ok) redirect(`${here}?error=${encodeURIComponent(result.error)}`);
    revalidatePath(`/services/dashboard/${clientId}`, "layout");
    const msg =
      result.changes.length === 0
        ? "Nothing changed, those were already your settings."
        : `Applied. ${result.changes.map((c) => `${SETTINGS[c.key].label}: ${optionLabel(c.key, c.to)}`).join(" · ")}. Live from the very next message.`;
    redirect(`${here}?flash=${encodeURIComponent(msg)}`);
  }

  return (
    <div>
      <nav className={s.breadcrumb} aria-label="Breadcrumb">
        <Link href={`/services/dashboard/${clientId}/agents`}>Agents</Link> /{" "}
        <Link href={`/services/dashboard/${clientId}/agents/${agentId}`}>{agent.name}</Link> / <span>Request a change</span>
      </nav>
      <h1 className={s.title}>Request a change</h1>
      <p className={s.sub}>
        Pick what you want and save. Your {agent.name} switches over instantly, no waiting on us.
      </p>

      {flash && <p className={s.flash}>{flash}</p>}
      {error && <p className={s.error}>{error}</p>}

      {keys.length === 0 ? (
        <div className={`${u.card} ${s.card}`}>
          <p className={s.empty}>
            {agent.real ? "This agent has no adjustable settings yet." : "This agent isn't active yet, so there's nothing to adjust."}
          </p>
        </div>
      ) : (
        <form action={save} className={s.form}>
          {keys.map((key) => (
            <fieldset key={key} className={`${u.card} ${s.card}`}>
              <legend className={s.legend}>
                <Eyebrow>{SETTINGS[key].label}</Eyebrow>
                <span className={s.question}>{SETTINGS[key].question}</span>
              </legend>
              <div className={s.options}>
                {SETTINGS[key].options.map((o) => (
                  <label key={o.value} className={s.option}>
                    <input type="radio" name={key} value={o.value} defaultChecked={current[key] === o.value} className={s.radio} />
                    <span className={s.optionBody}>
                      <span className={s.optionLabel}>{o.label}</span>
                      <span className={s.optionHint}>{o.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className={s.actions}>
            <button type="submit" className={u.btnPrimary}>
              Apply changes
            </button>
            <Link href={`/services/dashboard/${clientId}/agents/${agentId}`} className={u.btnGhost}>
              Cancel
            </Link>
          </div>
        </form>
      )}

      {history.length > 0 && (
        <section className={`${u.card} ${s.card}`} style={{ marginTop: 24 }}>
          <Eyebrow>Change history</Eyebrow>
          <ul className={s.history}>
            {history.map((h) => (
              <li key={h.id}>
                <span className={s.historyText}>
                  {parseChanges(h.changes)
                    .map((c) => `${SETTINGS[c.key].label}: ${optionLabel(c.key, c.from)} → ${optionLabel(c.key, c.to)}`)
                    .join(" · ")}
                </span>
                <span className={s.historyMeta}>Applied · {h.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
