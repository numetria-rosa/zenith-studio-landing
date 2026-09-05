import { QuickCheck } from "@/components/course-engine/QuickCheck";
import type { QuizQuestion } from "@/components/course-engine/QuizBlock";

const QUESTIONS: QuizQuestion[] = [
  {
    id: "c1",
    text: "What does Σᵢ₌₁³ i mean?",
    options: [
      { text: "1 + 2 + 3 = 6 — add up i for every value from 1 to 3", correct: true, principle: "Σ (sigma) means 'sum up the following expression for every value of the index in the given range.'" },
      { text: "1 × 2 × 3 = 6", correct: false, whyWrong: "That's what a product symbol (Π, capital pi) means — Σ specifically means addition, not multiplication.", principle: "Σ = sum. Π = product. They look similar but mean different operations." },
      { text: "The 3rd value of i, which is 3", correct: false, whyWrong: "Σ doesn't pick out one value — it adds up ALL the values across the stated range.", principle: "The numbers above and below Σ set the range to sum over, not a single value to select." },
    ],
  },
  {
    id: "c2",
    text: "In the notation xᵢ, what does the subscript i typically represent?",
    options: [
      { text: "Which specific element of a list or vector x you're referring to", correct: true, principle: "A subscript is an index — x₁, x₂, x₃ are the 1st, 2nd, and 3rd entries of x." },
      { text: "x raised to the power i", correct: false, whyWrong: "That would be written xⁱ, as a superscript — a subscript (below the line) and a superscript (above the line) mean very different things.", principle: "Subscript = index/label (which one). Superscript = exponent (raised to what power)." },
      { text: "x multiplied by i", correct: false, whyWrong: "Subscript notation isn't multiplication — it's a label identifying a specific item.", principle: "xᵢ is read as 'x sub i' — the i-th entry of x, not a product." },
    ],
  },
  {
    id: "c3",
    text: "What does f'(x) (read 'f prime of x') represent?",
    options: [
      { text: "The derivative of f — its rate of change at x", correct: true, principle: "The prime symbol is one common notation for a derivative, covered properly in Module 4." },
      { text: "The inverse of the function f", correct: false, whyWrong: "An inverse function is usually written f⁻¹(x), with a superscript -1, not a prime mark.", principle: "f'(x) = derivative. f⁻¹(x) = inverse function. Different symbols, different meanings." },
      { text: "f evaluated at a 'prime' number x", correct: false, whyWrong: "The prime mark here has nothing to do with prime numbers — it's a notation convention for derivatives.", principle: "In calculus notation, a prime mark after a function name denotes its derivative." },
    ],
  },
  {
    id: "c4",
    text: "A vector is written v = (v₁, v₂). What does this tell you?",
    options: [
      { text: "v has two components, labeled v₁ and v₂ — for example, the x and y coordinates of a 2D vector", correct: true, principle: "Parentheses with comma-separated, subscripted entries is standard vector notation." },
      { text: "v equals v₁ times v₂", correct: false, whyWrong: "Comma-separated values in parentheses list components — they aren't being multiplied together.", principle: "(v₁, v₂) is an ordered pair/list of the vector's components, not an arithmetic expression." },
      { text: "There are two separate, unrelated variables called v₁ and v₂", correct: false, whyWrong: "The subscripts specifically mark them as parts of the SAME vector v, not unrelated variables.", principle: "Subscripted variables sharing a base letter (v₁, v₂) are conventionally components of one object, v." },
    ],
  },
];

export function QuickCheckSection() {
  return <QuickCheck questions={QUESTIONS} />;
}
