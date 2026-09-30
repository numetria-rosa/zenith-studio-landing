import { callCostUsd, type ModelEntry } from "./final-module";

/** The assumptions the Revenue page's worked example (and the calculator's defaults) use. */
export const EXAMPLE = { clients: 3, replies: 1000, inputTokens: 1500, outputTokens: 200, hostingUsd: 15 } as const;

export type Economics = {
  perReplyUsd: number;
  modelPerClientUsd: number;
  costPerClientUsd: number;
  revenueUsd: number;
  costUsd: number;
  profitUsd: number;
  margin: number;
};

/** Monthly revenue, cost and profit for `clients` clients on one agent and one model. */
export function clientEconomics(model: ModelEntry, monthlyUsd: number, o: typeof EXAMPLE = EXAMPLE): Economics {
  const perReplyUsd = callCostUsd(model, o.inputTokens, o.outputTokens);
  const modelPerClientUsd = perReplyUsd * o.replies;
  const costPerClientUsd = modelPerClientUsd + o.hostingUsd;
  const revenueUsd = o.clients * monthlyUsd;
  const costUsd = o.clients * costPerClientUsd;
  const profitUsd = revenueUsd - costUsd;
  return { perReplyUsd, modelPerClientUsd, costPerClientUsd, revenueUsd, costUsd, profitUsd, margin: revenueUsd > 0 ? profitUsd / revenueUsd : 0 };
}
