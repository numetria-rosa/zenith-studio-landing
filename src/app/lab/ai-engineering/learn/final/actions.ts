"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LEARN_BASE } from "@/components/learn/nav";
import { createClient, deleteClient, isStatus, parseClientInput, setStep, updateClient } from "@/lib/aie/clients";
import { getFinalModule } from "@/lib/aie/final-module";
import { requireEnrollment } from "@/lib/require-enrollment";

const CLIENTS_PATH = `${LEARN_BASE}/final/clients`;

export type FormState = { error?: string } | undefined;

export async function addClientAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { userId } = await requireEnrollment("ai-engineering", CLIENTS_PATH);
  const { agents } = await getFinalModule();
  const parsed = parseClientInput(Object.fromEntries(form), agents.map((a) => a.id));
  if (!parsed.ok) return { error: parsed.error };
  await createClient(userId, parsed.value);
  revalidatePath(CLIENTS_PATH);
  redirect(CLIENTS_PATH);
}

export async function setClientStatusAction(form: FormData): Promise<void> {
  const { userId } = await requireEnrollment("ai-engineering", CLIENTS_PATH);
  const status = String(form.get("status") ?? "");
  if (isStatus(status)) await updateClient(userId, String(form.get("id")), { status });
  revalidatePath(CLIENTS_PATH);
}

export async function deleteClientAction(form: FormData): Promise<void> {
  const { userId } = await requireEnrollment("ai-engineering", CLIENTS_PATH);
  await deleteClient(userId, String(form.get("id")));
  revalidatePath(CLIENTS_PATH);
}

export async function toggleStepAction(form: FormData): Promise<void> {
  const path = `${LEARN_BASE}/final/sell-plan`;
  const { userId } = await requireEnrollment("ai-engineering", path);
  const { sellPlan } = await getFinalModule();
  const stepId = String(form.get("stepId"));
  if (sellPlan.some((s) => s.id === stepId)) await setStep(userId, stepId, form.get("done") === "1");
  revalidatePath(path);
}
