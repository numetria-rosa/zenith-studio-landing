import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/learn/ModuleHeader";
import { LEARN_BASE } from "@/components/learn/nav";
import { getModule } from "@/lib/aie/content";
import { getCompletedLessons, nextLesson } from "@/lib/aie/progress";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function ModuleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ module: string }>;
}) {
  const { module: moduleParam } = await params;
  const mod = await getModule(Number(moduleParam));
  if (!mod) notFound();

  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const done = await getCompletedLessons(userId);
  const lesson = mod.lessons.length ? nextLesson(mod, done) : null;

  return (
    <>
      <ModuleHeader mod={mod} lessonHref={lesson ? `${LEARN_BASE}/modules/${mod.number}/lessons/${lesson.number}` : null} />
      {children}
    </>
  );
}
