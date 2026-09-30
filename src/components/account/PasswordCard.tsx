"use client";

import { useActionState } from "react";
import { type ActionResult, changePasswordAction } from "@/app/account/actions";
import { Icon } from "@/components/obsidian/Icon";

/** Shows the sign-in password (students get an auto-generated one at purchase) and lets them change it. */
export function PasswordCard({ email, current }: { email: string; current: string | null }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(changePasswordAction, null);
  return (
    <section id="password" aria-labelledby="pw" className="glass flex scroll-mt-8 flex-col gap-3.5 rounded-[26px] p-7">
      <div className="flex items-center gap-2.5">
        <Icon name="shield" size={18} color="#FFD27A" />
        <h2 id="pw" className="m-0 text-[22px] font-medium tracking-[-0.02em]">Sign-in password</h2>
      </div>
      {current ? (
        <p className="m-0 select-all break-all font-mono text-[17px] tracking-wide text-frost" aria-label="Your current password">{current}</p>
      ) : (
        <p className="m-0 text-[14.5px] text-mist">No password set yet. Set one below.</p>
      )}
      <p className="m-0 text-[13px] text-dim">Use this with {email} to sign in.</p>
      <form action={action} className="flex flex-col gap-3">
        <label htmlFor="pw-next" className="text-[13.5px] font-medium text-soft">New password</label>
        <input id="pw-next" name="next" type="text" required minLength={8} maxLength={200} autoComplete="new-password" placeholder="At least 8 characters" className="min-h-12 w-full rounded-[14px] border border-white/[0.14] bg-white/[0.04] px-3.5 text-[15px] text-frost placeholder:text-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan" />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className="min-h-11 rounded-full bg-frost px-[20px] text-[14.5px] font-medium text-void hover:bg-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">{pending ? "Updating…" : "Update password"}</button>
          <span role="status" aria-live="polite" className={`text-[13.5px] ${state && !state.ok ? "text-ember-text" : "text-mint-text"}`}>{state?.ok ? "Password updated." : state?.error}</span>
        </div>
      </form>
    </section>
  );
}
