import { notFound } from "next/navigation";
import { getCourse } from "@/lib/courses";
import { COURSE_RAIL_DATA } from "@/lib/course-rail-data";
import { LearnShell } from "@/components/course-rail/LearnShell";
import { PracticeLibrary } from "@/components/course-engine/practice/PracticeLibrary";

/* UNAUTHENTICATED PREVIEW ONLY - mirrors src/app/lab/[courseId]/learn/practice/page.tsx.
   Remove before shipping, same as the rest of this preview tree. */

const COURSE_ID = "math-for-ml";

export default async function PreviewPracticePage() {
  const course = getCourse(COURSE_ID);
  if (!course) notFound();

  const railData = COURSE_RAIL_DATA[COURSE_ID];
  if (!railData) notFound();

  return (
    <LearnShell data={railData} courseId={COURSE_ID} activeModuleId={-1} basePath={`/preview/${COURSE_ID}`} courseLabel={course.title}>
      <div className="mx-auto max-w-[820px] px-6 pb-24">
        <header className="border-b border-[#232838] py-10">
          <span className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b7cf6]">
            Practice
          </span>
          <h1 className="mt-3 font-[family-name:var(--font-course-serif)] text-[clamp(30px,5vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em]">
            Practice Library
          </h1>
          <p className="mt-3 max-w-[560px] text-[15px] text-[#9aa0ae]">
            Extra calculation, interpretation, debugging, and decision tasks for every module - separate from
            the checkpoint quizzes, untimed, and retriable.
          </p>
        </header>

        <div className="py-8">
          <PracticeLibrary courseId={COURSE_ID} railData={railData} />
        </div>
      </div>
    </LearnShell>
  );
}
