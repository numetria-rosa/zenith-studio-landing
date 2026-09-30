"use client";

import { useActionState } from "react";
import { type ActionResult, saveProfileAction } from "@/app/account/actions";
import { Icon, type IconName } from "@/components/obsidian/Icon";

const FIELD =
  "min-h-12 w-full rounded-[14px] border border-white/[0.14] bg-white/[0.04] px-3.5 text-[15px] text-frost placeholder:text-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";
const LABEL = "text-[13.5px] font-medium text-soft";
const HINT = "text-[12.5px] text-dim";

export type ProfileValues = { name: string; displayName: string; email: string; timezone: string; githubUrl: string; linkedinUrl: string };

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={LABEL}>{label}</label>
      {children}
      {hint && <span className={HINT}>{hint}</span>}
    </div>
  );
}

function IconInput({ icon, className = "", ...props }: { icon: IconName } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"><Icon name={icon} size={17} color="#7D8392" /></span>
      <input {...props} className={`${FIELD} pl-11 ${className}`} />
    </div>
  );
}

export function ProfileForm({ values, timezones }: { values: ProfileValues; timezones: string[] }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveProfileAction, null);
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="p-name" label="Full name"><IconInput icon="user" id="p-name" name="name" required maxLength={80} defaultValue={values.name} /></Field>
        <Field id="p-display" label="Display name"><input id="p-display" name="displayName" maxLength={40} defaultValue={values.displayName} placeholder="How your name appears" className={FIELD} /></Field>
        <Field id="p-email" label="Email" hint="Linked to your purchase account.">
          <IconInput icon="mail" id="p-email" value={values.email} readOnly aria-readonly className="border-white/[0.08] bg-white/[0.02] text-mist" />
        </Field>
        <Field id="p-tz" label="Timezone">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"><Icon name="globe" size={17} color="#7D8392" /></span>
            <select id="p-tz" name="timezone" defaultValue={values.timezone} className={`${FIELD} appearance-none pl-11 pr-10`}>
              <option value="">Europe/London (default)</option>
              {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"><Icon name="chevron" size={16} color="#7D8392" /></span>
          </div>
        </Field>
        <Field id="p-gh" label="GitHub" hint="Used for project submissions.">
          <IconInput icon="link" id="p-gh" name="githubUrl" defaultValue={values.githubUrl} placeholder="github.com/yourname" maxLength={200} />
        </Field>
        <Field id="p-li" label="LinkedIn">
          <IconInput icon="link" id="p-li" name="linkedinUrl" defaultValue={values.linkedinUrl} placeholder="linkedin.com/in/yourname" maxLength={200} />
        </Field>
      </div>
      <div className="flex items-center justify-end gap-3">
        <span role="status" aria-live="polite" className={`mr-auto text-[13.5px] ${state && !state.ok ? "text-ember-text" : "text-mint-text"}`}>
          {state?.ok ? "Saved." : state?.error}
        </span>
        <button type="reset" className="glass min-h-12 rounded-full px-[22px] text-[15px] font-medium text-frost hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">Cancel</button>
        <button type="submit" disabled={pending} className="min-h-[46px] rounded-full bg-frost px-[22px] text-[15px] font-medium text-void hover:bg-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
