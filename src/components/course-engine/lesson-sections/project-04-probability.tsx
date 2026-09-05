import { ProbabilityLab } from "@/components/course-engine/ProbabilityLab";
import { ProjectBrief } from "@/components/course-engine/projects/ProjectBrief";

export function WorkspaceSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
        Workspace — reusing Module 6&apos;s Probability Lab
      </span>
      <ProbabilityLab />
    </div>
  );
}

export function BriefSection() {
  return (
    <ProjectBrief
      courseId="math-for-ml"
      projectId="probability-simulator"
      objective="Directly compare theoretical predictions (the standard error formula) against real simulated results, and quantify how good the match actually is."
      requirements={[
        "Pick a true probability p, then flip to n=10, n=100, and n=1000, recording the empirical probability at each",
        "At each n, compute the theoretical standard error (σ = √(p(1-p)/n)) by hand and compare it to how far your empirical probability actually was from p",
        "Repeat the n=10 trial (reset and flip 10 again) three times, and record how much the empirical probability varies between repeats",
        "Explain, using your own numbers, why n=1000 trials produced a more reliable estimate than n=10",
      ]}
      hints={[
        "The lab's own 'standard error of the mean' stat is the theoretical prediction — you're checking it against what actually happened.",
        "A single n=10 trial being off from p by a lot isn't a bug — that's exactly the high-variance behavior small samples are expected to show.",
        "Try an extreme p (like 0.9) as well as p=0.5 — does the standard error formula's behavior match what you'd predict for both?",
      ]}
      rubric={[
        { key: "recorded3n", label: "Recorded empirical probability at n=10, 100, and 1000 for the same p" },
        { key: "comparedSE", label: "Compared actual deviation from p against the theoretical standard error at each n" },
        { key: "repeatedSmallN", label: "Repeated the n=10 trial three times and recorded how much it varied" },
        { key: "explainedReliability", label: "Explained in their own words why more flips gave a more reliable estimate" },
      ]}
      expectedConcepts={["Law of large numbers", "Standard error", "Sampling variability", "Bernoulli trials"]}
    />
  );
}
