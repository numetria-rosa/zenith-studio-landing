import { notFound } from "next/navigation";
import { LEARN_BASE } from "@/components/learn/nav";
import { QuizView } from "@/components/learn/quiz/QuizView";
import { getModule } from "@/lib/aie/content";
import { newQuizSeed } from "@/lib/aie/quiz";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function QuizPage({ params }: { params: Promise<{ module: string }> }) {
  const { module: moduleParam } = await params;
  const mod = await getModule(Number(moduleParam));
  if (!mod?.quiz) notFound();
  await requireEnrollment("ai-engineering", LEARN_BASE);

  const base = `${LEARN_BASE}/modules/${mod.number}`;
  const first = mod.lessons[0];
  const next = mod.project
    ? { label: "Continue to the project", href: `${base}/project` }
    : mod.cheatSheet
      ? { label: "Continue to the cheat sheet", href: `${base}/cheat-sheet` }
      : { label: "Back to the overview", href: base };

  return (
    <QuizView
      scope={{ module: mod.number }}
      eyebrow={`Module ${mod.number} quiz`}
      title={mod.quiz.cardTitle ?? `${mod.title}, checked.`}
      bank={mod.quiz.questions}
      passMark={mod.quiz.passMark}
      seed={newQuizSeed()}
      stuck={{ href: first ? `${base}/lessons/${first.number}` : base, label: first ? `Stuck? Review the lessons, starting at ${first.number} ${first.title}` : "Stuck? Review the module" }}
      next={next}
    />
  );
}
