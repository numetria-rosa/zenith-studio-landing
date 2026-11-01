"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeSlotAction } from "./actions";
import { ACCEPT, useUpload } from "./useUpload";
import { FROST, Icon, MONO, P } from "./ui";

/* An empty file slot. Desktop: drop a file or Choose file. Phone: one full-width Upload button (the file
   picker offers the camera). Extra slots get an X to take them away again. */
export function Dropzone({ token, clientId, itemId, label, canRemove }: { token: string; clientId: string; itemId: string; label: string; canRemove: boolean }) {
  const { input, state, send, pick } = useUpload(token, clientId, itemId);
  const router = useRouter();
  const [over, setOver] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function remove() {
    const r = await removeSlotAction(token, itemId);
    if (r.ok) router.refresh();
    else setRemoveError(r.error);
  }
  const x = canRemove && (
    <button type="button" onClick={remove} aria-label="Remove this extra file" className="flex border-0 bg-transparent p-2 text-[#7D8392] hover:text-[#F5F6F8]">
      <Icon d={P.x} size={15} />
    </button>
  );
  const error = state.error ?? removeError;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        send(e.dataTransfer.files?.[0]);
      }}
      className={`relative mt-[14px] flex flex-col rounded-[16px] border border-dashed p-4 lg:items-center lg:rounded-[18px] lg:px-[18px] lg:pb-[18px] lg:pt-[22px] lg:text-center ${over ? "border-[#5CC8FF] bg-[rgba(92,200,255,0.08)]" : "border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.015)]"}`}
    >
      <input ref={input} type="file" className="sr-only" accept={ACCEPT} onChange={(e) => send(e.target.files?.[0])} aria-label={`Upload ${label}`} />
      <div className={`${MONO} flex items-center justify-between text-[11.5px] uppercase tracking-[0.06em] text-[#7D8392] lg:hidden`}>
        <span>{label}</span>
        {x}
      </div>
      <span className="absolute right-2 top-2 hidden lg:flex">{x}</span>
      <span className="hidden h-[44px] w-[44px] items-center justify-center rounded-[13px] border border-[rgba(92,200,255,0.28)] bg-[rgba(92,200,255,0.08)] lg:flex">
        <Icon d={P.upload} size={19} stroke="#9BDDFF" />
      </span>
      <div className="mt-3 hidden text-[15px] leading-[19px] text-[#C9CCD4] lg:block">{state.busy ? `Uploading ${state.progress}%` : "Drag a file here, or"}</div>
      <button type="button" onClick={pick} disabled={state.busy} className={`${FROST} mt-3 hidden h-11 gap-[9px] px-[22px] text-[14.5px] lg:inline-flex`}>
        Choose file
      </button>
      <button type="button" onClick={pick} disabled={state.busy} className={`${FROST} mt-3 inline-flex h-[46px] w-full gap-[9px] px-[22px] text-[15px] lg:hidden`}>
        <Icon d={P.upload} size={17} stroke="#05060A" sw={2} />
        {state.busy ? `Uploading ${state.progress}%` : "Upload"}
      </button>
      <div className={`${MONO} mt-3 hidden text-[11.5px] tracking-[0.04em] text-[#7D8392] lg:block`}>{label} &middot; PDF, photo or sheet</div>
      <div className="mt-[10px] text-center text-[13px] text-[#7D8392] lg:hidden">Take a photo or choose a file</div>
      {error && (
        <p role="alert" className="m-0 mt-3 text-[13px] text-[#FF9BB0]">
          {error}
        </p>
      )}
    </div>
  );
}
