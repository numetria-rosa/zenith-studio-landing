import { notFound } from "next/navigation";
import { LEARN_BASE } from "@/components/learn/nav";
import { QuizView } from "@/components/learn/quiz/QuizView";
import { getMixedQuizzes, getModule } from "@/lib/aie/content";
import { newQuizSeed } from "@/lib/aie/quiz";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function MixedQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mixed = (await getMixedQuizzes()).find((m) => m.id === id);
  if (!mixed) notFound();
  await requireEnrollment("ai-engineering", LEARN_BASE);
  const mods = await Promise.all(mixed.modules.map(getModule));
  const banks = mods.map((m) => m?.quiz?.questions ?? []);
  const size = mixed.perModule * mixed.modules.length;
  return (
    <QuizView
      scope={{ mixed: mixed.id }}
      eyebrow="Mixed review"
      title={mixed.title}
      bank={banks.flat()}
      mixed={{ banks, perModule: mixed.perModule }}
      passMark={Math.ceil(size * 0.8)}
      seed={newQuizSeed()}
      stuck={{ href: `${LEARN_BASE}/quizzes`, label: "Stuck? Back to the Quiz Center" }}
      next={{ label: "Back to the Quiz Center", href: `${LEARN_BASE}/quizzes` }}
    />
  );
}
