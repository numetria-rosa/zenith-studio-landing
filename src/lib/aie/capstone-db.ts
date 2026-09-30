import { db } from "@/lib/db";
import { debugScore, finalScore, type Scores } from "./capstone";

export type CapstoneState = {
  design: Record<string, string>;
  implCode: string;
  debugQ1: number | null;
  debugAnswer: string;
  debugAnswerOk: boolean | null;
  review: Record<string, string>;
  scores: Scores;
};

const strings = (v: unknown): Record<string, string> =>
  v && typeof v === "object" ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([, x]) => typeof x === "string") as [string, string][]) : {};

export async function getCapstoneState(userId: string): Promise<CapstoneState> {
  const r = await db.aieCapstone.findUnique({ where: { userId } });
  return {
    design: strings(r?.design),
    implCode: r?.implCode ?? "",
    debugQ1: r?.debugQ1 ?? null,
    debugAnswer: r?.debugAnswer ?? "",
    debugAnswerOk: r?.debugAnswerOk ?? null,
    review: strings(r?.review),
    scores: { design: r?.designScore ?? null, impl: r?.implScore ?? null, debug: r?.debugScore ?? null },
  };
}

type Patch = {
  design?: Record<string, string>;
  designScore?: number;
  implCode?: string;
  implScore?: number;
  debugQ1?: number | null;
  debugAnswer?: string;
  debugAnswerOk?: boolean | null;
  debugScore?: number | null;
  review?: Record<string, string>;
};

export async function patchCapstone(userId: string, patch: Patch): Promise<void> {
  await db.aieCapstone.upsert({ where: { userId }, create: { userId, ...patch }, update: patch });
}

/** Part 3 is scored only once both the multiple choice and the diagnosis have been answered. */
export const debugScoreFor = (correct: boolean | null, q1: number | null, ok: boolean | null) =>
  q1 !== null && ok !== null && correct !== null ? debugScore(correct, ok) : null;

export const finalFor = (s: Scores, passMark: number) => finalScore(s, passMark);
