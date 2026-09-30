import { ChallengeRunner } from "@/components/learn/ChallengeRunner";
import { LEARN_BASE } from "@/components/learn/nav";
import { PageHead } from "@/components/learn/PageHead";
import { getChallenges } from "@/lib/aie/content";
import { getQuizStats } from "@/lib/aie/progress";
import { newQuizSeed } from "@/lib/aie/quiz";
import { requireEnrollment } from "@/lib/require-enrollment";

export default async function Challenges() {
  const { userId } = await requireEnrollment("ai-engineering", LEARN_BASE);
  const [challenges, stats] = await Promise.all([getChallenges(), getQuizStats(userId)]);
  const seed = newQuizSeed();
  return (
    <>
      <PageHead eyebrow="Practice" title="Cross-module challenges" subtitle="Two scenarios that don't belong to any one module. Each combines context budgeting, retrieval, tool idempotency, agent control flow, reliability and evaluation, the way a real production AI system does. Get every answer right to pass. Do both before the capstone." />
      {challenges.map((c, i) => {
        const best = stats.get(`challenge_${c.id}`)?.best;
        return <ChallengeRunner key={c.id} challenge={c} index={i + 1} seed={seed + i * 977} best={!!best && best.score === best.total} />;
      })}
    </>
  );
}
