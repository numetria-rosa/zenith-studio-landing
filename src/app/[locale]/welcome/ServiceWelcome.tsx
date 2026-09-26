import consoleStyles from "@/app/services/dashboard/[clientId]/console.module.css";
import u from "@/app/services/dashboard/[clientId]/ui.module.css";
import s from "./welcome.module.css";
import { saveBusinessName } from "./actions";

/* Post-checkout welcome for service buyers, in the client console's own
   design system so the first screen after paying matches the dashboard
   they're about to open. Asks the business name once, up front; every
   agent's setup form is pre-filled from it afterwards. */
export function ServiceWelcome({
  projectId,
  firstName,
  email,
  password,
  planTitle,
  businessName,
}: {
  projectId: string;
  firstName: string;
  email: string;
  password: string | null;
  planTitle: string;
  businessName: string;
}) {
  return (
    <div className={`${consoleStyles.console} ${s.page}`}>
      <div className={`${u.card} ${s.card}`}>
        <span className={s.badge}>
          <span className={s.dot} />
          {planTitle} is active
        </span>
        <h1 className={s.title}>Welcome{firstName ? `, ${firstName}` : ""}.</h1>
        <p className={s.sub}>Your account is ready and you&apos;re signed in. One quick question, then your dashboard.</p>

        <form action={saveBusinessName} className={s.form}>
          <input type="hidden" name="projectId" value={projectId} />
          <label htmlFor="businessName" className={u.eyebrow}>
            What&apos;s your business called?
          </label>
          <input
            id="businessName"
            name="businessName"
            required
            maxLength={120}
            defaultValue={businessName}
            placeholder="e.g. Harlow Insurance Group"
            className={s.input}
            autoFocus
          />
          <p className={s.hint}>Your AI team uses it when it greets callers and replies to clients.</p>
          <button type="submit" className={`${u.btnPrimary} ${s.submit}`}>
            Continue to your dashboard
          </button>
        </form>

        {password && (
          <div className={s.password}>
            <span className={u.eyebrow}>Your password</span>
            <p className={s.passwordValue}>{password}</p>
            <p className={s.hint}>
              Use it with {email} to sign in next time. You can view or change it anytime from your profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
