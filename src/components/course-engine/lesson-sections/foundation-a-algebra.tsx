import { QuickCheck } from "@/components/course-engine/QuickCheck";
import type { QuizQuestion } from "@/components/course-engine/QuizBlock";

const QUESTIONS: QuizQuestion[] = [
  {
    id: "a1",
    text: "Solve for x: 3x + 5 = 20",
    options: [
      { text: "x = 5", correct: true, principle: "3x = 15, so x = 5." },
      { text: "x = 8.33", correct: false, whyWrong: "This comes from dividing 25 by 3 instead of subtracting 5 first.", principle: "Isolate the term with x first: subtract 5 from both sides, then divide by 3." },
      { text: "x = 25", correct: false, whyWrong: "This adds 5 to 20 instead of subtracting it.", principle: "Moving a term to the other side of the equals sign flips its sign — +5 becomes -5." },
    ],
  },
  {
    id: "a2",
    text: "What does x² mean?",
    options: [
      { text: "x multiplied by itself: x × x", correct: true, principle: "The exponent tells you how many times the base multiplies itself." },
      { text: "x multiplied by 2", correct: false, whyWrong: "That would be written 2x, not x².", principle: "An exponent (the small raised number) means repeated multiplication of the base, not multiplication by the exponent's value." },
      { text: "2 divided by x", correct: false, whyWrong: "Division isn't involved at all here — x² is pure multiplication of x by itself.", principle: "x² = x × x, always." },
    ],
  },
  {
    id: "a3",
    text: "What is log₂(8)?",
    options: [
      { text: "3, because 2³ = 8", correct: true, principle: "A logarithm answers 'what power do I raise the base to, to get this number' — 2 raised to the power 3 gives 8." },
      { text: "4, because 8 ÷ 2 = 4", correct: false, whyWrong: "Division isn't what a logarithm computes — that's a different operation entirely.", principle: "log₂(8) asks 'what power of 2 equals 8,' not 'what is 8 divided by 2.'" },
      { text: "16, because 2 × 8 = 16", correct: false, whyWrong: "Multiplying the base by the number isn't what a logarithm means.", principle: "log_b(n) is the exponent that turns b into n, not a product of b and n." },
    ],
  },
  {
    id: "a4",
    text: "If f(x) = 2x + 1, what is f(3)?",
    options: [
      { text: "7", correct: true, principle: "Substitute x=3: 2(3)+1 = 6+1 = 7." },
      { text: "6", correct: false, whyWrong: "This computes 2×3 but forgets to add the +1.", principle: "Every part of the function definition applies — don't drop the constant term." },
      { text: "2", correct: false, whyWrong: "This treats f(3) as if it meant 'f times 3,' rather than 'evaluate f at input 3.'", principle: "f(3) means: plug 3 in for x everywhere it appears in the function's formula." },
    ],
  },
];

export function QuickCheckSection() {
  return <QuickCheck questions={QUESTIONS} />;
}
