"use client";

import { ACCEPT, useUpload } from "./useUpload";
import { GLASS, Icon, MONO, P } from "./ui";

/* A slot that already has a file: the filename, its state, and Replace until the accountant accepts it. */
export function FileSlot({ token, clientId, itemId, fileName, accepted }: { token: string; clientId: string; itemId: string; fileName: string; accepted: boolean }) {
  const { input, state, send, pick } = useUpload(token, clientId, itemId);
  return (
    <div className="mt-[14px]">
      <div className="flex items-center gap-3 rounded-[14px] border border-[rgba(61,220,151,0.25)] bg-[rgba(61,220,151,0.06)] px-[14px] py-3">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[14px] bg-[#3DDC97]">
          <Icon d={P.check} size={15} stroke="#05060A" sw={2.6} />
        </span>
        <div className="min-w-0 flex-1">
          <div className={`${MONO} truncate text-[13px] leading-[17px] text-[#F5F6F8] lg:text-[12.5px]`}>{fileName}</div>
          <div className="mt-[3px] text-[13px] text-[#7FF0BD]">{state.busy ? `Uploading ${state.progress}%` : accepted ? "Accepted" : "Received, being checked"}</div>
        </div>
        {!accepted && (
          <>
            <input ref={input} type="file" className="sr-only" accept={ACCEPT} onChange={(e) => send(e.target.files?.[0])} aria-label={`Replace ${fileName}`} />
            <button type="button" onClick={pick} disabled={state.busy} className={`${GLASS} h-9 whitespace-nowrap rounded-full px-[14px] text-[13.5px] text-[#C9CCD4] disabled:opacity-60 lg:h-[34px] lg:px-[13px] lg:text-[13px]`}>
              Replace
            </button>
          </>
        )}
      </div>
      {state.error && (
        <p role="alert" className="m-0 mt-2 text-[13px] text-[#FF9BB0]">
          {state.error}
        </p>
      )}
    </div>
  );
}
