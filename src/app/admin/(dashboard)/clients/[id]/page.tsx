import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getHqClient, fmtMoney, SETUP_STEPS, fmtHours, type ServiceKey, type HqClient } from "@/lib/hq";
import { getServiceCatalogBySlug, listSupportRequestsForHq } from "@/lib/hq/queries";
import {
  convertTrial,
  extendTrial,
  retryCharge,
  setProjectPaused,
  advanceSetup,
  adjustReadyBy,
  switchBillingCycle,
  saveAdminNote,
} from "@/lib/hq/actions";
import { ServiceTag } from "../../ServiceTag";
import { StatusPill, AgentPill } from "../../Pill";
import { Icon } from "../../Icon";
import { Toast } from "../../Toast";

function readyByLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function HqClientDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ flash?: string }> }) {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const { id } = await params;
  await searchParams;

  const client = await getHqClient(id);
  if (!client) notFound();
  const catalog = await getServiceCatalogBySlug(client.service);
  const requests = (await listSupportRequestsForHq()).filter((r) => r.projectId === id);

  const now = new Date();
  const paused = client.agents.length > 0 && client.status === "paused";
  const canYearly = catalog?.quarterlyPriceCentsPerMonth != null;

  async function togglePauseAll(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    const willPause = String(formData.get("willPause")) === "1";
    await setProjectPaused(id, willPause);
    revalidatePath(`/admin/clients/${id}`);
    redirect(`/admin/clients/${id}?flash=${encodeURIComponent(`${willPause ? "Paused" : "Resumed"} all agents · ${client!.name}`)}`);
  }

  async function convertAction(): Promise<void> {
    "use server";
    await requireAdmin();
    await convertTrial(id);
    revalidatePath(`/admin/clients/${id}`);
    redirect(`/admin/clients/${id}?flash=${encodeURIComponent(`${client!.name} converted · +${fmtMoney(client!.priceCents)} MRR`)}`);
  }

  async function extendAction(): Promise<void> {
    "use server";
    await requireAdmin();
    await extendTrial(id, 24);
    revalidatePath(`/admin/clients/${id}`);
    redirect(`/admin/clients/${id}?flash=${encodeURIComponent(`Trial extended 24h · ${client!.name}`)}`);
  }

  async function retryAction(): Promise<void> {
    "use server";
    await requireAdmin();
    await retryCharge(id);
    revalidatePath(`/admin/clients/${id}`);
    redirect(`/admin/clients/${id}?flash=${encodeURIComponent("Retry sent · we'll hear back on the next webhook")}`);
  }

  async function advanceAction(): Promise<void> {
    "use server";
    await requireAdmin();
    const wasLastStep = client!.setupStage === 2;
    await advanceSetup(id);
    revalidatePath(`/admin/clients/${id}`);
    redirect(`/admin/clients/${id}?flash=${encodeURIComponent(wasLastStep ? `${client!.name} is ready` : `Step done · ${client!.name}`)}`);
  }

  async function adjustDueAction(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    await adjustReadyBy(id, Number(formData.get("delta")));
    revalidatePath(`/admin/clients/${id}`);
    redirect(`/admin/clients/${id}`);
  }

  async function billingCycleAction(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    const cycle = String(formData.get("cycle")) as "monthly" | "quarterly";
    await switchBillingCycle(id, cycle);
    revalidatePath(`/admin/clients/${id}`);
    redirect(`/admin/clients/${id}?flash=${encodeURIComponent(`Billing set to ${cycle}`)}`);
  }

  async function saveNoteAction(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    await saveAdminNote(id, String(formData.get("note") || ""));
    revalidatePath(`/admin/clients/${id}`);
    redirect(`/admin/clients/${id}?flash=${encodeURIComponent("Note saved")}`);
  }

  return (
    <>
      <div className="crumb">
        <Link href="/admin/clients">Clients</Link>
        <span>/</span>
        <b>{client.name}</b>
      </div>

      <div className="chead">
        <div className="l">
          <span className="cav" style={{ borderColor: "var(--line-2)" }}>
            {client.name.charAt(0)}
          </span>
          <div>
            <h1>
              {client.name} <StatusPill client={client} now={now} />
            </h1>
            <div className="meta">
              <span>{client.contactName}</span>
              <ServiceTag service={client.service as ServiceKey} />
              <span>Client since {client.since.toISOString().slice(0, 10)}</span>
              <span>Health {client.health == null ? "–" : client.health}</span>
            </div>
          </div>
        </div>
        <div className="r">
          <a className="btn" href={`/services/dashboard/${client.id}`} target="_blank" rel="noopener">
            <Icon name="ext" size={16} />
            View as client
          </a>
          {client.status !== "setup" && (
            <form action={togglePauseAll}>
              <input type="hidden" name="willPause" value={paused ? "0" : "1"} />
              <button className="btn" type="submit">
                <Icon name={paused ? "play" : "pause"} size={16} />
                {paused ? "Resume all agents" : "Pause all agents"}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="gh">
        {client.status === "setup" && (
          <section className="card pad">
            <div className="ctop">
              <h2>Setup</h2>
              <span className={`pill ${client.setupReadyBy && (client.setupReadyBy.getTime() - now.getTime()) / 3600_000 <= 6 ? "p-wait" : "p-run"}`}>
                <i />
                {client.setupReadyBy ? `due in ${fmtHours(Math.max(0, (client.setupReadyBy.getTime() - now.getTime()) / 3600_000))}` : `SLA ${fmtHours(client.slaHours)}`}
              </span>
            </div>
            {client.setupReadyBy && (
              <div className="eta">
                <div>
                  <span className="muted" style={{ fontSize: 13 }}>
                    The client dashboard shows
                  </span>
                  <br />
                  <b>Ready by {readyByLabel(client.setupReadyBy)}</b>
                </div>
                <div className="stp">
                  <form action={adjustDueAction}>
                    <input type="hidden" name="delta" value="-1" />
                    <button type="submit" aria-label="One hour earlier">
                      −1h
                    </button>
                  </form>
                  <form action={adjustDueAction}>
                    <input type="hidden" name="delta" value="1" />
                    <button type="submit" aria-label="One hour later">
                      +1h
                    </button>
                  </form>
                </div>
              </div>
            )}
            <div className="chk" style={{ marginTop: 10 }}>
              {SETUP_STEPS.map((label, i) => {
                const stage = client.setupStage ?? 0;
                const cls = i < stage + 1 ? "done" : i === stage + 1 ? "now" : "";
                return (
                  <div className={`s ${cls}`} key={label}>
                    <span className="d">{cls === "done" && <Icon name="check" size={14} color="#7FF0BD" strokeWidth={2.6} />}</span>
                    <div>
                      <b>{label}</b>
                    </div>
                    {cls === "now" && (
                      <form action={advanceAction}>
                        <button className="btn go" type="submit">
                          {i === 3 ? "Mark ready" : "Mark done"}
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {client.status === "trial" && client.trialEndsAt && (
          <section className="card pad">
            <div className="ctop">
              <h2>Free trial</h2>
              <span className="pill p-trial">
                <i />
                {fmtHours(Math.max(0, (client.trialEndsAt.getTime() - now.getTime()) / 3600_000))} of 72h left
              </span>
            </div>
            <div className="meter">
              <i style={{ width: `${100 - Math.max(0, Math.min(100, ((client.trialEndsAt.getTime() - now.getTime()) / 3600_000 / 72) * 100))}%` }} />
            </div>
            <p className="muted" style={{ fontSize: 14, margin: "8px 0 16px" }}>
              Converts to {fmtMoney(client.priceCents)}/mo, billed {client.billingCycle}.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <form action={convertAction}>
                <button className="btn go" type="submit">
                  Convert to paid
                </button>
              </form>
              <form action={extendAction}>
                <button className="btn" type="submit">
                  Extend 24h
                </button>
              </form>
            </div>
          </section>
        )}

        {(client.status === "active" || client.status === "paused") && (
          <BillingCard client={client} canYearly={canYearly} onCycle={billingCycleAction} onRetry={retryAction} />
        )}

        <section className="card pad">
          <div className="ctop">
            <h2>Agents</h2>
            <span className="muted">{client.agents.filter((a) => a.real).length} real</span>
          </div>
          {client.agents.map((a) => (
            <div className="arow" key={a.id}>
              <div className="tx">
                <b>{a.name}</b>
                <span>
                  {a.todayLabel}: {a.todayValue}
                </span>
              </div>
              {a.real ? <AgentPill tone={client.status === "paused" ? "dim" : a.tone} /> : (
                <span className="pill p-idle">
                  <i />
                  not set up
                </span>
              )}
            </div>
          ))}
        </section>
      </div>

      <div className="g3">
        {client.status === "trial" || client.status === "setup" ? (
          <BillingCard client={client} canYearly={canYearly} onCycle={billingCycleAction} onRetry={retryAction} />
        ) : null}

        <section className="card pad">
          <div className="ctop">
            <h2>Requests</h2>
            <Link href="/admin/requests" className="link">
              All requests
            </Link>
          </div>
          {requests.length === 0 && <p className="muted">No requests from this client.</p>}
          {requests.map((r) => (
            <div className="arow" key={r.id}>
              <div className="tx">
                <b>{r.subject}</b>
                <span>{r.createdAt.toISOString().slice(0, 10)}</span>
              </div>
              <span className={`pill ${r.status === "RESOLVED" || r.status === "CLOSED" ? "p-ok" : r.status === "IN_PROGRESS" ? "p-run" : "p-wait"}`}>
                <i />
                {r.status === "RESOLVED" || r.status === "CLOSED" ? "done" : r.status === "IN_PROGRESS" ? "in progress" : "open"}
              </span>
              <Link href={`/admin/requests?id=${r.id}`} className="btn" style={{ minHeight: 36, padding: "6px 12px", fontSize: 12.5 }}>
                Open
              </Link>
            </div>
          ))}
        </section>

        <section className="card pad">
          <div className="ctop">
            <h2>Private notes</h2>
            <span className="muted" style={{ fontSize: 13 }}>
              Only you see these
            </span>
          </div>
          <form action={saveNoteAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea className="note" name="note" aria-label="Private notes" defaultValue={client.adminNote} />
            <button className="btn" type="submit" style={{ alignSelf: "flex-end" }}>
              Save
            </button>
          </form>
        </section>
      </div>
      <Toast />
    </>
  );
}

function BillingCard({
  client,
  canYearly,
  onCycle,
  onRetry,
}: {
  client: HqClient;
  canYearly: boolean;
  onCycle: (formData: FormData) => Promise<void>;
  onRetry: () => Promise<void>;
}) {
  return (
    <section className="card pad">
      <div className="ctop">
        <h2>Billing</h2>
        {client.paymentOk ? (
          <span className="pill p-ok">
            <i />
            Paid up
          </span>
        ) : (
          <span className="pill p-bad">
            <i />
            Payment failed
          </span>
        )}
      </div>
      <div className="tr">
        <b>Plan</b>
        <span>{client.service}</span>
      </div>
      <div className="tr">
        <b>Billing</b>
        {canYearly ? (
          <form action={onCycle} style={{ display: "inline" }}>
            <div className="seg sm" role="group" aria-label="Billing cycle">
              <button type="submit" name="cycle" value="monthly" aria-pressed={client.billingCycle === "monthly"}>
                Monthly
              </button>
              <button type="submit" name="cycle" value="quarterly" aria-pressed={client.billingCycle === "quarterly"}>
                Quarterly
              </button>
            </div>
          </form>
        ) : (
          <span>Monthly</span>
        )}
      </div>
      <div className="tr">
        <b>Price</b>
        <span className="num">
          {fmtMoney(client.priceCents)}/mo{client.billingCycle === "quarterly" && ` · ${fmtMoney(client.priceCents * 3)}/quarter`}
        </span>
      </div>
      {!client.paymentOk && (
        <form action={onRetry}>
          <button className="btn go" type="submit" style={{ marginTop: 12, width: "100%" }}>
            Retry charge
          </button>
        </form>
      )}
    </section>
  );
}
