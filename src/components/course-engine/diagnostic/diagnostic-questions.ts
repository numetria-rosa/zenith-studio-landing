export type SkillArea = "algebra" | "graphs" | "notation" | "vectors" | "probability";

export const SKILL_AREA_LABEL: Record<SkillArea, string> = {
  algebra: "Algebra & functions",
  graphs: "Graphs & rate of change",
  notation: "Mathematical notation",
  vectors: "Vector intuition",
  probability: "Probability intuition",
};

export type DiagnosticQuestion = {
  id: string;
  area: SkillArea;
  text: string;
  options: string[];
  correctIndex: number;
};

/* 12 questions, evenly spread across the 5 areas this course actually
   needs before Module 1 — not a generic math-aptitude test. Real questions
   with one real correct answer each; scoring below is a real tally, not a
   canned percentage. */
export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  { id: "d1", area: "algebra", text: "Solve for x: 2x - 4 = 10", options: ["x = 3", "x = 7", "x = 12"], correctIndex: 1 },
  { id: "d2", area: "algebra", text: "What is log₁₀(1000)?", options: ["3", "100", "10000"], correctIndex: 0 },
  { id: "d3", area: "algebra", text: "If f(x) = x² - 1, what is f(3)?", options: ["8", "9", "5"], correctIndex: 0 },
  { id: "d4", area: "graphs", text: "A line has slope -2. Moving 1 unit right, what happens to its height?", options: ["Rises 2 units", "Falls 2 units", "Stays the same"], correctIndex: 1 },
  { id: "d5", area: "graphs", text: "At the very top of a hill-shaped curve, what is the slope?", options: ["Very steep and positive", "Very steep and negative", "Exactly zero"], correctIndex: 2 },
  { id: "d6", area: "notation", text: "What does Σᵢ₌₁⁴ i mean?", options: ["1+2+3+4 = 10", "1×2×3×4 = 24", "Just the number 4"], correctIndex: 0 },
  { id: "d7", area: "notation", text: "In v = (v₁, v₂), what do the subscripts mean?", options: ["v₁ times v₂", "Two unrelated variables", "The first and second components of v"], correctIndex: 2 },
  { id: "d8", area: "vectors", text: "Which best describes a vector?", options: ["A single number", "An arrow with both a length and a direction", "A type of equation"], correctIndex: 1 },
  { id: "d9", area: "vectors", text: "If two vectors point in exactly the same direction, what would you expect about how 'similar' they are?", options: ["Very similar", "Very different", "No relationship at all"], correctIndex: 0 },
  { id: "d10", area: "probability", text: "A fair coin is flipped 3 times, all heads. What's the probability the 4th flip is heads?", options: ["Higher than 50%, to balance out", "Lower than 50%, it's due for tails", "Still 50%, the coin has no memory"], correctIndex: 2 },
  { id: "d11", area: "probability", text: "What does it mean for an event to have a probability of 0.9?", options: ["It will definitely happen", "It's quite likely, but not certain", "It happens exactly 9 times"], correctIndex: 1 },
  { id: "d12", area: "graphs", text: "A curve is getting flatter and flatter as it moves right, approaching (but not reaching) a horizontal line. What's happening to its rate of change?", options: ["Increasing", "Shrinking toward zero", "Becoming negative"], correctIndex: 1 },
];
