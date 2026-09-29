import { db } from "@/lib/db";

export const CLIENT_STATUSES = ["draft", "ready", "live"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export type AieClientRow = {
  id: string;
  name: string;
  niche: string;
  city: string;
  agentId: string;
  status: ClientStatus;
  setupFeeCents: number;
  monthlyFeeCents: number;
  notes: string;
};

export type ClientInput = Omit<AieClientRow, "id">;

export function isStatus(v: string): v is ClientStatus {
  return (CLIENT_STATUSES as readonly string[]).includes(v);
}

/** Validates form input; returns the clean value or a message the form can show. */
export function parseClientInput(
  raw: Record<string, FormDataEntryValue | null>,
  agentIds: string[],
): { ok: true; value: ClientInput } | { ok: false; error: string } {
  const text = (k: string) => String(raw[k] ?? "").trim();
  const dollars = (k: string) => {
    const n = Number(text(k) || 0);
    return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? Math.round(n * 100) : null;
  };
  const name = text("name");
  if (!name || name.length > 120) return { ok: false, error: "Enter the client's name (up to 120 characters)." };
  const agentId = text("agentId");
  if (!agentIds.includes(agentId)) return { ok: false, error: "Choose one of the five agents." };
  const niche = text("niche") === "__other" ? text("nicheOther") : text("niche");
  const city = text("city") === "__other" ? text("cityOther") : text("city");
  if (!niche || niche.length > 80) return { ok: false, error: "Choose a niche, or type it under 'Other'." };
  if (!city || city.length > 80) return { ok: false, error: "Choose a city, or type it under 'Other'." };
  const status = text("status") || "draft";
  if (!isStatus(status)) return { ok: false, error: "Choose a status." };
  const setupFeeCents = dollars("setupFee");
  const monthlyFeeCents = dollars("monthlyFee");
  if (setupFeeCents === null || monthlyFeeCents === null) return { ok: false, error: "Fees must be amounts between 0 and 1,000,000." };
  const notes = text("notes");
  if (notes.length > 500) return { ok: false, error: "Notes can be up to 500 characters." };
  return { ok: true, value: { name, niche, city, agentId, status, setupFeeCents, monthlyFeeCents, notes } };
}

const select = {
  id: true, name: true, niche: true, city: true, agentId: true, status: true,
  setupFeeCents: true, monthlyFeeCents: true, notes: true,
} as const;

export async function listClients(userId: string): Promise<AieClientRow[]> {
  const rows = await db.aieClient.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select });
  return rows.map((r) => ({ ...r, status: isStatus(r.status) ? r.status : "draft" }));
}

export async function createClient(userId: string, input: ClientInput): Promise<void> {
  await db.aieClient.create({ data: { userId, ...input } });
}

/** Scoped by userId: a student can only change their own rows. */
export async function updateClient(userId: string, id: string, input: Partial<ClientInput>): Promise<void> {
  await db.aieClient.updateMany({ where: { id, userId }, data: input });
}

export async function deleteClient(userId: string, id: string): Promise<void> {
  await db.aieClient.deleteMany({ where: { id, userId } });
}

export async function getDoneSteps(userId: string): Promise<Set<string>> {
  const rows = await db.aieSellPlanStep.findMany({ where: { userId }, select: { stepId: true } });
  return new Set(rows.map((r) => r.stepId));
}

export async function setStep(userId: string, stepId: string, done: boolean): Promise<void> {
  if (done) {
    await db.aieSellPlanStep.upsert({ where: { userId_stepId: { userId, stepId } }, create: { userId, stepId }, update: {} });
  } else {
    await db.aieSellPlanStep.deleteMany({ where: { userId, stepId } });
  }
}

/** Monthly recurring revenue and one-off setup revenue, split by status. */
export function summarise(clients: AieClientRow[]) {
  const sum = (status: ClientStatus, key: "monthlyFeeCents" | "setupFeeCents") =>
    clients.filter((c) => c.status === status).reduce((n, c) => n + c[key], 0);
  return {
    liveMrrCents: sum("live", "monthlyFeeCents"),
    pipelineMrrCents: sum("ready", "monthlyFeeCents") + sum("draft", "monthlyFeeCents"),
    liveSetupCents: sum("live", "setupFeeCents"),
    liveCount: clients.filter((c) => c.status === "live").length,
  };
}
