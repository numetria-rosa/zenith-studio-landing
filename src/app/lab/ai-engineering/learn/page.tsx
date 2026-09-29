import { redirect } from "next/navigation";
import { LEARN_BASE } from "@/components/learn/nav";
import { getAllModules } from "@/lib/aie/content";
import { currentModuleNumber, getCompletedLessons } from "@/lib/aie/progress";
import { requireEnrollment } from "@/lib/require-enrollment";

// Placeholder until the derived Dashboard screen is built: resume where the student left off.
export default async function LearnHome() {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const [modules, done] = await Promise.all([getAllModules(), getCompletedLessons(userId)]);
  redirect(`${LEARN_BASE}/modules/${currentModuleNumber(modules, done)}`);
}
