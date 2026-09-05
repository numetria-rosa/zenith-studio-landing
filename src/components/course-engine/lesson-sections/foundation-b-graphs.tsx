import { QuickCheck } from "@/components/course-engine/QuickCheck";
import type { QuizQuestion } from "@/components/course-engine/QuizBlock";

const QUESTIONS: QuizQuestion[] = [
  {
    id: "b1",
    text: "A line has a slope of 3. What does that mean?",
    options: [
      { text: "For every 1 unit you move right, the line rises 3 units", correct: true, principle: "Slope is rise over run — 3 means 3 units of rise per 1 unit of run." },
      { text: "The line crosses the y-axis at 3", correct: false, whyWrong: "That describes the y-intercept, a completely different property of a line.", principle: "Slope describes steepness/direction; the y-intercept describes where the line crosses x=0." },
      { text: "The line has 3 points on it", correct: false, whyWrong: "A line has infinitely many points regardless of its slope — slope has nothing to do with counting points.", principle: "Slope is a rate of change, not a count of anything." },
    ],
  },
  {
    id: "b2",
    text: "On a graph of a curve, where is its slope equal to zero?",
    options: [
      { text: "At a peak, a valley, or any perfectly flat point", correct: true, principle: "Zero slope means the curve is momentarily flat — neither rising nor falling." },
      { text: "Wherever the curve crosses the x-axis", correct: false, whyWrong: "Crossing the x-axis just means the curve's height (y-value) is zero — it says nothing about the curve's steepness at that point.", principle: "Slope of zero describes flatness, not a specific height value." },
      { text: "At the very start of the graph, always", correct: false, whyWrong: "There's no rule that a graph must start with zero slope — that depends entirely on the specific curve.", principle: "Zero slope occurs specifically at flat points, wherever they happen to be on the curve." },
    ],
  },
  {
    id: "b3",
    text: "A graph shows a curve getting steeper and steeper as it moves right. What does that tell you about its rate of change?",
    options: [
      { text: "The rate of change is increasing — the curve isn't just growing, it's growing faster and faster", correct: true, principle: "An increasingly steep curve means its instantaneous rate of change (its slope at each point) is itself growing." },
      { text: "The rate of change is constant", correct: false, whyWrong: "A constant rate of change would produce a straight line, not a curve that visibly gets steeper.", principle: "Constant rate of change = straight line. A changing steepness means the rate of change itself is changing." },
      { text: "The rate of change is negative", correct: false, whyWrong: "Getting steeper while still rising means an increasing POSITIVE rate of change, not a negative one — negative would mean the curve is falling.", principle: "The direction (rising vs falling) and the rate of change's own trend (speeding up vs slowing down) are two separate things to read off a graph." },
    ],
  },
];

export function QuickCheckSection() {
  return <QuickCheck questions={QUESTIONS} />;
}
