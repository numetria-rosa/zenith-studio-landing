import type { HqClient } from "@/lib/hq";
import { fmtHours } from "@/lib/hq";

export function StatusPill({ client, now }: { client: HqClient; now: Date }) {
  if (client.status === "active") return (
    <span className="pill p-ok">
      <i />Active
    </span>
  );
  if (client.status === "trial") {
    const h = client.trialEndsAt ? Math.max(0, (client.trialEndsAt.getTime() - now.getTime()) / 3600_000) : 0;
    return (
      <span className="pill p-trial">
        <i />Trial · {fmtHours(h)} left
      </span>
    );
  }
  if (client.status === "setup") {
    const h = client.setupReadyBy ? Math.max(0, (client.setupReadyBy.getTime() - now.getTime()) / 3600_000) : client.slaHours;
    return (
      <span className="pill p-run">
        <i />Setup · due in {fmtHours(h)}
      </span>
    );
  }
  return (
    <span className="pill p-bad">
      <i />Paused{!client.paymentOk ? " · payment failed" : ""}
    </span>
  );
}

const AGENT_PILL: Record<string, { cls: string; label: string }> = {
  run: { cls: "p-run", label: "running" },
  need: { cls: "p-wait", label: "waiting on client" },
  done: { cls: "p-ok", label: "running" },
  dim: { cls: "p-idle", label: "idle" },
};

export function AgentPill({ tone }: { tone: "run" | "need" | "done" | "dim" }) {
  const p = AGENT_PILL[tone];
  return (
    <span className={`pill ${p.cls}`}>
      <i />
      {p.label}
    </span>
  );
}

export function HealthBar({ health }: { health: number | null }) {
  if (health == null) return <span className="muted">–</span>;
  const color = health >= 80 ? "var(--mint)" : health >= 60 ? "var(--cyan)" : "var(--amber)";
  return (
    <span className="health">
      <span className="hb">
        <i style={{ width: `${health}%`, background: color }} />
      </span>
      {health}
    </span>
  );
}
