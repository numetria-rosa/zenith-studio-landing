import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getHqClients, listServiceCatalogForHq, fmtMoney, activeClientCountByService, mrrByService, SERVICE_ORDER, SERVICE_COLOR, orderedServices } from "@/lib/hq";
import { saveServicePrice, toggleServiceFlag } from "@/lib/hq/actions";
import { planAgents } from "@/lib/client-console-data";
import { HqTopbar } from "../HqTopbar";
import { Toast } from "../Toast";

function centsFromForm(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw == null || raw === "") return null;
  return Math.max(0, Math.round(Number(raw) * 100));
}

export default async function HqServicesPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const [clients, catalog] = await Promise.all([getHqClients(), listServiceCatalogForHq()]);
  const services = orderedServices(catalog.map((c) => ({ ...c, slug: c.slug as (typeof SERVICE_ORDER)[number] })));

  async function savePrices(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    const slug = String(formData.get("slug"));
    await saveServicePrice(slug, {
      listPriceCents: centsFromForm(formData, "listPrice"),
      monthlyPriceCents: centsFromForm(formData, "monthlyPrice"),
      quarterlyPriceCentsPerMonth: centsFromForm(formData, "quarterlyPrice"),
      setupPriceCents: centsFromForm(formData, "setupFee"),
    });
    revalidatePath("/admin/services");
    redirect("/admin/services?flash=" + encodeURIComponent("Price saved · MRR updated"));
  }

  async function toggleFlag(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    const slug = String(formData.get("slug"));
    const flag = String(formData.get("flag")) as "freeSetup" | "trialEnabled" | "acceptingNewClients";
    await toggleServiceFlag(slug, flag);
    revalidatePath("/admin/services");
    redirect("/admin/services");
  }

  return (
    <>
      <HqTopbar title="Services" subtitle="Prices, offers and agents for everything you sell. Price changes update MRR everywhere in Zenith HQ." />

      <div className="svgrid">
        {services.map((s) => {
          const active = activeClientCountByService(clients, s.slug);
          const trial = clients.filter((c) => c.service === s.slug && c.status === "trial").length;
          const setup = clients.filter((c) => c.service === s.slug && c.status === "setup").length;
          const mrr = mrrByService(clients, s.slug);
          const agents = planAgents(s.slug);
          const offM = s.listPriceCents && s.monthlyPriceCents ? Math.round((1 - s.monthlyPriceCents / s.listPriceCents) * 100) : null;
          const offQ = s.listPriceCents && s.quarterlyPriceCentsPerMonth ? Math.round((1 - s.quarterlyPriceCentsPerMonth / s.listPriceCents) * 100) : null;

          return (
            <section className="card svcard" key={s.slug}>
              <div className="top">
                <div>
                  <h2>
                    <i style={{ background: SERVICE_COLOR[s.slug] }} />
                    {s.title}
                  </h2>
                  <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                    {agents.length} {agents.length === 1 ? "agent" : "agents"} · SLA {s.slaHours}h
                  </p>
                </div>
                {s.landingPageUrl && (
                  <a className="btn" href={s.landingPageUrl} target="_blank" rel="noopener" style={{ minHeight: 38, padding: "8px 14px", fontSize: 13 }}>
                    Landing page
                  </a>
                )}
              </div>

              <div className="stats">
                <div>
                  <b>{active}</b>
                  <span>active</span>
                </div>
                <div>
                  <b>{trial}</b>
                  <span>in trial</span>
                </div>
                <div>
                  <b>{setup}</b>
                  <span>in setup</span>
                </div>
                <div>
                  <b>{fmtMoney(mrr)}</b>
                  <span>MRR</span>
                </div>
              </div>

              <form action={savePrices} className="pe">
                <input type="hidden" name="slug" value={s.slug} />
                <PriceField id={`list-${s.slug}`} name="listPrice" label="List price /mo" value={s.listPriceCents} note="shown crossed out" />
                <PriceField id={`monthly-${s.slug}`} name="monthlyPrice" label="Monthly price" value={s.monthlyPriceCents} note={offM != null ? `−${offM}% vs list` : "no discount"} />
                <PriceField id={`quarterly-${s.slug}`} name="quarterlyPrice" label="Quarterly, per month" value={s.quarterlyPriceCentsPerMonth} note={offQ != null ? `−${offQ}% · ${fmtMoney((s.quarterlyPriceCentsPerMonth ?? 0) * 3)}/quarter` : "quarterly not offered"} />
                <PriceField id={`setup-${s.slug}`} name="setupFee" label="Setup fee" value={s.setupPriceCents} note={s.setupPriceCents ? "one-time" : "free"} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <button className="btn" type="submit">
                    Save prices
                  </button>
                </div>
              </form>

              <div className="opts">
                <ToggleRow slug={s.slug} flag="freeSetup" label="Free setup" desc="Setup at no cost" checked={s.freeSetup} action={toggleFlag} />
                <ToggleRow slug={s.slug} flag="trialEnabled" label="Free trial" desc="72 hours of testing after setup" checked={s.trialEnabled} action={toggleFlag} />
                <ToggleRow slug={s.slug} flag="acceptingNewClients" label="Accepting new clients" desc="Off hides booking on the landing page" checked={s.acceptingNewClients} action={toggleFlag} />
              </div>

              <div>
                <span className="eyebrow" style={{ display: "block", marginBottom: 10 }}>
                  Agents in this service
                </span>
                <div className="chips">
                  {agents.map((a) => (
                    <span className="chipx" key={a.id}>
                      {a.name}{" "}
                      <span className={`pill ${a.real ? "p-ok" : "p-idle"}`} style={{ fontSize: 11.5, padding: "2px 8px" }}>
                        <i />
                        {a.real ? "Live today" : "Not built yet"}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 22 }}>
        Prices and toggles here drive Zenith HQ&apos;s own MRR math and the Services page display only - they do not change what Whop actually charges an
        existing subscriber. Update the real Whop plan separately if you&apos;re repricing existing clients.
      </p>
      <Toast />
    </>
  );
}

function PriceField({ id, name, label, value, note }: { id: string; name: string; label: string; value: number | null; note: string }) {
  return (
    <div className="fld">
      <label htmlFor={id}>{label}</label>
      <div className="in">
        <span className="muted">$</span>
        <input id={id} type="number" min={0} step={0.5} name={name} defaultValue={value != null ? value / 100 : ""} placeholder={value == null ? "Not offered" : undefined} />
      </div>
      <small>{note || " "}</small>
    </div>
  );
}

function ToggleRow({
  slug,
  flag,
  label,
  desc,
  checked,
  action,
}: {
  slug: string;
  flag: "freeSetup" | "trialEnabled" | "acceptingNewClients";
  label: string;
  desc: string;
  checked: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="tr">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="flag" value={flag} />
      <div>
        <b>{label}</b>
        <br />
        <span>{desc}</span>
      </div>
      <button className="tog" type="submit" role="switch" aria-checked={checked} aria-label={label} />
    </form>
  );
}
