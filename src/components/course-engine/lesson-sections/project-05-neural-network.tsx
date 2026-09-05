import { NeuronLab } from "@/components/course-engine/NeuronLab";
import { ProjectBrief } from "@/components/course-engine/projects/ProjectBrief";

export function WorkspaceSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
        Workspace - reusing Module 10&apos;s Neuron Lab
      </span>
      <NeuronLab />
    </div>
  );
}

export function BriefSection() {
  return (
    <ProjectBrief
      courseId="math-for-ml"
      projectId="neural-network-from-scratch"
      objective="Train this one neuron from a bad starting point to a good one, and be able to explain every number that changed along the way - not just that the loss went down."
      buildSteps={[
        "Before clicking Step even once, hand-compute z, a, and the loss for the reset starting weights (w1=0.4, w2=0.4, b=0) and check them against the lab's display.",
        "Then hand-compute ∂Loss/∂w1 at that same starting point, using the chain rule formula, and check it too.",
        "Only after both hand computations match the lab, start clicking Step and tracking the loss curve.",
        "Save the high-learning-rate divergence experiment for last, after you've seen normal convergence first.",
      ]}
      requirements={[
        "Reset the neuron, then click Step at least 10 times, recording the loss every 2 steps",
        "Identify the step where the loss stopped changing much - has the neuron converged, or just slowed down?",
        "Manually compute ∂Loss/∂w1 by hand for the RESET starting values (w1=0.4, w2=0.4, b=0) using the chain rule formula from Module 10, and check it against the lab's displayed value",
        "Explain what would happen if you set the learning rate very high (try it) - connect this back to Module 5's divergence discussion",
      ]}
      hints={[
        "z = w1·x1 + w2·x2 + b, with x1=1.5, x2=-0.8, target=1 - these are fixed, shown in the lab.",
        "The chain rule gives ∂L/∂w1 = 2(a-y)·a(1-a)·x1 - compute a and z first from the reset weights, then plug in.",
        "A learning rate that's fine for Module 5's 2-variable bowl might behave differently here - the loss surface shape is different.",
      ]}
      rubric={[
        { key: "trackedLoss", label: "Tracked the loss across at least 10 steps" },
        { key: "identifiedPlateau", label: "Identified roughly where the loss stopped changing much" },
        { key: "handComputedGradient", label: "Hand-computed ∂Loss/∂w1 at the starting point and checked it against the lab" },
        { key: "connectedDivergence", label: "Tried a high learning rate and connected the result to Module 5's divergence discussion" },
      ]}
      expectedConcepts={["Forward pass", "Backpropagation", "Chain rule", "Gradient descent"]}
      walkthrough={[
        "Work the forward pass fully before touching the gradient: z = w1x1 + w2x2 + b, then a = σ(z), then loss = (a-target)² - each number depends on the one before it.",
        "For the gradient, compute the three chain-rule factors separately (2(a-target), then a(1-a), then x1) before multiplying them together - it's easier to spot an arithmetic slip in one small piece than in one long expression.",
        "A loss curve that flattens doesn't necessarily mean it's done improving forever - with more steps or a different learning rate it might still inch down further; 'plateaued for now' and 'converged' aren't quite the same claim.",
        "At a very high learning rate, expect the SAME divergence signature from Module 5's 2-variable surface: smooth-looking progress that suddenly reverses and grows - the underlying math is identical, just applied to different variables now.",
      ]}
    />
  );
}
