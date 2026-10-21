"use server";

import { revalidatePath } from "next/cache";
import { confirmUpload } from "@/lib/document-chaser-db";

/** Called by the upload page once the browser has put a file in Blob storage. */
export async function confirmUploadAction(token: string, itemId: string, pathname: string, fileName: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await confirmUpload(String(token), String(itemId), String(pathname), String(fileName));
  if (result.ok) revalidatePath(`/upload/${token}`);
  return result;
}
