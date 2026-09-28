import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedAgency } from "@/lib/whatsapp-umrah/dashboard-data";
import { updateAgentSettingsAction } from "../actions";
import waStyles from "../waConsole.module.css";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "tr", label: "Turkish" },
  { value: "ur", label: "Urdu" },
];

export default async function SettingsPage({ params }: { params: Promise<{ agencyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { agencyId } = await params;
  const agency = await getOwnedAgency(agencyId, session.user.id);
  if (!agency) notFound();

  const s = agency.agentSettings;
  const enabledLanguages = new Set(s?.languagesEnabled ?? ["en", "ar", "tr", "ur"]);
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
          <p style={{ fontSize: 12, color: "var(--zc-dim)" }}>
            Business hours aren&apos;t configurable here yet - contact us to set your schedule, or leave this off and the agent replies 24/7.
          </p>
        </div>

        <div className={waStyles.card} style={{ marginTop: 20 }}>
          <div className={waStyles.formRow}>
            <label className={waStyles.label} htmlFor="autoResumeIdleMinutes">
              Auto-resume AI after a handoff, once idle for (minutes)
            </label>
            <input id="autoResumeIdleMinutes" name="autoResumeIdleMinutes" type="number" min="0" defaultValue={s?.autoResumeIdleMinutes ?? ""} className={waStyles.input} placeholder="Off by default" />
          </div>
        </div>

        <button type="submit" className={waStyles.badgeAi} style={{ marginTop: 20, padding: "10px 20px", fontSize: 14, border: "1px solid var(--zc-done)" }}>
          Save settings
        </button>
      </form>
    </div>
  );
}
