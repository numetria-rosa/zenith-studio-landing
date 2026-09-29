import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { updateAgentSettingsAction, toggleOverageEnabledAction, cancelSubscriptionAction } from "../actions";
import { OverageCheckout } from "./OverageCheckout";
import { CancelPlanButton } from "@/app/services/dashboard/[clientId]/CancelPlanButton";
import type { BusinessHours } from "@/lib/whatsapp-umrah/hours";
import waStyles from "../waConsole.module.css";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "tr", label: "Turkish" },
  { value: "ur", label: "Urdu" },
];

const DAYS: { key: keyof BusinessHours; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export default async function SettingsPage({ params }: { params: Promise<{ agencyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const s = agency.agentSettings;
  const enabledLanguages = new Set(s?.languagesEnabled ?? ["en", "ar", "tr", "ur"]);
  const businessHours = (s?.businessHours ?? null) as BusinessHours | null;
  const action = updateAgentSettingsAction.bind(null, agencyId);

  return (
    <div>
      <h1 className={waStyles.pageTitle}>Settings</h1>
      <p className={waStyles.pageDesc}>How your agent sounds, which languages it replies in, and what happens outside your hours.</p>

      <form action={action}>
        <div className={waStyles.grid2}>
          <div className={waStyles.card}>
            <div className={waStyles.formRow}>
              <label className={waStyles.label} htmlFor="agentName">
                Agent name
              </label>
              <input id="agentName" name="agentName" defaultValue={s?.agentName ?? "Assistant"} className={waStyles.input} />
            </div>
            <div className={waStyles.formRow}>
              <label className={waStyles.label} htmlFor="tone">
                Tone
              </label>
              <select id="tone" name="tone" defaultValue={s?.tone ?? "WARM"} className={waStyles.select}>
                <option value="WARM">Warm</option>
                <option value="FORMAL">Formal</option>
              </select>
            </div>
            <div className={waStyles.formRow}>
              <label className={waStyles.label} htmlFor="signOff">
                Sign-off (optional)
              </label>
              <input id="signOff" name="signOff" defaultValue={s?.signOff ?? ""} className={waStyles.input} placeholder="e.g. - The Harlow Travel team" />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <input type="checkbox" name="emojiEnabled" defaultChecked={s?.emojiEnabled ?? true} />
              Allow emoji in replies
            </label>
          </div>

          <div className={waStyles.card}>
            <div className={waStyles.label} style={{ marginBottom: 10 }}>
              Languages your agent replies in
            </div>
            {LANGUAGES.map((l) => (
              <label key={l.value} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 8 }}>
                <input type="checkbox" name="languages" value={l.value} defaultChecked={enabledLanguages.has(l.value)} />
                {l.label}
              </label>
            ))}
          </div>
        </div>

        <div className={waStyles.card} style={{ marginTop: 20 }}>
          <div className={waStyles.formRow}>
            <label className={waStyles.label} htmlFor="awayMode">
              Outside your business hours
            </label>
            <select id="awayMode" name="awayMode" defaultValue={s?.awayMode ?? "AI_REPLIES"} className={waStyles.select}>
              <option value="AI_REPLIES">Keep answering (recommended)</option>
              <option value="AWAY_MESSAGE_ONLY">Send an away message only</option>
            </select>
          </div>
          <div className={waStyles.formRow}>
            <label className={waStyles.label} htmlFor="awayMessage">
              Away message
            </label>
            <input id="awayMessage" name="awayMessage" defaultValue={s?.awayMessage ?? ""} className={waStyles.input} placeholder="We're closed right now, back within office hours." />
          </div>
          <div className={waStyles.label} style={{ marginTop: 16, marginBottom: 10 }}>
            Business hours
          </div>
          <p style={{ fontSize: 12, color: "var(--zc-dim)", marginBottom: 12 }}>
            Check a day and set its hours to mark it open. Leave every day unchecked to stay open 24/7 (the default) - once at least one day is checked, any day left unchecked counts as closed.
          </p>
          {DAYS.map((day) => {
            const today = businessHours?.[day.key];
            return (
              <div key={day.key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, fontSize: 14 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, width: 130, flexShrink: 0 }}>
                  <input type="checkbox" name={`hours_${day.key}_open`} defaultChecked={!!today} />
                  {day.label}
                </label>
                <input type="time" name={`hours_${day.key}_start`} defaultValue={today?.open ?? "09:00"} className={waStyles.input} style={{ maxWidth: 120 }} />
                <span style={{ color: "var(--zc-muted)" }}>to</span>
                <input type="time" name={`hours_${day.key}_end`} defaultValue={today?.close ?? "17:00"} className={waStyles.input} style={{ maxWidth: 120 }} />
              </div>
            );
          })}
        </div>

        <div className={waStyles.card} style={{ marginTop: 20 }}>
          <div className={waStyles.formRow}>
            <label className={waStyles.label} htmlFor="autoResumeIdleMinutes">
              Auto-resume AI after a handoff, once idle for (minutes)
            </label>
            <input id="autoResumeIdleMinutes" name="autoResumeIdleMinutes" type="number" min="0" defaultValue={s?.autoResumeIdleMinutes ?? ""} className={waStyles.input} placeholder="Off by default" />
          </div>
        </div>

        <div className={waStyles.card} style={{ marginTop: 20 }}>
          <div className={waStyles.formRow}>
            <label className={waStyles.label} htmlFor="retentionMonths">
              Delete customer data after (months)
            </label>
            <input id="retentionMonths" name="retentionMonths" type="number" min="1" defaultValue={s?.retentionMonths ?? 12} className={waStyles.input} />
          </div>
          <p style={{ fontSize: 12, color: "var(--zc-dim)" }}>
            UK GDPR retention setting. A contact with no activity for this long is permanently deleted, on the 1st of each month.
          </p>
        </div>

        <button type="submit" className={waStyles.badgeAi} style={{ marginTop: 20, padding: "10px 20px", fontSize: 14, border: "1px solid var(--zc-done)" }}>
          Save settings
        </button>
      </form>

      <div className={waStyles.card} style={{ marginTop: 20 }}>
        <div className={waStyles.label} style={{ marginBottom: 6 }}>
          Extra replies add-on
        </div>
        <p style={{ fontSize: 13, color: "var(--zc-muted)", marginBottom: 12 }}>
          Off by default. Turn it on to buy £5 top-up packs (1,000 more AI replies each) whenever you get close to your
          plan&apos;s monthly cap, instead of replies stopping until next month.
        </p>
        <form
          action={toggleOverageEnabledAction.bind(null, agencyId)}
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: s?.overageEnabled ? 16 : 0 }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input type="checkbox" name="overageEnabled" defaultChecked={s?.overageEnabled ?? false} />
            Allow buying extra reply packs
          </label>
          <button type="submit" style={{ fontSize: 13 }}>
            Save
          </button>
        </form>
        {s?.overageEnabled ? <OverageCheckout agencyId={agencyId} /> : null}
      </div>

      <div className={waStyles.card} style={{ marginTop: 20 }}>
        <div className={waStyles.label} style={{ marginBottom: 6 }}>
          Compliance
        </div>
        <p style={{ fontSize: 13, color: "var(--zc-muted)" }}>
          <a href="/whatsapp-umrah/dpa" target="_blank" rel="noopener noreferrer" style={{ color: "var(--zc-run-text)" }}>
            Data Processing Agreement
          </a>{" "}
          - includes ready-to-use WhatsApp opt-in wording for your own customers.
        </p>
      </div>

      {agency.subscription?.whopMembershipId && agency.subscription.status === "ACTIVE" && (
        <div className={waStyles.card} style={{ marginTop: 20 }}>
          <div className={waStyles.label} style={{ marginBottom: 6 }}>
            Billing
          </div>
          <p style={{ fontSize: 13, color: "var(--zc-muted)", marginBottom: 12 }}>
            {agency.subscription.plan === "STARTER" ? "Starter" : agency.subscription.plan}
            {agency.subscription.foundingOffer ? " - Founding offer" : ""}, billed monthly via Whop.
          </p>
          <CancelPlanButton action={cancelSubscriptionAction.bind(null, agencyId)} />
        </div>
      )}
    </div>
  );
}
