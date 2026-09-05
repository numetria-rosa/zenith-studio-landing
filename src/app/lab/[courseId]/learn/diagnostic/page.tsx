import { notFound } from "next/navigation";
import { getCourse } from "@/lib/courses";
import { COURSE_RAIL_DATA } from "@/lib/course-rail-data";
import { LearnShell } from "@/components/course-rail/LearnShell";
import { Diagnostic } from "@/components/course-engine/diagnostic/Diagnostic";

/* Literal "diagnostic" segment, same priority-over-catch-all trick as
   /learn/practice - inherits the guarded learn/layout.tsx automatically. */

export default async function DiagnosticPage({
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
    <LearnShell data={railData} courseId={courseId} activeModuleId={-1} courseLabel={course.title}>
      <div className="mx-auto max-w-[820px] px-6 pb-24">
        <header className="border-b border-[#232838] py-10">
          <span className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b7cf6]">
            Diagnostic
          </span>
          <h1 className="mt-3 font-[family-name:var(--font-course-serif)] text-[clamp(30px,5vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em]">
            Skill Diagnostic
          </h1>
          <p className="mt-3 max-w-[560px] text-[15px] text-[#9aa0ae]">
            12 questions across the 5 areas this course actually needs before Module 1. This never gates
            anything - every module and the whole Foundation Bridge stay open no matter the result.
          </p>
        </header>

        <div className="py-8">
          <Diagnostic courseId={courseId} basePath={`/lab/${courseId}/learn`} />
        </div>
      </div>
    </LearnShell>
  );
}
