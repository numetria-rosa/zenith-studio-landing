import { notFound } from "next/navigation";
import { ModuleOverview } from "@/components/learn/ModuleOverview";
import { LEARN_BASE } from "@/components/learn/nav";
import { getModule } from "@/lib/aie/content";
import { getCompletedLessons } from "@/lib/aie/progress";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function ModuleOverviewPage({ params }: { params: Promise<{ module: string }> }) {
  const { module: moduleParam } = await params;
  const mod = await getModule(Number(moduleParam));
  if (!mod) notFound();

  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  return <ModuleOverview mod={mod} done={await getCompletedLessons(userId)} />;
}
