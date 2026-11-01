"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { MAX_UPLOAD_BYTES, UPLOAD_CONTENT_TYPES, uploadPathname } from "@/lib/document-chaser";
import { confirmUploadAction } from "./actions";

/* One document: drop a file, choose one, or take a photo on a phone. It goes straight to private storage,
   then the server is told it arrived. Once a file is in, the zone becomes a chip with Replace. */
export function DropZone({
  token,
  clientId,
  itemId,
  label,
  fileName,
  accepted,
}: {
  token: string;
  clientId: string;
  itemId: string;
  label: string;
  fileName: string | null;
  accepted: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [over, setOver] = useState(false);
  const [state, setState] = useState<{ busy: boolean; progress: number; error: string | null }>({ busy: false, progress: 0, error: null });

  async function send(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) return setState({ busy: false, progress: 0, error: "That file is over 20 MB. Please send a smaller copy." });
    setState({ busy: true, progress: 0, error: null });
    try {
      const blob = await upload(uploadPathname(clientId, itemId, file.name), file, {
        access: "private",
        handleUploadUrl: "/api/doc-chaser/upload",
        clientPayload: JSON.stringify({ token, itemId }),
        multipart: file.size > 5 * 1024 * 1024,
        onUploadProgress: (p) => setState((s) => ({ ...s, progress: Math.round(p.percentage) })),
      });
      const r = await confirmUploadAction(token, itemId, blob.pathname, file.name);
      if (!r.ok) throw new Error(r.error);
      setState({ busy: false, progress: 100, error: null });
      router.refresh();
    } catch (err) {
      // Storage errors are technical ("Vercel Blob: ..."); our own messages from confirmUpload are written for clients.
      const msg = err instanceof Error ? err.message : "";
      setState({ busy: false, progress: 0, error: msg && !/blob|token|fetch/i.test(msg) ? msg : "The upload didn't go through. Please try again in a minute, or reply to the email you got and we'll help." });
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  const pick = () => input.current?.click();
  const btn = "inline-flex min-h-9 items-center rounded-full border border-white/20 px-4 text-[13px] font-medium text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5CC8FF] disabled:opacity-50";

  return (
    <div className="flex flex-col gap-2">
      <input ref={input} type="file" className="sr-only" accept={UPLOAD_CONTENT_TYPES.join(",") + ",.heic"} onChange={(e) => send(e.target.files?.[0])} aria-label={`Upload ${label}`} />
      {fileName ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#3DDC97]/30 bg-[#3DDC97]/[0.07] p-3">
          <span className="grid size-8 flex-none place-items-center rounded-full bg-[#3DDC97]/20 text-[#7FF0BD]" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[14px] font-medium">{fileName}</span>
            <span className="text-[12.5px] text-[#7FF0BD]">{state.busy ? `Uploading ${state.progress}%` : accepted ? "Accepted" : "Received, being checked"}</span>
          </span>
          {!accepted && (
            <button type="button" className={btn} disabled={state.busy} onClick={pick}>
              Replace
            </button>
          )}
        </div>
      ) : (
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
          className={`flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-5 text-center transition-colors ${over ? "border-[#5CC8FF] bg-[#5CC8FF]/10" : "border-white/20 bg-white/[0.02]"}`}
        >
          <p className="m-0 text-[13.5px] text-white/60">{state.busy ? `Uploading ${state.progress}%` : "Drag a file here, or"}</p>
          <button type="button" className={btn} disabled={state.busy} onClick={pick}>
            Choose file
          </button>
          <p className="m-0 text-[12px] text-white/40">PDF, photo or sheet</p>
        </div>
      )}
      {state.error && (
        <p role="alert" className="m-0 text-[13px] text-[#FF9BB0]">
          {state.error}
        </p>
      )}
    </div>
  );
}
