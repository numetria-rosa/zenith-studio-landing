import { LEARN_BASE } from "@/components/learn/nav";
import { QuizView } from "@/components/learn/quiz/QuizView";
import { getFinalAssessment } from "@/lib/aie/content";
import { newQuizSeed } from "@/lib/aie/quiz";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function FinalAssessmentPage() {
  await requireEnrollment("ai-engineering", LEARN_BASE);
  const fa = await getFinalAssessment();
  return (
    <QuizView
      scope={{ final: true }}
      eyebrow="Final assessment"
      title="Ten scenarios you haven't seen."
      bank={fa.questions}
      drawSize={fa.draw}
      passMark={fa.passMark}
      seed={newQuizSeed()}
      stuck={{ href: `${LEARN_BASE}/roadmap`, label: "Stuck? Review the roadmap and revisit a module" }}
      next={{ label: "See your career path", href: `${LEARN_BASE}/career` }}
    />
  );
}
