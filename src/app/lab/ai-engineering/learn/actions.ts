"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LEARN_BASE } from "@/components/learn/nav";
import { getModule } from "@/lib/aie/content";
import { markLessonComplete } from "@/lib/aie/progress";
import { requireEnrollment } from "@/lib/require-enrollment";

/** Marks a lesson done and moves on. `next` must stay inside the course app. */
export async function completeLessonAction(form: FormData): Promise<void> {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const lessonId = String(form.get("lessonId") ?? "");
  const next = String(form.get("next") ?? "");
  const mod = /^(\d+)\.\d+$/.test(lessonId) ? await getModule(Number(lessonId.split(".")[0])) : null;
  if (!mod?.lessons.some((l) => l.number === lessonId)) throw new Error("Unknown lesson");
  await markLessonComplete(userId, lessonId);
  revalidatePath(LEARN_BASE, "layout");
  redirect(next.startsWith(`${LEARN_BASE}/`) ? next : LEARN_BASE);
}
