import { PCALab } from "@/components/course-engine/PCALab";
import { ProjectBrief } from "@/components/course-engine/projects/ProjectBrief";

export function WorkspaceSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
        Workspace — reusing Module 3&apos;s PCA Lab on a new question
      </span>
      <PCALab />
    </div>
  );
}

export function BriefSection() {
  return (
    <ProjectBrief
      courseId="math-for-ml"
      projectId="pca-explorer"
      objective="Use PCA to make a real, defensible decision: how many dimensions do you actually need to keep, and how do you justify that choice with numbers instead of a guess?"
      requirements={[
        "Set the rotation to 0°, 45°, and 90° and record λ1, λ2, and variance-explained at each",
        "Decide on a variance-explained threshold you'd consider 'safe' to reduce to 1D, and justify your threshold in the reflection",
        "Explain, using this lab's own numbers, why reducing to 1D at a low rotation angle loses more information than at a high one (or vice versa) — check whether it actually does",
        "Describe one real dataset (not from this course) where PCA's variance-based ranking might discard something you actually care about",
      ]}
      hints={[
        "Rotating the data doesn't change λ1/λ2 — you already saw this in Module 3. Use that fact to design your comparison correctly.",
        "'Variance explained' and 'safe to drop' are not the same claim — your justification should explain the gap between them.",
        "The failure-mode callout in Module 3 (the fraud-detection example) is a good template for the real-dataset example.",
      ]}
      rubric={[
        { key: "recorded3angles", label: "Recorded λ1, λ2, and variance-explained at 0°, 45°, and 90°" },
        { key: "pickedThreshold", label: "Picked and justified a variance-explained threshold for '1D is safe'" },
        { key: "checkedInvariance", label: "Correctly determined whether rotation angle affects how much is lost by reducing to 1D" },
        { key: "realExample", label: "Described a realistic case where PCA's ranking could discard something that matters" },
      ]}
      expectedConcepts={["Eigenvalues", "Variance explained", "Dimensionality reduction", "Rotation invariance"]}
    />
  );
}
