/* Client-facing framing for ServiceMetric rows. Two jobs: never leak the
   internal cost/budget bookkeeping usage-costs.ts writes into the same
   table (a client seeing exactly what we pay providers to run their
   account undermines pricing, that's ours to know, not theirs), and turn
   "one row per event" into one aggregated total per metric, a client with
   real call volume would otherwise scroll a list with one row per call. */

const INTERNAL_METRIC_PREFIXES = ["api_cost_cents", "budget_alert_", "dead_man_alert_"];

export function isInternalMetricKey(key: string): boolean {
  return INTERNAL_METRIC_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix));
}

function formatSecondsAsDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
}

const METRIC_LABELS: Record<string, { label: string; format?: (total: number) => string }> = {
  calls_received: { label: "Calls handled" },
  calls_booked: { label: "Appointments booked" },
  calls_escalated: { label: "Calls escalated to a human" },
  call_duration_seconds: { label: "Total call time", format: formatSecondsAsDuration },
  missed_calls_texted: { label: "Missed calls texted back" },
  missed_calls_text_failed: { label: "Text-back attempts that failed" },
};

export type AggregatedMetric = { key: string; label: string; display: string };

/** Sums every row by key (skipping internal keys) rather than rendering one
    row per raw event, so this scales to real call/text volume. */
export function aggregateClientMetrics(metrics: { key: string; value: number }[]): AggregatedMetric[] {
  const totals = new Map<string, number>();
  for (const m of metrics) {
    if (isInternalMetricKey(m.key)) continue;
    totals.set(m.key, (totals.get(m.key) ?? 0) + m.value);
  }

  return Array.from(totals.entries()).map(([key, total]) => {
    const meta = METRIC_LABELS[key];
    return {
      key,
      label: meta?.label ?? key.replace(/_/g, " "),
      display: meta?.format ? meta.format(total) : String(total),
    };
  });
}
