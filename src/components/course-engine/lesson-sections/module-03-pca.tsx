import { PCALab } from "@/components/course-engine/PCALab";
import { MathLevels } from "@/components/course-engine/MathLevels";
import { QuizBlock, type QuizQuestion } from "@/components/course-engine/QuizBlock";
import { InlineMath, BlockMath } from "@/components/course-engine/Math";
import { GuidedTour, type TourStep } from "@/components/course-engine/tour/GuidedTour";
import { ProgressiveHint } from "@/components/course-engine/tour/ProgressiveHint";

/* Module-3-specific MDX section components - "Finding the Important
   Directions" (eigenvectors, eigenvalues, PCA). Same shared engine pattern
   as modules 1 and 2. */

const TOUR_STEPS: TourStep[] = [
  { target: "pca-canvas", title: "The gold and green lines", body: "PC1 (gold) and PC2 (green) are the eigenvectors of this data's own covariance matrix - the directions it's actually spread out in, not axes someone drew on top of it." },
  { target: "pca-rotate", title: "Rotate the whole cloud", body: "Spin the data and watch PC1/PC2 rotate right along with it - proof they're a property of the data's shape, not of the x/y axes." },
  { target: "pca-project", title: "Collapse to 1D", body: "Click this to project every point onto PC1 alone. The 'variance explained' number tells you exactly how much got lost in that collapse." },
  { target: "pca-variance", title: "Variance explained", body: "This is λ1 divided by the total variance - the honest, quantified answer to 'how much would I lose by keeping only PC1?'" },
];

export function PCALabSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
          PCA Laboratory
        </span>
        <GuidedTour steps={TOUR_STEPS} />
      </div>
      <PCALab />
      <ProgressiveHint
        hints={[
          "Set the rotation to 0°, note λ1 and λ2, then set it to 90° and check again - rotation shouldn't change either number, only which way PC1/PC2 point.",
          "Variance explained by PC1 is λ1 divided by (λ1 + λ2) - a ratio, not a count of points or an accuracy score.",
          "Try dragging the rotation slider to somewhere the cloud looks almost circular - what happens to the variance-explained percentage as the two directions become equally spread?",
        ]}
      />
    </div>
  );
}

