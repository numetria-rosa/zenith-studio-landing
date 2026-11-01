import { docHint, groupUploadItems } from "@/lib/document-chaser";

export type RowIn = { id: string; label: string; status: string; fileName: string | null; rejectReason: string | null; clientNote: string | null };
export type Slot = { id: string; fileName: string | null; accepted: boolean; rejectReason: string | null };
export type Doc = { id: string; num: string; title: string; hint: string | null; slots: Slot[]; skip: boolean; reason: string | null };

/** One Doc per requested document, one Slot per file (extra "(2)" rows folded under their parent). */
export function buildDocs(items: RowIn[]): Doc[] {
  return groupUploadItems(items).map(({ base, parent, slots }, i) => ({
    id: parent.id,
    num: String(i + 1).padStart(2, "0"),
    title: base,
    hint: docHint(base),
    skip: parent.status === "NOT_APPLICABLE",
    reason: parent.clientNote,
    slots: slots.map((s) => ({ id: s.id, fileName: s.status === "REQUESTED" || s.status === "NOT_APPLICABLE" ? null : s.fileName, accepted: s.status === "ACCEPTED", rejectReason: s.status === "REQUESTED" ? s.rejectReason : null })),
  }));
}

export const hasFile = (s: Slot) => s.fileName !== null;
export const needs = (d: Doc) => !d.skip && d.slots.some((s) => !hasFile(s));
export const partial = (d: Doc) => d.slots.some(hasFile);

/** Progress counts slots, plus one for each not-applicable document. */
export function stats(docs: Doc[]) {
  let total = 0;
  let done = 0;
  const segs: ("ok" | "skip" | "need")[] = [];
  for (const d of docs) {
    if (d.skip) {
      total++;
      done++;
      segs.push("skip");
      continue;
    }
    for (const s of d.slots) {
      total++;
      if (hasFile(s)) done++;
      segs.push(hasFile(s) ? "ok" : "need");
    }
  }
  return { total, done, left: total - done, pct: total ? Math.round((done * 100) / total) : 0, segs };
}
