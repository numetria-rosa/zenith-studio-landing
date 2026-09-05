import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound, redirect } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { getCourse } from "@/lib/courses";
import { getLessonBySlug, firstLesson, nextLesson, prevLesson } from "@content/react-courses/math-for-ml/lessons";
import { COURSE_RAIL_DATA } from "@/lib/course-rail-data";
import { LearnShell } from "@/components/course-rail/LearnShell";
import { Objectives } from "@/components/course-engine/Objectives";
import { Callout } from "@/components/course-engine/Callout";
import * as FoundationA from "@/components/course-engine/lesson-sections/foundation-a-algebra";
import * as FoundationB from "@/components/course-engine/lesson-sections/foundation-b-graphs";
import * as FoundationC from "@/components/course-engine/lesson-sections/foundation-c-notation";
import * as Module01 from "@/components/course-engine/lesson-sections/module-01-vectors";
import * as Module02 from "@/components/course-engine/lesson-sections/module-02-matrices";
import * as Module03 from "@/components/course-engine/lesson-sections/module-03-pca";
import * as Module04 from "@/components/course-engine/lesson-sections/module-04-calculus";
import * as Module05 from "@/components/course-engine/lesson-sections/module-05-optimization";
import * as Module06 from "@/components/course-engine/lesson-sections/module-06-probability";
import * as Module07 from "@/components/course-engine/lesson-sections/module-07-statistics";
import * as Module08 from "@/components/course-engine/lesson-sections/module-08-likelihood";
import * as Module09 from "@/components/course-engine/lesson-sections/module-09-information";
import * as Module10 from "@/components/course-engine/lesson-sections/module-10-neural-networks";
import * as Module11 from "@/components/course-engine/lesson-sections/module-11-attention";
import * as MathDetectiveSections from "@/components/course-engine/lesson-sections/math-detective";
import * as Project01 from "@/components/course-engine/lesson-sections/project-01-similarity";
import * as Project02 from "@/components/course-engine/lesson-sections/project-02-pca";
import * as Project03 from "@/components/course-engine/lesson-sections/project-03-gradient-descent";
import * as Project04 from "@/components/course-engine/lesson-sections/project-04-probability";
import * as Project05 from "@/components/course-engine/lesson-sections/project-05-neural-network";
import * as Project06 from "@/components/course-engine/lesson-sections/project-06-capstone";

