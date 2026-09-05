import { MathDetective } from "@/components/course-engine/detective/MathDetective";
import { SCENARIOS } from "@/components/course-engine/detective/scenarios";

const COURSE_ID = "math-for-ml";

export function GradientDetectiveSection() {
  return <MathDetective courseId={COURSE_ID} scenario={SCENARIOS[0]} />;
}
export function StatisticsDetectiveSection() {
  return <MathDetective courseId={COURSE_ID} scenario={SCENARIOS[1]} />;
}
export function ProbabilityDetectiveSection() {
  return <MathDetective courseId={COURSE_ID} scenario={SCENARIOS[2]} />;
}
