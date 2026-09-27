import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { planAgents } from "@/lib/client-console-data";
import { adjustableSettings, readSettings, SETTINGS, type SettingKey } from "@/lib/agent-settings";

export type AgentChange = { key: SettingKey; from: string; to: string };

/** Applies a client's "Request a change" immediately. Only fixed option
    values for settings this agent actually exposes are accepted, so the
    saved value is always something the engine knows how to run. */
export async function applyAgentChange(
  projectId: string,
  userId: string,
  agentId: string,
  submitted: Record<string, string>
): Promise<{ ok: true; changes: AgentChange[] } | { ok: false; error: string }> {
  const project = await db.serviceProject.findFirst({
    where: { id: projectId, userId },
    select: { id: true, sourceServiceId: true, agentSettings: true },
  });
  if (!project) return { ok: false, error: "not_found" };
  const agent = planAgents(project.sourceServiceId).find((a) => a.id === agentId);
  if (!agent || !agent.real) return { ok: false, error: "This agent has nothing to adjust yet." };

  const current = readSettings(project.agentSettings);
  const changes: AgentChange[] = [];
  for (const key of adjustableSettings(agentId)) {
    const value = submitted[key];
    if (value === undefined || value === current[key]) continue;
    if (!SETTINGS[key].options.some((o) => o.value === value)) return { ok: false, error: "That option isn't available." };
    changes.push({ key, from: current[key], to: value });
  }
  if (changes.length === 0) return { ok: true, changes };

  const stored = project.agentSettings && typeof project.agentSettings === "object" ? (project.agentSettings as Record<string, unknown>) : {};
  const next = { ...stored, ...Object.fromEntries(changes.map((c) => [c.key, c.to])) };
  await db.$transaction([
    db.serviceProject.update({ where: { id: project.id }, data: { agentSettings: next as Prisma.InputJsonValue } }),
    db.agentChangeRequest.create({
      data: { projectId: project.id, userId, agentId, changes: changes as unknown as Prisma.InputJsonValue },
    }),
  ]);
  return { ok: true, changes };
}

export function parseChanges(raw: unknown): AgentChange[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (c): c is AgentChange =>
      !!c && typeof c === "object" && typeof (c as AgentChange).key === "string" && (c as AgentChange).key in SETTINGS
  );
}
