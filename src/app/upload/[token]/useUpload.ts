"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { MAX_UPLOAD_BYTES, uploadPathname } from "@/lib/document-chaser";
import { confirmUploadAction } from "./actions";

/* Sends one file for one slot straight to private storage, then tells the server it arrived. */
export function useUpload(token: string, clientId: string, itemId: string) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
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
  return { input, state, send, pick: () => input.current?.click() };
}

export const ACCEPT = "image/*,application/pdf,.xlsx,.xls,.csv";
