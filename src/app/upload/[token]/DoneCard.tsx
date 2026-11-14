"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notApplicableAction } from "./actions";
import { ACCEPT, useUpload } from "./useUpload";
import { GLASS, Icon, MONO, P } from "./ui";
import type { Doc, Slot } from "./model";

/* One sent file: its name, and Replace until the accountant accepts it. */
function DoneFile({ token, clientId, slot }: { token: string; clientId: string; slot: Slot }) {
  const { input, state, send, pick } = useUpload(token, clientId, slot.id);
  return (
    <div className="mt-[3px] flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className={`${MONO} min-w-0 truncate text-[12.5px] text-[#7FF0BD] lg:text-[12px]`}>{state.busy ? `Uploading ${state.progress}%` : slot.fileName}</span>
      {slot.accepted ? (
        <span className="text-[12.5px] text-[#7D8392]">Accepted</span>
      ) : (
        <>
          <input ref={input} type="file" className="sr-only" accept={ACCEPT} onChange={(e) => send(e.target.files?.[0])} aria-label={`Replace ${slot.fileName}`} />
          <button type="button" onClick={pick} disabled={state.busy} className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] text-[#5CC8FF] underline underline-offset-2 disabled:opacity-60">
            Replace
          </button>
        </>
      )}
      {state.error && (
        <p role="alert" className="m-0 w-full text-[13px] text-[#FF9BB0]">
          {state.error}
        </p>
      )}
    </div>
  );
}

/* Everything finished: sent documents (with their filenames and Replace) and ones the client said they don't
   have, each with "I do have it" to undo. Fills the empty last grid cell, or spans both columns. */
export function DoneCard({ token, clientId, docs, span }: { token: string; clientId: string; docs: Doc[]; span: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const undo = (id: string) =>
    start(async () => {
      const r = await notApplicableAction(token, id, "", true);
      if (!r.ok) return setError(r.error);
      setError(null);
      router.refresh();
    });

  return (
    <section className={`${span ? "col-span-full" : ""} max-lg:mt-10 lg:rounded-[22px] lg:border lg:border-[rgba(255,255,255,0.07)] lg:bg-[rgba(255,255,255,0.02)] lg:px-[22px] lg:pb-2 lg:pt-[22px]`}>
      <div className="mb-2 flex items-center gap-[10px] max-lg:mb-[14px] max-lg:gap-3">
        <span className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[#7D8392] lg:text-[#7FF0BD]`}>Done</span>
        <span className={`${MONO} text-[12px] text-[#7D8392]`}>{docs.length}</span>
        <span className="h-px flex-1 bg-[rgba(255,255,255,0.07)] lg:hidden" />
      </div>
      <div className="flex flex-col gap-[10px] lg:gap-0">
        {docs.map((d) => (
          <div key={d.id} className="flex items-center gap-[14px] rounded-[18px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] px-[18px] py-4 lg:gap-3 lg:rounded-none lg:border-0 lg:border-t lg:bg-transparent lg:px-0 lg:py-[14px]">
            {d.skip ? (
              <span className="box-border flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full border border-[rgba(255,255,255,0.18)] lg:h-7 lg:w-7">
                <Icon d={P.slash} size={15} stroke="#7D8392" />
              </span>
            ) : (
              <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[#3DDC97] lg:h-7 lg:w-7">
                <Icon d={P.check} size={15} stroke="#05060A" sw={2.6} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[15.5px] text-[#C9CCD4] lg:truncate lg:text-[14.5px]">{d.title}</div>
              {d.skip ? (
                <div className="mt-[3px] text-[13.5px] text-[#7D8392] lg:truncate lg:text-[13px]">Not applicable &middot; {d.reason ? `“${d.reason}”` : "No reason given"}</div>
              ) : (
                d.slots.filter((s) => s.fileName).map((s) => <DoneFile key={s.id} token={token} clientId={clientId} slot={s} />)
              )}
            </div>
            {d.skip && (
              <button type="button" disabled={busy} onClick={() => undo(d.id)} className={`${GLASS} inline-flex h-9 items-center gap-[7px] whitespace-nowrap rounded-full px-[14px] text-[13.5px] text-[#C9CCD4] disabled:opacity-60 lg:h-[34px] lg:px-3 lg:text-[13px]`}>
                <Icon d={P.undo} size={14} stroke="#C9CCD4" />I do have it
              </button>
            )}
          </div>
        ))}
        {error && (
          <p role="alert" className="m-0 py-2 text-[13px] text-[#FF9BB0]">
            {error}
          </p>
        )}
        {docs.some((d) => !d.skip && d.slots.some((s) => s.fileName && !s.accepted)) && (
          <div className="hidden items-center gap-[10px] border-t border-[rgba(255,255,255,0.06)] pb-3 pt-[14px] text-[13.5px] text-[#7D8392] lg:flex">
            <Icon d={P.file} stroke="#7D8392" />
            Sent something by mistake? Use Replace, or reply to the email.
          </div>
        )}
      </div>
    </section>
  );
}
