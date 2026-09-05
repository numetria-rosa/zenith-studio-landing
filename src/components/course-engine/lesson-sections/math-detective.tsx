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
export function EmbeddingDetectiveSection() {
  return <MathDetective courseId={COURSE_ID} scenario={SCENARIOS[3]} />;
}
export function PcaDetectiveSection() {
  return <MathDetective courseId={COURSE_ID} scenario={SCENARIOS[4]} />;
}
export function InformationDetectiveSection() {
  return <MathDetective courseId={COURSE_ID} scenario={SCENARIOS[5]} />;
}
export function AttentionDetectiveSection() {
  return <MathDetective courseId={COURSE_ID} scenario={SCENARIOS[6]} />;
}
