/* The Practice Library's task data model. Two real formats, matching the
   course brief's "Calculation" and "Interpretation/Debugging/Decision"
   practice types (section 14) - no "Coding" tasks yet since there's no
   Pyodide wiring for the "react" render mode (see the curriculum research
   doc's honest gaps list), and no fabricated task count: every task here
   is graded by real arithmetic or a real correct/incorrect answer, nothing
   is a placeholder. */

export type PracticeTaskType = "calculation" | "interpretation" | "debugging" | "decision";

export type CalculationTask = {
  id: string;
  moduleId: number;
  type: "calculation";
  prompt: string;
  /** Optional short block of given data/setup shown above the input, e.g. "a = (3, 4)". */
  given?: string;
  answer: number;
  tolerance: number;
  unit?: string;
  hint: string;
  explanation: string;
};

export type ChoiceOption = {
  text: string;
  correct: boolean;
  feedback: string;
};

export type ChoiceTask = {
  id: string;
  moduleId: number;
  type: "interpretation" | "debugging" | "decision";
  prompt: string;
  given?: string;
  options: ChoiceOption[];
};

export type PracticeTask = CalculationTask | ChoiceTask;
