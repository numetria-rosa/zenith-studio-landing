import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getHqClients, fmtHours, SETUP_STEPS } from "@/lib/hq";
import { advanceSetup, convertTrial, extendTrial } from "@/lib/hq/actions";
import { HqTopbar } from "../HqTopbar";
import { ServiceTag } from "../ServiceTag";
import { Toast } from "../Toast";

export default async function HqOnboardingPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const clients = await getHqClients();
  const now = new Date();
  const setups = clients.filter((c) => c.status === "setup");
  const trials = clients.filter((c) => c.status === "trial");

  async function advanceAction(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    const id = String(formData.get("id"));
    await advanceSetup(id);
    revalidatePath("/admin/onboarding");
    redirect("/admin/onboarding");
  }

  async function convertAction(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    await convertTrial(String(formData.get("id")));
    revalidatePath("/admin/onboarding");
    redirect("/admin/onboarding");
  }

  async function extendAction(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    await extendTrial(String(formData.get("id")), 24);
    revalidatePath("/admin/onboarding");
    redirect("/admin/onboarding");
  }

  const columns = [0, 1, 2].map((stage) => ({
    label: SETUP_STEPS[stage],
    stage,
    items: setups.filter((c) => (c.setupStage ?? 0) === stage),
  }));

  return (
    <>
      <HqTopbar title="Onboarding" subtitle="Every setup against its promise, and every trial's clock." />
      <div className="kan">
        {columns.map((col) => (
          <div className="col" key={col.label}>
            <h3>
              {col.label}
              <span>{col.items.length}</span>
            </h3>
            {col.items.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Nothing here</p>}
            {col.items.map((c) => {
              const h = c.setupReadyBy ? Math.max(0, (c.setupReadyBy.getTime() - now.getTime()) / 3600_000) : c.slaHours;
              return (
                <div className="kc" key={c.id}>
                  <Link href={`/admin/clients/${c.id}`} className="rowbtn">
                    <b>{c.name}</b>
                  </Link>
                  <div className="sm">
                    <ServiceTag service={c.service} /> · ready by {c.setupReadyBy ? c.setupReadyBy.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "unscheduled"}
                  </div>
                  <div className={`sla${h <= 6 ? " hot" : ""}`}>
                    <i style={{ width: `${Math.max(4, 100 - (h / c.slaHours) * 100)}%` }} />
                  </div>
                  <div className="sm">
                    due in {fmtHours(h)} of {fmtHours(c.slaHours)}
                  </div>
                  <div className="row">
                    <form action={advanceAction} style={{ flex: 1 }}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="btn go" type="submit" style={{ width: "100%" }}>
                        {col.stage === 2 ? "Mark ready" : "Next step"}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div className="col">
          <h3>
            In free trial<span>{trials.length}</span>
          </h3>
          {trials.length === 0 && <p className="muted" style={{ fontSize: 13 }}>No trials running</p>}
          {trials.map((c) => {
            const h = c.trialEndsAt ? Math.max(0, (c.trialEndsAt.getTime() - now.getTime()) / 3600_000) : 0;
            return (
              <div className="kc" key={c.id}>
                <Link href={`/admin/clients/${c.id}`} className="rowbtn">
                  <b>{c.name}</b>
                </Link>
                <div className="sm">
                  <ServiceTag service={c.service} />
                </div>
                <div className="meter">
                  <i style={{ width: `${100 - (h / 72) * 100}%` }} />
                </div>
                <div className="sm">{fmtHours(h)} of 72h left</div>
                <div className="row">
                  <form action={convertAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="btn go" type="submit">
                      Convert
                    </button>
                  </form>
                  <form action={extendAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="btn" type="submit">
                      +24h
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Toast />
    </>
  );
}
