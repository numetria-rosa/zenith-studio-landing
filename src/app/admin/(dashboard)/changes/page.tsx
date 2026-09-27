import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { planAgents } from "@/lib/client-console-data";
import { SETTINGS, optionLabel } from "@/lib/agent-settings";
import { parseChanges } from "@/lib/agent-changes";
import { HqTopbar } from "../HqTopbar";

/* Every "Request a change" a client made. These are applied by code the
   moment the client saves, so this page is a log, not a to-do list. */
export default async function HqAgentChangesPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const rows = await db.agentChangeRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { project: { select: { id: true, title: true, sourceServiceId: true } } },
  });

  return (
    <>
      <HqTopbar title="Agent changes" subtitle="Tone and rule changes clients made from their dashboards. Every one was applied automatically, nothing to do here." />
      <section className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>When</th>
                <th>Client</th>
                <th>Agent</th>
                <th>Change</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty" style={{ border: "none" }}>
                      <b>No changes yet</b>
                      When a client adjusts an agent, it shows up here.
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const agentName = planAgents(r.project.sourceServiceId).find((a) => a.id === r.agentId)?.name ?? r.agentId;
                return (
                  <tr key={r.id}>
                    <td className="muted">{r.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                    <td>
                      <Link href={`/admin/projects/${r.project.id}`} className="rowbtn">
                        <b>{r.project.title}</b>
                      </Link>
                    </td>
                    <td>{agentName}</td>
                    <td>
                      {parseChanges(r.changes).map((c) => (
                        <div key={c.key}>
                          {SETTINGS[c.key].label}: <span className="muted">{optionLabel(c.key, c.from)}</span> → <b>{optionLabel(c.key, c.to)}</b>
                        </div>
                      ))}
                    </td>
                    <td>
                      <span className="pill p-ok" style={{ fontSize: 12 }}>
                        <i />
                        applied automatically
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
