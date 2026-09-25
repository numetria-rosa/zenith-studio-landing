import type { HqClient, AttentionItem, ServiceKey } from "./types";
import { SERVICE_ORDER } from "./types";

/* Pure derived-number functions - DESIGN.md section 5's business rules,
   kept free of DB access so they're directly unit-testable (see
   src/lib/hq/derive.test.ts). Every HQ page computes MRR, the attention
   queue, etc. by calling these on already-fetched HqClient[]/HqService[],
   never by re-deriving its own version. */

export function priceOf(client: HqClient): number {
  return client.priceCents;
}

// MRR rule (DESIGN.md 5.1): only `active` clients count - trial and setup
// revenue is real money not yet collected, shown separately as
// "if they convert" everywhere it appears (Overview, Onboarding).
export function mrrOf(client: HqClient): number {
  return client.status === "active" ? priceOf(client) : 0;
}

export function totalMrrCents(clients: HqClient[]): number {
  return clients.reduce((sum, c) => sum + mrrOf(c), 0);
}

export function mrrByService(clients: HqClient[], service: ServiceKey): number {
  return clients.filter((c) => c.service === service).reduce((sum, c) => sum + mrrOf(c), 0);
}

export function activeClientCountByService(clients: HqClient[], service: ServiceKey): number {
  return clients.filter((c) => c.service === service && c.status !== "paused").length;
}

export function fmtMoney(cents: number, decimals = false): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: decimals ? 2 : 0, maximumFractionDigits: decimals ? 2 : 0 })}`;
}

export function fmtMoneyMaybeDecimals(cents: number): string {
  return fmtMoney(cents, cents % 100 !== 0);
}

export function hoursUntil(date: Date | null, now: Date): number | null {
  if (!date) return null;
  return Math.max(0, (date.getTime() - now.getTime()) / 3600_000);
}

export function fmtHours(h: number): string {
  return h >= 48 ? `${Math.round(h / 24)} days` : `${Math.round(h)}h`;
}

/* Attention queue (DESIGN.md 4.1 / app.js's queue()): red first, then
   amber, then cyan; stable within a severity by generation order. Every
   item type mirrors the prototype's rules, adapted where real data
   differs (no per-agent error COUNT exists yet - an agent needing
   attention is surfaced as one item, not "N errors"). */
export function attentionQueue(clients: HqClient[], openRequests: { id: string; clientId: string; clientName: string; title: string; ageLabel: string }[], now: Date): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const c of clients) {
    if (c.status === "setup" && c.setupReadyBy) {
      const h = hoursUntil(c.setupReadyBy, now)!;
      if (h <= 12) {
        items.push({
          kind: "setup",
          severity: "amber",
          icon: "clock",
          title: `Setup due in ${fmtHours(h)} · ${c.name}`,
          subtitle: `client sees "ready by ${c.setupReadyBy.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}"`,
          actionLabel: "Open setup",
          href: `/admin/clients/${c.id}`,
          clientId: c.id,
        });
      }
    }
    if (c.status === "trial" && c.trialEndsAt) {
      const h = hoursUntil(c.trialEndsAt, now)!;
      if (h <= 36) {
        items.push({
          kind: "trial",
          severity: "cyan",
          icon: "flag",
          title: `Trial ends in ${fmtHours(h)} · ${c.name}`,
          subtitle: "Convert to paid, or extend the trial",
          actionLabel: "Convert",
          href: `/admin/clients/${c.id}`,
          clientId: c.id,
        });
      }
    }
    if (!c.paymentOk) {
      items.push({
        kind: "payment",
        severity: "red",
        icon: "card",
        title: `Payment failed · ${c.name}`,
        subtitle: "Agents paused until the charge goes through",
        actionLabel: "Retry charge",
        href: `/admin/clients/${c.id}`,
        clientId: c.id,
      });
    }
    for (const a of c.agents) {
      if (a.real && a.tone === "need") {
        items.push({
          kind: "error",
          severity: "red",
          icon: "alert",
          title: `${a.name} needs attention · ${c.name}`,
          subtitle: a.stateLabel,
          actionLabel: "Open client",
          href: `/admin/clients/${c.id}`,
          clientId: c.id,
          agentId: a.id,
        });
      }
    }
    if (c.health != null && c.health < 50 && c.status === "active") {
      items.push({
        kind: "health",
        severity: "amber",
        icon: "users",
        title: `Low usage · ${c.name}`,
        subtitle: `Health ${c.health}. A check-in call could save this account`,
        actionLabel: "Open client",
        href: `/admin/clients/${c.id}`,
        clientId: c.id,
      });
    }
  }

  for (const r of openRequests) {
    items.push({
      kind: "request",
      severity: "cyan",
      icon: "chat",
      title: `Change request · ${r.clientName}`,
      subtitle: r.title,
      actionLabel: "Reply",
      href: `/admin/requests?id=${r.id}`,
    });
  }

  const rank: Record<AttentionItem["severity"], number> = { red: 0, amber: 1, cyan: 2 };
  return items
    .map((x, i) => ({ x, i }))
    .sort((a, b) => rank[a.x.severity] - rank[b.x.severity] || a.i - b.i)
    .map(({ x }) => x);
}

export function orderedServices<T extends { slug: ServiceKey }>(services: T[]): T[] {
  return SERVICE_ORDER.map((k) => services.find((s) => s.slug === k)).filter((s): s is T => !!s);
}

export function healthColor(h: number): string {
  return h >= 80 ? "var(--mint)" : h >= 60 ? "var(--cyan)" : "var(--amber)";
}
