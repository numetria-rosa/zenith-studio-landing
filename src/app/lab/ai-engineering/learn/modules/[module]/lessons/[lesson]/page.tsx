import { notFound } from "next/navigation";
import { LessonView } from "@/components/learn/lesson/LessonView";
import { LEARN_BASE } from "@/components/learn/nav";
import { getFurtherReadingMdx, getInteractiveData, getLessonMdx, getModule } from "@/lib/aie/content";
import { getCompletedLessons } from "@/lib/aie/progress";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function LessonPage({ params }: { params: Promise<{ module: string; lesson: string }> }) {
  const { module: moduleParam, lesson } = await params;
  const mod = await getModule(Number(moduleParam));
  if (!mod || !mod.lessons.some((l) => l.number === lesson)) notFound();

  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const [body, done, data, furtherReading] = await Promise.all([
    getLessonMdx(mod.number, lesson),
    getCompletedLessons(userId),
    getInteractiveData(mod.number),
    getFurtherReadingMdx(mod.number),
  ]);
  if (body === null) notFound();

  return <LessonView mod={mod} lesson={lesson} body={body} done={done} data={data} furtherReading={furtherReading} />;
}
