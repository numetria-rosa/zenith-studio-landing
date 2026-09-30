import { DeleteAccount } from "@/components/account/DeleteAccount";
import { PageHeader } from "@/components/account/AccountShell";
import { NotificationToggles } from "@/components/account/NotificationToggles";
import { ProfileForm } from "@/components/account/ProfileForm";
import { Icon } from "@/components/obsidian/Icon";
import { initialsOf } from "@/lib/account/data";
import { loadPurchases } from "@/lib/account/purchases";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCompletedLessons } from "@/lib/aie/progress";

const MONO = "font-mono uppercase tracking-[0.14em]";
const glassBtn = "glass inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-[18px] text-[14px] font-medium text-frost no-underline hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";

function timezones(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
  return intl.supportedValuesOf?.("timeZone") ?? ["Europe/London", "UTC"];
}

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const [user, purchases, done] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    loadPurchases(userId),
    getCompletedLessons(userId),
  ]);
  const name = user.displayName || user.name || user.email;
  const since = user.createdAt.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const manageUrl = purchases.find((p) => p.manageUrl)?.manageUrl ?? null;

  return (
    <>
      <PageHeader eyebrow="Profile" title="Your account." subtitle="Profile details, purchases and notifications, in one place." />

      <section className="flex flex-col items-start gap-6 rounded-[30px] border border-transparent bg-[linear-gradient(135deg,#0D1622,#0E0F1D)_padding-box,linear-gradient(135deg,rgba(92,200,255,0.5),rgba(139,92,246,0.5))_border-box] shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] p-7 sm:flex-row sm:items-center lg:p-8">
        <span className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(92,200,255,0.35),rgba(139,92,246,0.35))] text-[28px] font-semibold">{initialsOf(name)}</span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <b className="text-[28px] font-medium tracking-[-0.03em]">{name}</b>
          <span className="text-[14.5px] text-mist">{user.email} · Member since {since}</span>
          <div className="flex flex-wrap gap-2">
            <span className={`${MONO} rounded-full border border-[rgba(199,176,255,0.4)] bg-[rgba(139,92,246,0.10)] px-3 py-[5px] text-[12px] text-violet-text`}>{purchases.length} {purchases.length === 1 ? "course" : "courses"}</span>
            <span className={`${MONO} rounded-full border border-[rgba(61,220,151,0.5)] bg-[rgba(61,220,151,0.10)] px-3 py-[5px] text-[12px] text-mint-text`}>{done.size} lessons done</span>
          </div>
        </div>
        <button type="button" disabled title="Photo upload isn't available yet" className={`${glassBtn} disabled:opacity-50`}><Icon name="pencil" size={15} /> Change photo</button>
      </section>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <section aria-labelledby="details" className="glass flex flex-col gap-5 rounded-[26px] p-7">
          <div className="flex flex-col gap-1">
            <h2 id="details" className="m-0 text-[22px] font-medium tracking-[-0.02em]">Profile details</h2>
            <span className="text-[14px] text-mist">Shown on your certificate and portfolio.</span>
          </div>
          <ProfileForm
            timezones={timezones()}
            values={{ name: user.name ?? "", displayName: user.displayName ?? "", email: user.email, timezone: user.timezone ?? "", githubUrl: user.githubUrl ?? "", linkedinUrl: user.linkedinUrl ?? "" }}
          />
        </section>
        <div className="flex flex-col gap-6">
          <section id="notifications" aria-labelledby="notif" className="glass scroll-mt-8 rounded-[26px] p-7">
            <h2 id="notif" className="m-0 text-[22px] font-medium tracking-[-0.02em]">Notifications</h2>
            <span className="text-[14px] text-mist">Emails from Zenith Studio.</span>
            <div className="mt-2">
              <NotificationToggles initial={{ productNews: user.notifyProductNews, weeklyRecap: user.notifyWeeklyRecap, offers: user.notifyOffers }} />
            </div>
          </section>
          <section aria-labelledby="delete" className="flex flex-col gap-4 rounded-[26px] border border-[rgba(255,92,122,0.30)] bg-[rgba(255,92,122,0.05)] p-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1.5">
              <h2 id="delete" className="m-0 text-[18px] font-medium tracking-[-0.01em]">Delete account</h2>
              <span className="text-[13.5px] leading-normal text-mist">Removes your profile and progress. Purchases stay on record for billing.</span>
            </div>
            <DeleteAccount email={user.email} />
          </section>
        </div>
      </div>

      <section id="purchases" aria-labelledby="purch" className="glass scroll-mt-8 rounded-[26px] p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="purch" className="m-0 text-[22px] font-medium tracking-[-0.02em]">Purchases</h2>
            <span className="text-[14px] text-mist">Every course you bought, with lifetime access.</span>
          </div>
          {manageUrl && <a href={manageUrl} target="_blank" rel="noreferrer" className={glassBtn}>Manage membership <Icon name="external" size={15} /></a>}
        </div>
        {purchases.length === 0 ? (
          <p className="m-0 pt-5 text-[14.5px] text-mist">Your purchases will show up here.</p>
        ) : (
          <table className="mt-5 w-full border-collapse text-left max-md:block">
            <thead className="max-md:hidden">
              <tr className={`${MONO} text-[11.5px] text-dim`}>
                <th scope="col" className="pb-3 font-normal">Course</th><th scope="col" className="pb-3 font-normal">Date</th>
                <th scope="col" className="pb-3 font-normal">Paid</th><th scope="col" className="pb-3"><span className="sr-only">Receipt</span></th>
              </tr>
            </thead>
            <tbody className="max-md:block">
              {purchases.map((p) => (
                <tr key={p.courseId} className="border-t border-white/[0.06] max-md:mb-3 max-md:flex max-md:flex-col max-md:gap-2 max-md:rounded-2xl max-md:border max-md:border-white/10 max-md:p-4">
                  <td className="py-4 max-md:p-0"><div className="flex flex-col gap-0.5"><b className="text-[15.5px] font-medium">{p.title}</b><span className="text-[13px] text-mist">{p.subtitle}</span></div></td>
                  <td className="py-4 text-[14.5px] text-soft max-md:p-0">{p.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="py-4 text-[14.5px] max-md:p-0">{p.paid ?? "—"}</td>
                  <td className="py-4 text-right max-md:p-0 max-md:text-left">
                    {p.manageUrl ? <a href={p.manageUrl} target="_blank" rel="noreferrer" className={glassBtn}><Icon name="receipt" size={15} /> Receipt</a> : <span className="text-[13px] text-dim">Receipt unavailable</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
