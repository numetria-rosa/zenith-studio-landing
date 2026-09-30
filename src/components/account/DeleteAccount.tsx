"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, useTransition } from "react";
import { deleteAccountAction } from "@/app/account/actions";

export function DeleteAccount({ email }: { email: string }) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const matches = typed.trim().toLowerCase() === email.toLowerCase();
  return (
    <Dialog.Root onOpenChange={() => { setTyped(""); setError(null); }}>
      <Dialog.Trigger className="min-h-11 shrink-0 self-start rounded-full border border-[rgba(255,92,122,0.5)] px-5 text-[14.5px] font-medium text-ember-text hover:bg-[rgba(255,92,122,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan">
        Delete account
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-3xl border border-white/[0.14] bg-[#0A0B10] p-7 font-sans text-frost [line-height:normal]">
          <Dialog.Title className="m-0 text-[22px] font-medium tracking-[-0.02em]">Delete your account?</Dialog.Title>
          <Dialog.Description className="m-0 text-[14.5px] leading-[1.6] text-mist">
            This removes your profile and all your progress and can&apos;t be undone. Purchases stay on record for billing. Type <b className="text-frost">{email}</b> to confirm.
          </Dialog.Description>
          <label htmlFor="del-email" className="sr-only">Type your email to confirm</label>
          <input
            id="del-email" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" placeholder={email}
            className="min-h-12 rounded-[14px] border border-white/[0.14] bg-white/[0.04] px-3.5 text-[15px] text-frost placeholder:text-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          />
          {error && <p role="alert" className="m-0 text-[13.5px] text-ember-text">{error}</p>}
          <div className="flex justify-end gap-3">
            <Dialog.Close className="glass min-h-11 rounded-full px-5 text-[14.5px] font-medium focus-visible:outline-2 focus-visible:outline-cyan">Cancel</Dialog.Close>
            <button
              type="button" disabled={!matches || pending}
              onClick={() => start(async () => {
                const r = await deleteAccountAction(typed).catch(() => ({ ok: false as const, error: "Something went wrong. Try again." }));
                if (r && !r.ok) setError(r.error);
              })}
              className="min-h-11 rounded-full bg-ember px-5 text-[14.5px] font-medium text-void disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
            >
              {pending ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