/* Only math-for-ml exists as a "react" course right now - this page is not
   generic across arbitrary react courses yet (see the architecture plan's
   phased build order: "prove the pattern on one course first"). Extending
   to a second react course means parameterizing the lesson-manifest import
   and this per-lesson component map below, not redesigning this file.

   Each module's lesson-sections file exports the same three names
   (*LabSection, MathLevelsSection, QuizSection) with different content -
   keyed here by lesson id so a new module means adding one entry, not
   touching the lesson page's rendering logic. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- MDXRemote's own `components` prop is this loosely typed
const LESSON_COMPONENTS: Record<number, Record<string, React.ComponentType<any>>> = {
  0: { Objectives, Callout },
  50: { Objectives, Callout, QuickCheckSection: FoundationA.QuickCheckSection },
  51: { Objectives, Callout, QuickCheckSection: FoundationB.QuickCheckSection },
  52: { Objectives, Callout, QuickCheckSection: FoundationC.QuickCheckSection },
  60: {
    Objectives,
    Callout,
    GradientDetectiveSection: MathDetectiveSections.GradientDetectiveSection,
    StatisticsDetectiveSection: MathDetectiveSections.StatisticsDetectiveSection,
    ProbabilityDetectiveSection: MathDetectiveSections.ProbabilityDetectiveSection,
  },
  100: { Objectives, Callout },
  1: {
    Objectives,
    Callout,
    VectorLabSection: Module01.VectorLabSection,
    MathLevelsSection: Module01.MathLevelsSection,
    QuizSection: Module01.QuizSection,
  },
  2: {
    Objectives,
    Callout,
    MatrixLabSection: Module02.MatrixLabSection,
    MathLevelsSection: Module02.MathLevelsSection,
    QuizSection: Module02.QuizSection,
  },
  3: {
    Objectives,
    Callout,
    PCALabSection: Module03.PCALabSection,
    MathLevelsSection: Module03.MathLevelsSection,
    QuizSection: Module03.QuizSection,
  },
  4: {
    Objectives,
    Callout,
    GradientLabSection: Module04.GradientLabSection,
    MathLevelsSection: Module04.MathLevelsSection,
    QuizSection: Module04.QuizSection,
  },
  5: {
    Objectives,
    Callout,
    GradientDescentLabSection: Module05.GradientDescentLabSection,
    MathLevelsSection: Module05.MathLevelsSection,
    QuizSection: Module05.QuizSection,
  },
  6: {
    Objectives,
    Callout,
    ProbabilityLabSection: Module06.ProbabilityLabSection,
    MathLevelsSection: Module06.MathLevelsSection,
    QuizSection: Module06.QuizSection,
  },
  7: {
    Objectives,
    Callout,
    SamplingLabSection: Module07.SamplingLabSection,
    MathLevelsSection: Module07.MathLevelsSection,
    QuizSection: Module07.QuizSection,
  },
  8: {
    Objectives,
    Callout,
    LikelihoodLabSection: Module08.LikelihoodLabSection,
    MathLevelsSection: Module08.MathLevelsSection,
    QuizSection: Module08.QuizSection,
  },
  9: {
    Objectives,
    Callout,
    EntropyLabSection: Module09.EntropyLabSection,
    MathLevelsSection: Module09.MathLevelsSection,
    QuizSection: Module09.QuizSection,
  },
  10: {
    Objectives,
    Callout,
    NeuronLabSection: Module10.NeuronLabSection,
    MathLevelsSection: Module10.MathLevelsSection,
    QuizSection: Module10.QuizSection,
  },
  11: {
    Objectives,
    Callout,
    AttentionLabSection: Module11.AttentionLabSection,
    MathLevelsSection: Module11.MathLevelsSection,
    QuizSection: Module11.QuizSection,
  },
  200: { Objectives, Callout, WorkspaceSection: Project01.WorkspaceSection, BriefSection: Project01.BriefSection },
  201: { Objectives, Callout, WorkspaceSection: Project02.WorkspaceSection, BriefSection: Project02.BriefSection },
  202: { Objectives, Callout, WorkspaceSection: Project03.WorkspaceSection, BriefSection: Project03.BriefSection },
  203: { Objectives, Callout, WorkspaceSection: Project04.WorkspaceSection, BriefSection: Project04.BriefSection },
  204: { Objectives, Callout, WorkspaceSection: Project05.WorkspaceSection, BriefSection: Project05.BriefSection },
  205: {
    Objectives,
    Callout,
    WorkspaceSection: Project06.WorkspaceSection,
    MathSection: Project06.MathSection,
    BriefSection: Project06.BriefSection,
  },
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonSlug?: string[] }>;
}) {
  const { courseId, lessonSlug } = await params;
  const course = getCourse(courseId);
  if (!course || course.renderMode !== "react") notFound();

  const slug = lessonSlug?.[0];
  if (!slug) {
    redirect(`/lab/${courseId}/learn/${firstLesson().slug}`);
  }

  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();

  const filePath = path.resolve(process.cwd(), "content/react-courses/math-for-ml/lessons", lesson.file);
  const source = await readFile(filePath, "utf-8");

  const railData = COURSE_RAIL_DATA[courseId];
  const next = nextLesson(lesson.id);
  const prev = prevLesson(lesson.id);
  const stage = railData?.stages.find((s) => s.modules.includes(lesson.id));
  const mdxComponents = LESSON_COMPONENTS[lesson.id] ?? { Objectives, Callout };

  const courseLabel = `${course.title}${lesson.id >= 1 && lesson.id <= 11 ? ` · Module ${lesson.id}` : ""}`;

  const body = (
    <div className="mx-auto max-w-[820px] px-6 pb-24">
      <header className="border-b border-[#232838] py-10">
        <span className="font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b7cf6]">
          {lesson.id === 0
            ? "Start here"
            : lesson.id === 60
              ? "Practice · Reasoning"
              : lesson.id === 100
                ? "Reference"
                : lesson.id === 205
                  ? "Capstone"
                  : lesson.id >= 200
                    ? "Project"
                    : lesson.id >= 50 && lesson.id <= 59
                      ? "Foundation Bridge · Optional"
                      : `Module ${lesson.id} of 11${stage ? ` · ${stage.label}: ${stage.title}` : ""}`}
        </span>
        <h1 className="mt-3 font-[family-name:var(--font-course-serif)] text-[clamp(30px,5vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em]">
          {lesson.title}
        </h1>
      </header>

      <article className="prose-lesson py-8 [&>*:first-child]:mt-0 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:font-[family-name:var(--font-course-serif)] [&_h2]:text-[21px] [&_h2]:font-semibold [&_h2]:tracking-[-0.01em] [&_h3]:mt-7 [&_h3]:mb-2.5 [&_h3]:font-[family-name:var(--font-course-serif)] [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-[#8b7cf6] [&_p]:mt-3.5 [&_p]:text-[15.5px] [&_p]:leading-[1.7] [&_p]:text-[#eeeee7] [&_strong]:text-[#eeeee7] [&_ol]:mt-3.5 [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-2.5 [&_ol]:pl-5 [&_ol]:list-decimal [&_ul]:mt-3.5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2.5 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:text-[15px] [&_li]:leading-[1.65] [&_li]:text-[#eeeee7] [&_li_strong]:text-[#8b7cf6] [&_code]:rounded [&_code]:bg-[#8b7cf6]/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-[family-name:var(--font-course-mono)] [&_code]:text-[13px] [&_code]:text-[#8b7cf6]">
        <MDXRemote
          source={source}
          components={mdxComponents}
          options={{
            parseFrontmatter: true,
            mdxOptions: { remarkPlugins: [remarkMath], rehypePlugins: [[rehypeKatex, {}]] },
          }}
        />
      </article>

      <footer className="flex items-center justify-between border-t border-[#232838] py-8">
        {prev ? (
          <a href={`/lab/${courseId}/learn/${prev.slug}`} className="text-[13px] text-[#9aa0ae] hover:text-[#8b7cf6]">
            ← {prev.title}
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a href={`/lab/${courseId}/learn/${next.slug}`} className="text-[13px] font-semibold text-[#8b7cf6]">
            {next.title} →
          </a>
        ) : (
          <span className="text-[13px] text-[#676e7d]">More modules coming soon</span>
        )}
      </footer>
    </div>
  );

  if (!railData) return body;

  return (
    <LearnShell data={railData} courseId={courseId} activeModuleId={lesson.id} courseLabel={courseLabel}>
      {body}
    </LearnShell>
  );
}
