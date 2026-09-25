import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getHqClients, totalMrrCents, fmtMoney } from "@/lib/hq";
import { retryCharge } from "@/lib/hq/actions";
import { HqTopbar } from "../HqTopbar";
import { Toast } from "../Toast";

export default async function HqBillingPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const clients = await getHqClients();
  const mrr = totalMrrCents(clients);
  const quarterly = clients.filter((c) => c.status === "active" && c.billingCycle === "quarterly");
  const quarterlyMrr = quarterly.reduce((sum, c) => sum + c.priceCents, 0);
  const failed = clients.filter((c) => !c.paymentOk);

  const upcoming = clients
    .filter((c) => c.status === "active" || c.status === "trial")
    .filter((c) => c.nextChargeAt)
    .sort((a, b) => a.nextChargeAt!.getTime() - b.nextChargeAt!.getTime());

  async function retryAction(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    const id = String(formData.get("id"));
    await retryCharge(id);
    revalidatePath("/admin/billing");
    redirect("/admin/billing?flash=" + encodeURIComponent("Retry sent · we'll hear back on the next webhook"));
  }

  return (
    <>
      <HqTopbar title="Billing" subtitle="Recurring revenue and anything that failed. Real payment status and invoices live in Whop - retrying here calls Whop's own retry API." />

      <div className="kpis">
        <div className="kpi">
          <span>MRR</span>
          <b className="num">{fmtMoney(mrr)}</b>
        </div>
        <div className="kpi">
          <span>ARR run-rate</span>
          <b className="num">{fmtMoney(mrr * 12)}</b>
        </div>
        <div className="kpi">
          <span>Billed quarterly</span>
          <b>{quarterly.length}</b>
          <small>{fmtMoney(quarterlyMrr)}/mo of MRR</small>
        </div>
        <div className={`kpi${failed.length ? " warn" : ""}`}>
          <span>Failed payments</span>
          <b>{failed.length}</b>
        </div>
      </div>

      <div className="gh">
        <section className="card pad">
          <div className="ctop">
            <h2>Failed payments</h2>
          </div>
          {failed.length === 0 && <p className="muted">No failed payments.</p>}
          {failed.map((c) => (
            <div className="qi red" key={c.id}>
              <div className="tx">
                <b>{c.name}</b>
                <span>{fmtMoney(c.priceCents)} · agents paused</span>
              </div>
              <form action={retryAction}>
                <input type="hidden" name="id" value={c.id} />
                <button className="btn go" type="submit">
                  Retry charge
                </button>
              </form>
            </div>
          ))}
        </section>
        <section className="card pad">
          <div className="ctop">
            <h2>Upcoming charges</h2>
            <span className="muted">from Whop</span>
          </div>
          {upcoming.length === 0 && (
            <p className="muted">
              Next-charge dates aren&apos;t stored locally - see each client&apos;s own membership on{" "}
              <a href="https://whop.com" target="_blank" rel="noopener">
                whop.com
              </a>
              , or open a client below.
            </p>
          )}
        </section>
      </div>

      <section className="card pad">
        <div className="ctop">
          <h2>All active and paused clients</h2>
        </div>
        {clients
          .filter((c) => c.status === "active" || c.status === "paused")
          .map((c) => (
            <div className="tr" key={c.id}>
              <div>
                <Link href={`/admin/clients/${c.id}`} className="rowbtn">
                  <b>{c.name}</b>
                </Link>
                <br />
                <span>{c.billingCycle}</span>
              </div>
              <span className="num">{fmtMoney(c.priceCents)}/mo</span>
            </div>
          ))}
      </section>
      <Toast />
    </>
  );
}
