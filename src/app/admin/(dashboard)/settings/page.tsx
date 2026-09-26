import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { HqTopbar } from "../HqTopbar";
import { Toast } from "../Toast";

export default async function HqSettingsPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const settings = await db.adminSetting.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });

  async function saveBooking(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    await db.adminSetting.upsert({ where: { id: "singleton" }, update: { bookingLink: String(formData.get("bookingLink") || "") }, create: { id: "singleton", bookingLink: String(formData.get("bookingLink") || "") } });
    revalidatePath("/admin/settings");
    redirect("/admin/settings?flash=" + encodeURIComponent("Saved"));
  }

  async function toggleNotify(formData: FormData): Promise<void> {
    "use server";
    await requireAdmin();
    const key = String(formData.get("key")) as "notifySetupDue" | "notifyTrialEnding" | "notifyNewRequest";
    const current = await db.adminSetting.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });
    await db.adminSetting.update({ where: { id: "singleton" }, data: { [key]: !current[key] } });
    revalidatePath("/admin/settings");
    redirect("/admin/settings");
  }

  const notifyRows: { key: "notifySetupDue" | "notifyTrialEnding" | "notifyNewRequest"; label: string; checked: boolean }[] = [
    { key: "notifySetupDue", label: "A setup is within 6 hours of its promised time", checked: settings.notifySetupDue },
    { key: "notifyTrialEnding", label: "A trial ends within 24 hours", checked: settings.notifyTrialEnding },
    { key: "notifyNewRequest", label: "Every new change request", checked: settings.notifyNewRequest },
  ];

  return (
    <>
      <HqTopbar title="Settings" subtitle="How Zenith HQ works for you." />
      <div className="sgrid">
        <section className="card sc">
          <span className="eyebrow">Booking</span>
          <form action={saveBooking} className="fld">
            <label htmlFor="bk">Booking link used on every landing page</label>
            <div className="in">
              <input id="bk" name="bookingLink" type="url" placeholder="https://cal.com/…" defaultValue={settings.bookingLink ?? ""} />
            </div>
            <small style={{ color: "var(--mist)" }}>Empty = buttons scroll to the booking section.</small>
            <button className="btn" type="submit" style={{ alignSelf: "flex-start", marginTop: 10 }}>
              Save
            </button>
          </form>
        </section>

        <section className="card sc">
          <span className="eyebrow">Notify me</span>
          {notifyRows.map((n) => (
            <form action={toggleNotify} className="tr" key={n.key}>
              <input type="hidden" name="key" value={n.key} />
              <b style={{ fontWeight: 400 }}>{n.label}</b>
              <button className="tog" type="submit" role="switch" aria-checked={n.checked} aria-label={n.label} />
            </form>
          ))}
        </section>

        <section className="card sc">
          <span className="eyebrow">Promises shown to clients</span>
          <div className="tr">
            <b>AI team setup</b>
            <span>within 24 hours</span>
          </div>
          <div className="tr">
            <b>Inbox Manager go-live</b>
            <span>within 24 hours</span>
          </div>
          <div className="tr">
            <b>Free testing</b>
            <span>72 hours after setup</span>
          </div>
        </section>

        <section className="card sc">
          <span className="eyebrow">Team</span>
          <div className="tr">
            <div>
              <b>{admin.user?.name || admin.user?.email}</b>
              <br />
              <span>Owner · full access</span>
            </div>
            <span className="pill p-ok">
              <i />
              You
            </span>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
            Inviting a teammate isn&apos;t built yet - Zenith HQ is single-owner (role:ADMIN) for now.
          </p>
        </section>
      </div>
      <Toast />
    </>
  );
}
