import { MatrixLab } from "@/components/course-engine/MatrixLab";
import { MathLevels } from "@/components/course-engine/MathLevels";
import { QuizBlock, type QuizQuestion } from "@/components/course-engine/QuizBlock";
import { InlineMath, BlockMath } from "@/components/course-engine/Math";
import { GuidedTour, type TourStep } from "@/components/course-engine/tour/GuidedTour";
import { ProgressiveHint } from "@/components/course-engine/tour/ProgressiveHint";

/* Module-2-specific MDX section components — "Transforming Data" (matrices
   as linear transformations, determinant/invertibility). Same shared engine
   (MatrixLab, MathLevels, QuizBlock) pattern as module-01-vectors.tsx. */

const TOUR_STEPS: TourStep[] = [
  { target: "matrix-canvas", title: "The grid, transformed", body: "The faint grid is the original plane. The violet parallelogram is where the unit square lands after the matrix transforms it." },
  { target: "matrix-presets", title: "Try the presets first", body: "Click \"Collapse\" — watch the parallelogram flatten to a line. That's det(M)=0 happening visually, before you even look at the number." },
  { target: "matrix-sliders", title: "The four numbers", body: "a, b, c, d are the matrix's entries. Column 1 is (a, c), column 2 is (b, d) — drag one and watch which basis vector in the canvas moves." },
  { target: "matrix-det", title: "The determinant", body: "This single number is exactly the parallelogram's area (with a sign for orientation). Zero means the plane just collapsed onto a line." },
];

