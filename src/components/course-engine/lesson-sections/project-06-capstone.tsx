import { CapstoneWorkspace } from "@/components/course-engine/projects/CapstoneWorkspace";
import { ProjectBrief } from "@/components/course-engine/projects/ProjectBrief";
import { InlineMath, BlockMath } from "@/components/course-engine/Math";

export function WorkspaceSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
        Capstone Workspace
      </span>
      <CapstoneWorkspace />
    </div>
  );
}

export function MathSection() {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#333a4c] bg-[#151920] p-5 text-[14.5px] text-[#eeeee7]">
      <p>
        This is the only new formula in the whole course: what happens when you combine a sigmoid activation with
        cross-entropy loss (instead of the mean-squared-error loss Module 10 used). Recall Module 10&apos;s gradient:
      </p>
      <BlockMath tex="\frac{\partial L_{MSE}}{\partial w_1} = 2(a-y)\cdot a(1-a)\cdot x_1" />
      <p>For binary cross-entropy loss instead, the same derivative simplifies dramatically:</p>
      <BlockMath tex="\frac{\partial L_{BCE}}{\partial w_1} = (a-y)\cdot x_1" />
      <p>
        The <InlineMath tex="a(1-a)" /> term - the sigmoid&apos;s own derivative - cancels out completely when you
        differentiate cross-entropy loss through a sigmoid. This is a real, well-known simplification, not an
        approximation: it&apos;s why classification networks almost always pair a sigmoid (or softmax) output with
        cross-entropy loss rather than MSE - the combination produces a cleaner, better-behaved gradient.
      </p>
    </div>
  );
}

export function BriefSection() {
  return (
    <ProjectBrief
      courseId="math-for-ml"
      projectId="capstone"
      objective="Build, train, and evaluate the mathematics behind a genuine (if tiny) machine learning system end to end - data representation, a model transformation, a real loss, optimization, a probability interpretation, and an evaluation metric - and be able to explain every stage."
      requirements={[
        "Reset the workspace, then train it (Step repeatedly) until accuracy reaches 100% and every point's red 'misclassified' ring disappears",
        "Record the loss and accuracy every 5 steps until convergence, and note how many steps it took",
        "Pick one data point and interpret its final predicted probability: does a value like 0.92 mean 'the model is 92% likely to be right,' or something more precise? Explain the distinction",
        "Identify which of the two weights (w1 or w2) ended up larger in magnitude, and connect that to which input dimension the boundary line is more sensitive to",
        "Write a short summary connecting every stage - data → transformation → loss → optimization → probability → evaluation - to the specific module in this course that taught it",
      ]}
      hints={[
        "The decision boundary is where z=0 exactly - once it visually separates blue from gold, accuracy should be 100%.",
        "A predicted probability is the model's output for THIS specific point given ITS current weights - not a guarantee, and not the same as measured accuracy across the whole dataset (that distinction is Module 6's territory).",
        "The weight with larger magnitude has more influence on z for a one-unit change in its matching input - look at the boundary line's slope for a visual check.",
      ]}
      rubric={[
        { key: "trainedTo100", label: "Trained the model to 100% accuracy on this dataset" },
        { key: "trackedConvergence", label: "Recorded loss/accuracy every 5 steps and noted the convergence point" },
        { key: "interpretedProbability", label: "Correctly distinguished a single prediction's probability from an aggregate accuracy claim" },
        { key: "connectedWeightMagnitude", label: "Connected which weight was larger to the boundary's sensitivity to that input" },
        { key: "wroteSynthesis", label: "Wrote a synthesis connecting every stage to the module that taught it" },
      ]}
      expectedConcepts={[
        "Data representation",
        "Linear transformation",
        "Cross-entropy loss",
        "Gradient descent",
        "Probability interpretation",
        "Evaluation (accuracy)",
      ]}
    />
  );
}
