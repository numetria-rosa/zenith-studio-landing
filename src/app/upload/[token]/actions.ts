"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { checkUploadedDocument } from "@/lib/doc-check";
import { addAnotherOf, confirmUpload, markNotApplicable, undoNotApplicable } from "@/lib/document-chaser-db";

/** Called by the upload page once the browser has put a file in Blob storage. */
export async function confirmUploadAction(token: string, itemId: string, pathname: string, fileName: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await confirmUpload(String(token), String(itemId), String(pathname), String(fileName));
  if (result.ok) {
    revalidatePath(`/upload/${token}`);
    // The AI check runs after the client already has their answer (nextjs.org/docs/app/api-reference/functions/after).
    after(() => checkUploadedDocument(String(itemId)));
  }
  return result;
}

/** "I don't have this" (with an optional note), and its undo. */
export async function notApplicableAction(token: string, itemId: string, note: string, undo: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = undo ? await undoNotApplicable(String(token), String(itemId)) : await markNotApplicable(String(token), String(itemId), String(note ?? ""));
  if (result.ok) revalidatePath(`/upload/${token}`);
  return result;
}

/** "I have more than one": another slot for the same document. */
export async function addAnotherAction(token: string, itemId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await addAnotherOf(String(token), String(itemId));
  if (result.ok) revalidatePath(`/upload/${token}`);
  return result;
}