export function MatrixLabSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
          Matrix Transformation Lab
        </span>
        <GuidedTour steps={TOUR_STEPS} />
      </div>
      <MatrixLab />
      <ProgressiveHint
        hints={[
          "det(M) = ad − bc. Read the four current slider values (a, b, c, d) directly off their labels, then compute this by hand and compare to the stats panel.",
          "If two columns point in the same (or exactly opposite) direction, the determinant will be zero, no matter what the individual numbers are.",
          "Try setting a=2, b=0, c=0, d=0.5 — one direction stretches, the other shrinks. What do you expect det(M) to be, and does the parallelogram's area match your prediction?",
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
          A 2×2 matrix is a machine that takes in a point and outputs a new point — a function, exactly like{" "}
          <InlineMath tex="f(x) = 2x" /> is a function, except this one takes a whole (x, y) pair at once. Its
          two columns tell you everything: the first column is where (1, 0) ends up, the second is where (0, 1)
          ends up. Every other point moves in a way that&apos;s consistent with those two — that consistency
          (straight lines stay straight, the origin stays put) is what makes it &quot;linear.&quot;
        </p>
      }
      applied={
        <div className="flex flex-col gap-3">
          <p>
            A matrix <InlineMath tex="M" /> and a vector <InlineMath tex="\mathbf{v} = (x, y)" /> combine by
            matrix-vector multiplication:
          </p>
          <BlockMath tex="M\mathbf{v} = \begin{pmatrix} a & b \\ c & d \end{pmatrix}\begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} ax + by \\ cx + dy \end{pmatrix}" />
          <p>The determinant measures how much the transformation scales area (and whether it flips it):</p>
          <BlockMath tex="\det(M) = ad - bc" />
          <p className="text-[#9aa0ae]">
            Every symbol: <InlineMath tex="a, b, c, d" /> are the four numbers you dragged the sliders to in
            the lab. <InlineMath tex="x, y" /> are a point&apos;s coordinates before the transformation.{" "}
            <InlineMath tex="\det(M) = 0" /> means the transformation has no inverse — it collapsed
            two dimensions of information into one (or zero), and that loss can never be undone by another
            matrix.
          </p>
        </div>
      }
      proof={
        <div className="flex flex-col gap-3">
          <p>
            Why does <InlineMath tex="ad - bc" /> measure area? The transformed unit square has corners at{" "}
            <InlineMath tex="(0,0)" />, <InlineMath tex="M\mathbf{e_1} = (a, c)" />,{" "}
            <InlineMath tex="M\mathbf{e_2} = (b, d)" />, and <InlineMath tex="(a+b, c+d)" /> — a parallelogram
            spanned by the two column vectors. The signed area of a parallelogram spanned by{" "}
            <InlineMath tex="(a, c)" /> and <InlineMath tex="(b, d)" /> is exactly the 2D cross product:
          </p>
          <BlockMath tex="\text{Area} = a d - b c = \det(M)" />
          <p>
            This is why <InlineMath tex="\det(M) = 0" /> is exactly the condition for the two column vectors
            to be parallel (pointing along the same line): a parallelogram with zero width has zero area, and
            a matrix whose columns are parallel maps the entire 2D plane onto that one line — an
            irreversible loss of a dimension, which is precisely why such a matrix has no inverse.
          </p>
        </div>
      }
    />
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "A matrix's two columns are (2, 0) and (0, 3). Where does the point (1, 1) end up after this transformation?",
    options: [
      {
        text: "(2, 3)",
        correct: true,
        principle: "Mv = x·(column 1) + y·(column 2) = 1·(2,0) + 1·(0,3) = (2,3).",
      },
      {
        text: "(2, 0)",
        correct: false,
        socratic: "The formula for Mv involves BOTH x·(column 1) AND y·(column 2). Have you included the y-coordinate's contribution at all?",
        whyWrong: "That's only the first column — it ignores the y-coordinate's contribution entirely.",
        misconception: "It's easy to think only the matching column matters and forget the output is a sum of both columns' contributions.",
        principle: "Every output point is x·(column 1) + y·(column 2), a combination of both columns.",
        tryThis: "In the lab, set a=2, d=3, b=c=0, then check where the transformed unit square's far corner (1,1) lands.",
      },
      {
        text: "(3, 2)",
        correct: false,
        socratic: "In Mv = x·(column 1) + y·(column 2), which coordinate (x or y) is paired with which column? Did you keep that pairing, or swap it?",
        whyWrong: "This swaps the two coordinates — the actual formula keeps x with column 1 and y with column 2, not reversed.",
        misconception: "It's easy to transpose the roles of x and y when combining columns.",
        principle: "Mv = x·(column 1) + y·(column 2), in that order.",
      },
    ],
  },
  {
    id: "q2",
    text: "What does it mean when det(M) = 0?",
    options: [
      {
        text: "The transformation collapses the plane onto a line (or a point) — it has no inverse",
        correct: true,
        principle: "Zero determinant means the two columns are parallel (or zero), so 2D information is lost and cannot be recovered.",
      },
      {
        text: "The transformation flips everything upside down",
        correct: false,
        socratic: "A flip (mirror) and a total collapse to a line are very different visual effects. Which one is det(M)=0 actually describing?",
        whyWrong: "A flip corresponds to a negative determinant, not zero — flips still preserve area, just reverse orientation.",
        misconception: "It's easy to associate 'something unusual happened to the sign' generally with zero rather than specifically with negative values.",
        principle: "Negative det = orientation flip. Zero det = dimension collapse. These are different effects.",
      },
      {
        text: "The transformation doesn't change anything (it's the identity)",
        correct: false,
        socratic: "What is det(M) for the actual identity matrix [[1,0],[0,1]]? Is it 0, or something else?",
        whyWrong: "The identity matrix has det = 1, not 0 — it preserves area exactly, it doesn't destroy it.",
        misconception: "It's tempting to associate 'no interesting effect' with zero, when zero is actually the most destructive case.",
        principle: "det(Identity) = (1)(1) - (0)(0) = 1. det = 0 is the opposite case: total area collapse.",
      },
    ],
  },
  {
    id: "q3",
    text: "In a neural network, a linear layer computes y = Wx + b. What does the matrix W's role connect to in this module?",
    options: [
      {
        text: "W transforms the input vector x into a new vector — geometrically the same operation as the lab's matrix transforming points",
        correct: true,
        principle: "A neural network layer's weight matrix is a linear transformation, exactly the object this module studies, just often in many more dimensions.",
      },
      {
        text: "W stores the training data the network has memorized",
        correct: false,
        socratic: "When you drag a slider in the lab, does the MATRIX change, or does the DATA (the grid points) change? Which one does W play the role of?",
        whyWrong: "Training data isn't stored in W — W is a set of learned transformation coefficients, adjusted during training but never literally containing input examples.",
        misconception: "It's a common confusion to think a neural network 'contains' its training examples somewhere inside its weights.",
        principle: "W defines a linear transformation applied to whatever input arrives — its numbers are transformation coefficients, not stored data.",
      },
      {
        text: "W is only used during the first layer, later layers don't use matrices",
        correct: false,
        socratic: "Does anything about a matrix transformation require it to be the FIRST operation applied? Could a matrix transform an already-transformed vector just as easily?",
        whyWrong: "Every linear/dense layer in a network has its own weight matrix — this isn't unique to the first layer.",
        misconception: "It's easy to assume a foundational concept only applies at the 'entry point' of a system.",
        principle: "Every linear layer, at any depth, performs its own matrix transformation on whatever vector reaches it.",
      },
    ],
  },
  {
    id: "q4",
    text: "A matrix has columns (1, 2) and (2, 4). Without computing anything else, what do you already know?",
    options: [
      {
        text: "It's not invertible — the two columns are parallel (one is exactly 2× the other)",
        correct: true,
        principle: "det = (1)(4) - (2)(2) = 0. You can see this instantly because column 2 is column 1 scaled by 2, so they point the same direction.",
      },
      {
        text: "It scales everything by exactly 2",
        correct: false,
        socratic: "What would the two columns of a true 'scale by 2' matrix look like? Do (1,2) and (2,4) match that pattern?",
        whyWrong: "A uniform ×2 scale would have columns (2,0) and (0,2) — this matrix's columns aren't even perpendicular, let alone axis-aligned.",
        misconception: "Seeing the number 2 appear can suggest 'scale by 2' even when the actual structure (parallel columns) means something very different.",
        principle: "Check the relationship between the columns, not just whether a familiar number shows up.",
      },
      {
        text: "Nothing can be determined without computing the full transformation of several points",
        correct: false,
        socratic: "Is det(M) = ad − bc computable directly from the matrix's own four entries, or does it require transforming any points first?",
        whyWrong: "The determinant (and therefore invertibility) can be read directly off the two columns without transforming any points.",
        misconception: "It's easy to assume every property requires running the full computation, when some properties are visible from the raw numbers.",
        principle: "det(M) = ad - bc is computable directly from the four entries, no points needed.",
      },
    ],
  },
  {
    id: "q5",
    text: "Why does the lab show the transformed unit square as a parallelogram with a fill color, not just four dots?",
    options: [
      {
        text: "To make the determinant's meaning (a scaling factor on area) visible, not just a computed number",
        correct: true,
        principle: "Seeing the shaded area change size as you move the sliders is the direct, visual counterpart to det(M) — connecting a formula to something you can see.",
      },
      {
        text: "Because matrices can only transform squares, not arbitrary shapes",
        correct: false,
        socratic: "Does the formula Mv = (ax+by, cx+dy) care what shape the point v happens to belong to?",
        whyWrong: "A matrix transforms every point in the plane identically — it's just as valid to transform a circle, a triangle, or the whole grid, all shown in the lab too.",
        misconception: "It's easy to assume a specific example shape used in a demo is somehow special to the underlying math.",
        principle: "Linear transformations apply uniformly to every point — the unit square is just a convenient, easy-to-see reference shape.",
      },
      {
        text: "It's purely decorative and doesn't correspond to any real quantity",
        correct: false,
        socratic: "Drag a slider and watch both the shaded area AND the det(M) number in the stats panel at the same time — do they change together, or independently?",
        whyWrong: "The shaded area is precisely |det(M)| times the original area — a real, computable quantity, not a decoration.",
        misconception: "Visual elements in a lab can look like styling choices when they're actually encoding a real number.",
        principle: "The fill's area is literally |det(M)| — drag the sliders and watch it track the determinant value shown in the stats panel.",
      },
    ],
  },
];

export function QuizSection() {
  return <QuizBlock moduleId={2} courseId="math-for-ml" questions={QUESTIONS} />;
}
