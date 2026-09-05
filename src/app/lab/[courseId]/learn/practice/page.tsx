import { notFound } from "next/navigation";
import { getCourse } from "@/lib/courses";
import { COURSE_RAIL_DATA } from "@/lib/course-rail-data";
import { CourseRailClient } from "@/components/course-rail/CourseRailClient";
import { PracticeLibrary } from "@/components/course-engine/practice/PracticeLibrary";

/* A literal "practice" segment here takes priority over the sibling
   [[...lessonSlug]] catch-all route (Next.js resolves static segments
   before catch-alls), so this page still inherits the guarded
   learn/layout.tsx auth gate without any changes to it. */

export default async function PracticePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course || course.renderMode !== "react") notFound();

  const railData = COURSE_RAIL_DATA[courseId];
  if (!railData) notFound();

  return (
    <div className="flex min-h-screen bg-[#0d0f14] text-[#eeeee7]">
      <div className="hidden w-[260px] flex-shrink-0 lg:block">
        <div className="fixed h-screen w-[260px]">
          <CourseRailClient data={railData} courseId={courseId} activeModuleId={-1} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-10 border-b-[3px] border-[#8b7cf6] bg-[#0d0f14]/92 backdrop-blur">
          <div className="mx-auto flex max-w-[820px] items-center gap-3.5 px-6 py-3.5">
            <span className="font-[family-name:var(--font-course-serif)] text-[16px] font-extrabold tracking-[-0.02em]">
              ZENITH<b className="ml-0.5 rounded-[2px] bg-[#8b7cf6] px-1.5 py-px text-[#120f24]">LAB</b>
            </span>
            <span className="ml-auto font-[family-name:var(--font-course-mono)] text-[12px] uppercase tracking-[0.08em] text-[#676e7d]">
              {course.title}
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-[820px] px-6 pb-24">
          <header className="border-b border-[#232838] py-10">
            <span className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b7cf6]">
              Practice
            </span>
            <h1 className="mt-3 font-[family-name:var(--font-course-serif)] text-[clamp(30px,5vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em]">
              Practice Library
            </h1>
            <p className="mt-3 max-w-[560px] text-[15px] text-[#9aa0ae]">
              Extra calculation, interpretation, debugging, and decision tasks for every module — separate from
              the checkpoint quizzes, untimed, and retriable.
            </p>
          </header>

          <div className="py-8">
            <PracticeLibrary courseId={courseId} railData={railData} />
          </div>
        </div>
      </div>
    </div>
  );
}
