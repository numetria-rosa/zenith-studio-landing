"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addAnotherAction, notApplicableAction } from "./actions";
import { Dropzone } from "./Dropzone";
import { FileSlot } from "./FileSlot";
import { FROST, GHOST, GLASS, Icon, MONO, P } from "./ui";
import type { Doc } from "./model";

/* One requested document: title and hint, a slot per file, then "Add another file" on the left and
   "I don't have this" on the right. "I don't have this" opens an inline box asking why (optional). */
export function DocCard({ token, clientId, firm, doc }: { token: string; clientId: string; firm: string; doc: Doc }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [why, setWhy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return setError(r.error);
      setError(null);
      setAsking(false);
      router.refresh();
    });
  const multi = doc.slots.length > 1;
  const rejected = doc.slots.find((s) => s.rejectReason)?.rejectReason;

  return (
    <article className="flex flex-col rounded-[22px] border border-[rgba(255,255,255,0.10)] bg-[#0B0C12] p-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:p-[22px]">
      <div className="flex items-baseline gap-3">
        <span className={`${MONO} hidden text-[12.5px] text-[#5CC8FF] lg:inline`}>{doc.num}</span>
        <h3 className="m-0 text-[17.5px] font-semibold leading-[1.35] tracking-[-0.01em] lg:text-[17px]">{doc.title}</h3>
      </div>
      {doc.hint && <div className="mt-1 text-[14px] text-[#A9AEBA] lg:mt-[5px]">{doc.hint}</div>}
      {rejected && <div className="mt-[5px] text-[14px] text-[#FF9BB0]">Please send again: {rejected}</div>}
      <div className="flex flex-1 flex-col">
        {doc.slots.map((s, k) =>
          s.fileName ? (
            <FileSlot key={s.id} token={token} clientId={clientId} itemId={s.id} fileName={s.fileName} accepted={s.accepted} />
          ) : (
            <Dropzone key={s.id} token={token} clientId={clientId} itemId={s.id} label={multi ? `File ${k + 1} of ${doc.slots.length}` : "Your file"} canRemove={multi && k > 0} />
          ),
        )}
        {asking && (
          <div className={`${GLASS} mt-4 rounded-[16px] p-4 lg:mt-[14px]`}>
            <label htmlFor={`why-${doc.id}`} className="block text-[14px] text-[#C9CCD4]">
              No problem. Tell {firm} why <span className="text-[#7D8392]">(optional)</span>
            </label>
            <input
              id={`why-${doc.id}`}
              type="text"
              value={why}
              maxLength={300}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="e.g. I sold this property in March"
              className="mt-[10px] box-border h-[46px] w-full rounded-[12px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-[14px] text-[15px] text-[#F5F6F8] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5CC8FF] lg:h-11 lg:text-[14.5px]"
            />
            <div className="mt-3 flex justify-end gap-[10px]">
              <button type="button" onClick={() => setAsking(false)} className={`${GLASS} h-10 rounded-full px-4 text-[14px] text-[#C9CCD4] lg:h-[38px]`}>
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={() => run(() => notApplicableAction(token, doc.id, why, false))} className={`${FROST} inline-flex h-10 px-[18px] text-[14px] lg:h-[38px]`}>
                I don&apos;t have it
              </button>
            </div>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="m-0 mt-3 text-[13px] text-[#FF9BB0]">
          {error}
        </p>
      )}
      {!asking && (
        <div className="-mx-2 -mb-[6px] mt-3 flex flex-wrap justify-between gap-1 max-lg:mx-0 max-lg:ml-[-12px] max-lg:justify-start">
          <button type="button" disabled={busy} onClick={() => run(() => addAnotherAction(token, doc.slots[0].id))} className={GHOST}>
            <Icon d={P.plus} />
            Add another file
          </button>
          <button type="button" onClick={() => setAsking(true)} className={GHOST}>
            <Icon d={P.slash} />
            I don&apos;t have this
          </button>
        </div>
      )}
    </article>
  );
}
