"use client";

import { savePythonRunAction } from "@/app/lab/ai-engineering/learn/actions";
import { ExerciseView, type ExerciseViewProps } from "@/components/learn/exercise/ExerciseView";

/** ExerciseView wired to Python Foundations storage (the run goes to the topic's own row, not a module's). */
export function PythonExercise({ topic, ...props }: { topic: number } & Omit<ExerciseViewProps, "save" | "module">) {
  return <ExerciseView {...props} module={100 + topic} save={(code, passed) => savePythonRunAction(topic, code, passed)} />;
}