export function MathLevelsSection() {
  return (
    <MathLevels
      intuition={
        <p>
          Most directions you could draw through a matrix&apos;s transformation get bent - a square becomes a
          slanted parallelogram, like you saw in Module 2. But for almost every matrix, there are one or two
          special directions that don&apos;t bend at all - a vector pointing that way just gets longer or
          shorter, never rotated. Those special, unbending directions are <b>eigenvectors</b>, and how much
          longer they get is the corresponding <b>eigenvalue</b>. For a data cloud, the covariance matrix&apos;s
          eigenvectors point along the directions the data is actually spread out in - which is exactly what
          the lab above is showing you as PC1 and PC2.
        </p>
      }
      applied={
        <div className="flex flex-col gap-3">
          <p>A vector <InlineMath tex="\mathbf{v}" /> is an eigenvector of matrix <InlineMath tex="M" /> with eigenvalue <InlineMath tex="\lambda" /> when:</p>
          <BlockMath tex="M\mathbf{v} = \lambda\mathbf{v}" />
          <p>For PCA, <InlineMath tex="M" /> is the data&apos;s covariance matrix, built from the mean-centered data:</p>
          <BlockMath tex="S = \begin{pmatrix} \operatorname{Var}(x) & \operatorname{Cov}(x,y) \\ \operatorname{Cov}(x,y) & \operatorname{Var}(y) \end{pmatrix}" />
          <p>Its two eigenvalues (for a 2×2 matrix) come from the quadratic formula applied to its trace and determinant:</p>
          <BlockMath tex="\lambda = \frac{\operatorname{tr}(S)}{2} \pm \sqrt{\left(\frac{\operatorname{tr}(S)}{2}\right)^2 - \det(S)}" />
          <p className="text-[#9aa0ae]">
            Every symbol: <InlineMath tex="\operatorname{Var}(x)" />/<InlineMath tex="\operatorname{Var}(y)" /> are
            how spread out the data is along each raw axis; <InlineMath tex="\operatorname{Cov}(x,y)" /> is how much
            those two axes move together (the number the lab&apos;s rotation slider directly changes).{" "}
            <InlineMath tex="\lambda_1" /> (the larger eigenvalue) is exactly the &quot;variance along PC1&quot;
            number shown in the lab&apos;s stats panel.
          </p>
        </div>
      }
      proof={
        <div className="flex flex-col gap-3">
          <p>
            Where does <InlineMath tex="M\mathbf{v} = \lambda\mathbf{v}" /> come from? Rearranging gives{" "}
            <InlineMath tex="(M - \lambda I)\mathbf{v} = \mathbf{0}" />. A nonzero vector <InlineMath tex="\mathbf{v}" /> can
            only satisfy this if <InlineMath tex="M - \lambda I" /> is not invertible - recall from Module 2 that a
            matrix fails to be invertible exactly when its determinant is zero. So eigenvalues are the solutions to:
          </p>
          <BlockMath tex="\det(M - \lambda I) = 0" />
          <p>For a 2×2 matrix, this &quot;characteristic equation&quot; expands to a quadratic in <InlineMath tex="\lambda" />:</p>
          <BlockMath tex="(a-\lambda)(d-\lambda) - bc = 0 \;\Longrightarrow\; \lambda^2 - (a+d)\lambda + (ad-bc) = 0" />
          <p>
            Solving this quadratic (using <InlineMath tex="a+d = \operatorname{tr}(M)" /> and{" "}
            <InlineMath tex="ad-bc = \det(M)" />) via the standard quadratic formula gives exactly the two-eigenvalue
            formula shown at the Applied Math level - it isn&apos;t a separate rule, it falls directly out of the same
            invertibility idea from Module 2, applied to <InlineMath tex="M - \lambda I" /> instead of <InlineMath tex="M" /> itself.
          </p>
        </div>
      }
    />
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "You rotate the data cloud in the lab by 90°. What happens to the eigenvalues λ1 and λ2?",
    options: [
      {
        text: "They stay exactly the same - only the PC1/PC2 directions rotate with the data",
        correct: true,
        principle: "Eigenvalues measure how much variance exists in the data's own structure, which doesn't change just because you rotated it - only which raw x/y axis that variance lines up with changes.",
      },
      {
        text: "They swap: λ1 becomes λ2 and vice versa",
        correct: false,
        socratic: "Try it: set the slider to 0°, note the two eigenvalues, then set it to 90°. Did the two NUMBERS actually swap, or did something else move instead?",
        whyWrong: "A 90° rotation doesn't swap which amount of spread is 'more' - the direction that had the most variance before rotation still has the most variance after, it's just pointing a different way now.",
        misconception: "It's easy to assume a 90° rotation must 'flip' every labeled quantity, when only the directions (not the amounts) actually rotate.",
        principle: "λ1 is defined as whichever eigenvalue is larger - rotating the data doesn't change which physical spread is bigger, so it stays λ1.",
        tryThis: "Set the slider to 0°, note λ1 and λ2, then set it to 90° and compare - the two numbers should match your earlier reading almost exactly.",
      },
      {
        text: "They both increase, because rotation adds energy to the system",
        correct: false,
        socratic: "Does rotating a rigid shape stretch or compress it in any way, or does it only change which direction it's facing?",
        whyWrong: "Rotation is a rigid transformation - it doesn't stretch or compress anything, so the total spread of the data (and therefore both eigenvalues) is preserved exactly.",
        misconception: "It's tempting to think any transformation 'adds' something, but a pure rotation changes orientation only, not scale.",
        principle: "Rotation matrices have determinant 1 and preserve all distances and areas - variance is unaffected.",
      },
    ],
  },
  {
    id: "q2",
    text: "What does it mean for the lab's data to have 95% of its variance explained by PC1?",
    options: [
      {
        text: "Almost all the useful spread in the data lies along one direction - you could reduce it to 1D and lose very little information",
        correct: true,
        principle: "Variance-explained is exactly the justification for dimensionality reduction: if one direction carries nearly all the information, dropping the rest costs little.",
      },
      {
        text: "95% of the individual data points lie exactly on the PC1 line",
        correct: false,
        socratic: "Is variance explained computed from individual points sitting exactly somewhere, or from an aggregate ratio (λ1 over the total)?",
        whyWrong: "Variance explained is a statement about total spread (a single aggregate number), not about what fraction of points sit exactly on a line - in a real dataset, almost no point lies exactly on PC1.",
        misconception: "It's easy to read a percentage about a whole dataset's variance as if it were a percentage of individual points meeting some criterion.",
        principle: "It's λ1 / (λ1 + λ2) - a ratio of variances, not a count or fraction of points.",
      },
      {
        text: "PC1 is 95% accurate at predicting each point's exact location",
        correct: false,
        socratic: "Does PCA ever make a prediction about anything, or does it only describe how spread out existing data already is?",
        whyWrong: "PCA isn't a prediction method and has no 'accuracy' in that sense - it's a description of how spread out the data is in different directions.",
        misconception: "It's common to reach for a 'prediction accuracy' framing for any percentage that shows up near a model or dataset.",
        principle: "Variance explained describes how the data's spread is distributed across directions, not predictive accuracy.",
      },
    ],
  },
  {
    id: "q3",
    text: "In an embedding model with 768 dimensions, why might someone run PCA before visualizing the embeddings on a 2D scatter plot?",
    options: [
      {
        text: "To find the 2 directions that capture the most variance in the 768-dimensional data, so the 2D plot is as faithful a summary as possible",
        correct: true,
        principle: "This is exactly what PCA is for: reducing dimensionality while keeping as much real structure (variance) as the target number of dimensions can hold.",
      },
      {
        text: "Because a 768-dimensional plot literally cannot be drawn on a screen, and PCA is the only mathematical operation that can shrink a vector",
        correct: false,
        socratic: "Could you shrink a 768-number vector down to 2 numbers just by picking any 2 of them directly? If so, is PCA really the ONLY way to reduce dimension?",
        whyWrong: "Plenty of other operations shrink a vector's dimension (just picking 2 of the 768 numbers, for instance) - PCA isn't uniquely capable of reducing dimension, it's specifically good at doing so while preserving variance.",
        misconception: "It's easy to conflate 'the only way to do X' with 'the standard, well-justified way to do X.'",
        principle: "PCA's specific value is choosing the reduced dimensions to preserve as much real spread/information as possible, not merely making the numbers smaller.",
      },
      {
        text: "PCA makes the embeddings more accurate",
        correct: false,
        socratic: "Reducing 768 numbers down to 2 necessarily throws information away. Can throwing information away make something MORE accurate?",
        whyWrong: "PCA doesn't improve or correct the embeddings - it only picks a lower-dimensional viewpoint that shows off as much of their existing structure as possible. It can only lose information relative to the full embedding, never add accuracy.",
        misconception: "It's easy to assume any 'processing step' applied to model output must be making it better.",
        principle: "PCA for visualization is a lossy compression choice made for human-viewable convenience, not an accuracy improvement.",
      },
    ],
  },
  {
    id: "q4",
    text: "A covariance matrix has Cov(x, y) = 0 (no correlation between x and y at all). What do you know about its eigenvectors?",
    options: [
      {
        text: "They point exactly along the raw x and y axes",
        correct: true,
        principle: "When off-diagonal covariance is 0, the matrix is already diagonal - its eigenvectors are the standard basis vectors (1,0) and (0,1), no rotation needed to find the 'special' directions.",
      },
      {
        text: "The eigenvectors can't be determined without more information",
        correct: false,
        socratic: "With Cov(x,y)=0, is the matrix already diagonal? What are the eigenvectors of a diagonal matrix, specifically?",
        whyWrong: "A covariance matrix with zero off-diagonal entries is fully determined - its eigenvectors are guaranteed to be the axis-aligned (1,0) and (0,1), regardless of the specific variance values on the diagonal.",
        misconception: "It's easy to assume eigenvectors always require solving something nontrivial, even in this special, already-diagonal case.",
        principle: "A diagonal matrix's eigenvectors are always the standard basis vectors - this is a direct consequence of the eigenvector equation Mv = λv.",
      },
      {
        text: "The eigenvectors point at a 45° angle between the axes",
        correct: false,
        socratic: "A 45° eigenvector direction happens when the axes need to be rotated to find the special directions. If Cov(x,y)=0, do the axes need rotating at all?",
        whyWrong: "A 45° eigenvector direction actually shows up in the opposite case - when Var(x) = Var(y) and covariance is nonzero (or specific symmetric cases) - not when covariance is zero.",
        misconception: "45° is a common 'default guess' for an angle when the real relationship isn't yet clear.",
        principle: "Zero covariance means the axes are already the special (unbending) directions - no rotation is needed to align with them.",
      },
    ],
  },
  {
    id: "q5",
    text: "Why is Mv = λv specifically about matrices not rotating certain vectors, rather than about matrices in general?",
    options: [
      {
        text: "Because for most matrices, most vectors DO get rotated (turned to point a new direction) - eigenvectors are the exceptions that only get scaled",
        correct: true,
        principle: "This is exactly the definition: λv is a scaled version of v, pointing the same (or exactly opposite) direction - the equation only holds for the special directions that don't get turned.",
      },
      {
        text: "All vectors satisfy Mv = λv for some λ, so the equation doesn't distinguish anything special",
        correct: false,
        socratic: "Mv = λv requires the OUTPUT to point along the same line as the INPUT. Does an arbitrary transformed vector generally still point the same way it started?",
        whyWrong: "Only a small number of specific directions (at most 2, for a 2x2 matrix) satisfy this equation - most vectors, when transformed, point in a genuinely different direction than before, which can't be written as any scalar times the original vector.",
        misconception: "It's easy to assume an equation with a free variable (λ) can always be satisfied by picking the right λ, when actually the direction constraint rules out almost every vector.",
        principle: "Mv = λv requires the OUTPUT to point along the same line as the INPUT - that's a strong geometric constraint most vectors fail.",
      },
      {
        text: "Because eigenvectors are only defined for covariance matrices, not matrices in general",
        correct: false,
        socratic: "In Module 2, did the equation Mv=λv ever get restricted to a specific kind of matrix, or was M just any matrix?",
        whyWrong: "Eigenvectors are a general concept for any square matrix - PCA is just one specific, very common application of them to a covariance matrix.",
        misconception: "Learning eigenvectors for the first time through PCA can make it seem like a PCA-specific idea rather than a general one.",
        principle: "Every square matrix has eigenvectors/eigenvalues (possibly complex-valued); covariance matrices are a nice case because they're symmetric, which guarantees real eigenvalues and perpendicular eigenvectors.",
      },
    ],
  },
];

export function QuizSection() {
  return <QuizBlock moduleId={3} courseId="math-for-ml" questions={QUESTIONS} />;
}
