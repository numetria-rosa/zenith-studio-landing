import { GradientDescentLab } from "@/components/course-engine/GradientDescentLab";
import { ProjectBrief } from "@/components/course-engine/projects/ProjectBrief";

export function WorkspaceSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
        Workspace — reusing Module 5&apos;s Gradient Descent Lab
      </span>
      <GradientDescentLab />
    </div>
  );
}

export function BriefSection() {
  return (
    <ProjectBrief
      courseId="math-for-ml"
      projectId="gradient-descent-from-scratch"
      objective="Find, experimentally, the largest learning rate that still reliably converges on this loss surface — and explain why that number is what it is, not just what it is."
      requirements={[
        "Starting from the same point each time, find the smallest number of steps you can converge in without diverging or oscillating",
        "Find the exact learning rate (to within 0.01) where behavior switches from converging to oscillating",
        "Compare that experimentally-found threshold to the theoretical one from Module 5's Full Derivation (η < 1/3 for this surface) — how close did you get?",
        "Explain what 'converged' means operationally here (what loss value, or what visual state, did you use as your stopping criterion?)",
      ]}
      hints={[
        "Use Reset between trials so every comparison starts from the same point.",
        "Step ×1 near the threshold learning rate gives you finer control than Step ×10.",
        "Module 5's Full Derivation level has the exact formula for the theoretical threshold — go back and reread it before comparing.",
      ]}
      rubric={[
        { key: "foundFastest", label: "Found a reasonably fast-converging learning rate and recorded the step count" },
        { key: "foundThreshold", label: "Found the approximate learning rate where oscillation begins" },
        { key: "comparedTheory", label: "Compared the experimental threshold to the theoretical η < 1/3 and discussed the gap (or lack of one)" },
        { key: "definedConverged", label: "Gave a concrete, checkable definition of what counted as 'converged' in this experiment" },
      ]}
      expectedConcepts={["Gradient descent", "Learning rate", "Convergence vs. divergence", "Stability threshold"]}
    />
  );
}
