import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getHqClients, SERVICE_SHORT } from "@/lib/hq";
import { setProjectPaused } from "@/lib/hq/actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { HqTopbar } from "../HqTopbar";
import { AgentPill } from "../Pill";
import { Toast } from "../Toast";

export default async function HqAgentsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const { view } = await searchParams;
  const errorsOnly = view === "errors";

  const clients = await getHqClients();
  const rows = clients.flatMap((c) => c.agents.filter((a) => a.real).map((a) => ({ client: c, agent: a })));
  const errorRows = rows.filter((r) => r.agent.tone === "need");
  const shown = errorsOnly ? errorRows : rows;
  const pausedCount = clients.filter((c) => c.status === "paused").reduce((sum, c) => sum + c.agents.filter((a) => a.real).length, 0);

  async function resumeAction(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    await setProjectPaused(String(formData.get("id")), false);
    revalidatePath("/admin/agents");
    redirect("/admin/agents");
  }

  return (
    <>
      <HqTopbar title="Agents" subtitle="Every real agent running for every client. No per-run log yet, so runs/errors below reflect what each agent actually tracks today - see each agent's own label." />

      <div className="kpis">
        <div className="kpi">
          <span>Real agents</span>
          <b className="num">{rows.length}</b>
        </div>
        <div className="kpi">
          <span>Clients on them</span>
          <b className="num">{new Set(rows.map((r) => r.client.id)).size}</b>
        </div>
        <div className={`kpi${errorRows.length ? " warn" : ""}`}>
          <span>Need attention</span>
          <b>{errorRows.length}</b>
        </div>
        <div className="kpi">
          <span>Paused</span>
          <b>{pausedCount}</b>
        </div>
      </div>

      <div className="bar2">
        <div className="seg" role="group" aria-label="Show">
          <Link href="/admin/agents" aria-pressed={!errorsOnly}>
            All agents
          </Link>
          <Link href="/admin/agents?view=errors" aria-pressed={errorsOnly}>
            Needs attention only
          </Link>
        </div>
      </div>

      <section className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Client</th>
                <th>Status</th>
                <th>Today</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty" style={{ border: "none" }}>
                      <b>Nothing here</b>
                    </div>
                  </td>
                </tr>
              )}
              {shown.map(({ client, agent }) => (
                <tr key={`${client.id}:${agent.id}`}>
                  <td>
                    <b>{agent.name}</b>
                    <span className="sm">{SERVICE_SHORT[client.service]}</span>
                  </td>
                  <td>
                    <Link href={`/admin/clients/${client.id}`} className="rowbtn">
                      <b>{client.name}</b>
                    </Link>
                  </td>
                  <td>
                    <AgentPill tone={client.status === "paused" ? "dim" : agent.tone} />
                  </td>
                  <td className="muted">
                    {agent.todayLabel}: {agent.todayValue}
                  </td>
                  <td className="r">
                    {client.status === "paused" ? (
                      <form action={resumeAction} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={client.id} />
                        <button className="link" type="submit">
                          Resume
                        </button>
                      </form>
                    ) : (
                      <Link href={`/admin/clients/${client.id}`} className="link">
                        Open
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Toast />
    </>
  );
}
