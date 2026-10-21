"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { MAX_UPLOAD_BYTES, UPLOAD_CONTENT_TYPES, uploadPathname } from "@/lib/document-chaser";
import { confirmUploadAction } from "./actions";

/* One document: pick a file (or take a photo on a phone), upload it straight to private storage, then
   tell the server it arrived. */
export function UploadButton({ token, clientId, itemId, label, replace }: { token: string; clientId: string; itemId: string; label: string; replace: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [state, setState] = useState<{ busy: boolean; progress: number; error: string | null }>({ busy: false, progress: 0, error: null });

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) return setState({ busy: false, progress: 0, error: "That file is over 20 MB. Please send a smaller copy." });
    setState({ busy: true, progress: 0, error: null });
    try {
      const pathname = uploadPathname(clientId, itemId, file.name);
      const blob = await upload(pathname, file, {
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

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <input ref={input} type="file" className="sr-only" accept={UPLOAD_CONTENT_TYPES.join(",") + ",.heic"} onChange={(e) => onPick(e.target.files?.[0])} aria-label={`Upload ${label}`} />
      <button
        type="button"
        disabled={state.busy}
        onClick={() => input.current?.click()}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-[14.5px] font-medium text-[#05060a] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5CC8FF] disabled:opacity-60"
      >
        {state.busy ? `Uploading ${state.progress}%` : replace ? "Upload again" : "Upload"}
      </button>
      {state.error && (
        <p role="alert" className="m-0 max-w-[260px] text-[13px] text-[#FF9BB0]">
          {state.error}
        </p>
      )}
    </div>
  );
}
