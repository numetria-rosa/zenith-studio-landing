import u from "./ui.module.css";
import s from "./onboarding.module.css";
import { saveOnboarding } from "./onboarding-actions";

/* First-visit popup for clients who bought directly (no proposal, so we
   don't know their business yet). Shown by the layout until a business
   name is saved; every agent setup form is pre-filled from it afterwards. */
export function OnboardingModal({
  projectId,
  planTitle,
  yourName,
  email,
  password,
}: {
  projectId: string;
  planTitle: string;
  yourName: string;
  email: string;
  password: string | null;
}) {
  return (
    <div className={s.backdrop}>
      <div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className={`${u.card} ${s.dialog}`}>
        <span className={s.badge}>
          <span className={s.dot} />
          {planTitle} is active
        </span>
        <h2 id="onboarding-title" className={s.title}>
          Welcome aboard. Tell us about you.
        </h2>
        <p className={s.sub}>Your AI team uses this when it greets callers and replies to your clients.</p>

        <form action={saveOnboarding} className={s.form}>
          <input type="hidden" name="projectId" value={projectId} />
          <label htmlFor="yourName" className={u.eyebrow}>
            Your name
          </label>
          <input id="yourName" name="yourName" required maxLength={120} defaultValue={yourName} placeholder="e.g. Dana Harlow" className={s.input} />
          <label htmlFor="businessName" className={`${u.eyebrow} ${s.gap}`}>
            Business name
          </label>
          <input
            id="businessName"
            name="businessName"
            required
            maxLength={120}
            placeholder="e.g. Harlow Insurance Group"
            className={s.input}
            autoFocus
          />
          <button type="submit" className={`${u.btnPrimary} ${s.submit}`}>
            Save and open my dashboard
          </button>
        </form>

        {password && (
          <div className={s.password}>
            <span className={u.eyebrow}>Your password</span>
            <p className={s.passwordValue}>{password}</p>
            <p className={s.hint}>Use it with {email} to sign in next time. You can change it anytime from your profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
