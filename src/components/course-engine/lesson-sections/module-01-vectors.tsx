import { VectorLab } from "@/components/course-engine/VectorLab";
import { MathLevels } from "@/components/course-engine/MathLevels";
import { QuizBlock, type QuizQuestion } from "@/components/course-engine/QuizBlock";
import { InlineMath, BlockMath } from "@/components/course-engine/Math";
import { GuidedTour, type TourStep } from "@/components/course-engine/tour/GuidedTour";
import { ProgressiveHint } from "@/components/course-engine/tour/ProgressiveHint";

/* Module-1-specific MDX section components - the concrete content for
   "Thinking in Vectors" (dot product / cosine similarity). Each later
   module gets its own small file like this one; the underlying engine
   components (VectorLab, MathLevels, QuizBlock) are shared. */

const TOUR_STEPS: TourStep[] = [
  { target: "vector-canvas", title: "Start here: the two vectors", body: "Gold is a, fixed. Violet is b, yours to drag. Every number on the right recomputes live from wherever you drop b." },
  { target: "dot-product", title: "The dot product", body: "This is a·b - multiply matching coordinates, then add. Drag b so it points opposite to a and watch this number go negative." },
  { target: "cosine-sim", title: "Cosine similarity", body: "This is the dot product, normalized so length stops mattering - only direction does. Try making b much longer without changing its direction: this number won't move." },
];

export function VectorLabSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
          Vector Lab
        </span>
        <GuidedTour steps={TOUR_STEPS} />
      </div>
      <VectorLab />
      <ProgressiveHint
        hints={[
          "Cosine similarity only cares about direction - try changing b's length without changing which way it points, and watch which numbers move and which don't.",
          "The dot product a·b is a₁b₁ + a₂b₂ - multiply matching coordinates, then add. It's the same formula whether the result is positive, negative, or zero.",
          "If a·b comes out negative, the angle between the vectors is more than 90° - dragging b to point roughly opposite a will show you exactly that.",
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
          The dot product multiplies two vectors and adds the results - and that sum ends up telling you
          how much two arrows point the &quot;same way.&quot; Two arrows pointing in the exact same direction
          give the largest possible dot product for their lengths; two arrows at a right angle give exactly
          zero, no matter how long they are; two arrows pointing opposite ways give a negative number.
          Cosine similarity is the same idea, but divided down so length stops mattering - only direction
          does.
        </p>
      }
      applied={
        <div className="flex flex-col gap-3">
          <p>For two vectors <InlineMath tex="\mathbf{a} = (a_1, a_2)" /> and <InlineMath tex="\mathbf{b} = (b_1, b_2)" />:</p>
          <BlockMath tex="\mathbf{a} \cdot \mathbf{b} = a_1 b_1 + a_2 b_2" />
          <p>Magnitude (length) of a vector:</p>
          <BlockMath tex="\|\mathbf{a}\| = \sqrt{a_1^2 + a_2^2}" />
          <p>Cosine similarity - the dot product, normalized by both magnitudes so only direction survives:</p>
          <BlockMath tex="\cos\theta = \frac{\mathbf{a} \cdot \mathbf{b}}{\|\mathbf{a}\|\,\|\mathbf{b}\|}" />
          <p className="text-[#9aa0ae]">
            Every symbol: <InlineMath tex="a_1, a_2, b_1, b_2" /> are the raw coordinates you dragged in the
            lab above. <InlineMath tex="\theta" /> is the angle between the two arrows. The result of
            <InlineMath tex="\cos\theta" /> always lands between <InlineMath tex="-1" /> (opposite
            directions) and <InlineMath tex="1" /> (identical direction) - that fixed range is exactly why
            it&apos;s usable as a &quot;similarity score.&quot;
          </p>
        </div>
      }
      proof={
        <div className="flex flex-col gap-3">
          <p>
            Why does dividing by both magnitudes isolate direction? Start from the law of cosines applied to
            the triangle formed by <InlineMath tex="\mathbf{a}" />, <InlineMath tex="\mathbf{b}" />, and the
            vector between their tips, <InlineMath tex="\mathbf{a} - \mathbf{b}" />:
          </p>
          <BlockMath tex="\|\mathbf{a}-\mathbf{b}\|^2 = \|\mathbf{a}\|^2 + \|\mathbf{b}\|^2 - 2\|\mathbf{a}\|\|\mathbf{b}\|\cos\theta" />
          <p>
            Expand the left side using the definition of the dot product,
            <InlineMath tex="\|\mathbf{v}\|^2 = \mathbf{v}\cdot\mathbf{v}" />:
          </p>
          <BlockMath tex="\mathbf{a}\cdot\mathbf{a} - 2\,\mathbf{a}\cdot\mathbf{b} + \mathbf{b}\cdot\mathbf{b} = \|\mathbf{a}\|^2 + \|\mathbf{b}\|^2 - 2\|\mathbf{a}\|\|\mathbf{b}\|\cos\theta" />
          <p>
            Since <InlineMath tex="\mathbf{a}\cdot\mathbf{a} = \|\mathbf{a}\|^2" /> and{" "}
            <InlineMath tex="\mathbf{b}\cdot\mathbf{b} = \|\mathbf{b}\|^2" />, those terms cancel from both
            sides, leaving:
          </p>
          <BlockMath tex="\mathbf{a}\cdot\mathbf{b} = \|\mathbf{a}\|\|\mathbf{b}\|\cos\theta" />
          <p>
            Rearranged, that&apos;s exactly the cosine similarity formula above - it isn&apos;t a definition pulled out
            of nowhere, it falls directly out of geometry (the law of cosines) plus the algebraic definition
            of a dot product.
          </p>
        </div>
      }
    />
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "Two vectors point in exactly the same direction, but one is twice as long as the other. What is their cosine similarity?",
    options: [
      {
        text: "1",
        correct: true,
        principle: "Cosine similarity measures direction only. Same direction, any length, always gives exactly 1.",
      },
      {
        text: "2, because one vector is twice as long",
        correct: false,
        socratic: "If cosine similarity could go above 1, what would a value like 2 even represent - a direction more aligned than 'identical'? Does that make sense geometrically?",
        whyWrong: "Cosine similarity is bounded between -1 and 1 by construction - it can never be 2.",
        misconception: "This treats cosine similarity like the dot product, which does scale with length.",
        principle: "Dividing by both magnitudes in the formula is specifically what removes length from the result.",
        tryThis: "Try the lab above: drag b so it's a longer version of a's direction and watch cosine similarity stay at 1.00 while the dot product changes.",
      },
      {
        text: "0.5, because the lengths are different",
        correct: false,
        socratic: "Look at the cosine similarity formula again - does it use the vectors' lengths as a ratio anywhere, or does it divide them out completely?",
        whyWrong: "Length ratio has no effect on cosine similarity at all - only the angle between the vectors does.",
        misconception: "It's easy to assume any numeric difference between two vectors must lower a 'similarity' score.",
        principle: "cos(θ) depends only on the angle θ, and here θ = 0° since the directions are identical.",
      },
    ],
  },
  {
    id: "q2",
    text: "Vector a = (3, 0) and vector b = (0, 5) - they are perpendicular. What is a · b?",
    options: [
      {
        text: "0",
        correct: true,
        principle: "3×0 + 0×5 = 0. A dot product of zero always means the vectors are at a 90° angle - this is the definition of orthogonal.",
      },
      {
        text: "15",
        correct: false,
        socratic: "Try computing a·b using a₁b₁ + a₂b₂ directly, term by term, instead of multiplying the two vectors' overall lengths - do you land on 15?",
        whyWrong: "That's 3 × 5 - the product of the magnitudes, not the dot product.",
        misconception: "Multiplying the two lengths together feels like the natural way to 'combine' two vectors, but the dot product multiplies matching coordinates, not overall lengths.",
        principle: "a · b = a₁b₁ + a₂b₂ = (3)(0) + (0)(5) = 0.",
        tryThis: "Recompute by multiplying x-components together, then y-components together, then adding those two results.",
      },
      {
        text: "8",
        correct: false,
        socratic: "Is the dot product defined as adding the raw coordinates together, or multiplying matching coordinates first and then adding those products?",
        whyWrong: "That's 3 + 5, adding the coordinates directly rather than multiplying matching pairs first.",
        misconception: "It's easy to confuse the dot product with simple vector addition.",
        principle: "The dot product multiplies matching components before summing: (3)(0) + (0)(5).",
      },
    ],
  },
  {
    id: "q3",
    text: "In a semantic search engine, why is cosine similarity used to compare embeddings instead of raw dot product?",
    options: [
      {
        text: "Because a longer document's embedding can have larger magnitude, and raw dot product would falsely favor it purely for being long, not more relevant",
        correct: true,
        principle: "Cosine similarity divides out magnitude specifically so 'more relevant' isn't confused with 'bigger vector.'",
      },
      {
        text: "Because cosine similarity is faster to compute than a dot product",
        correct: false,
        socratic: "Cosine similarity requires the dot product PLUS two magnitude (square root) calculations. Is that more arithmetic than a dot product alone, or less?",
        whyWrong: "Cosine similarity requires computing the dot product plus two magnitude calculations - it's strictly more computation, not less.",
        misconception: "Speed sounds like a plausible reason for any engineering choice, but it isn't the actual reason here.",
        principle: "The real reason is correctness: removing magnitude bias, not performance.",
      },
      {
        text: "Dot product only works in 2D, cosine similarity works in any number of dimensions",
        correct: false,
        socratic: "The dot product formula is a₁b₁ + a₂b₂ + ... for as many terms as there are dimensions. Is there anything in that pattern that would break with a third or fourth term?",
        whyWrong: "The dot product formula (sum of matching component products) works identically in any number of dimensions - nothing about it is 2D-specific.",
        misconception: "It's easy to assume the simple visual explanation (2D arrows) is the limit of where the math applies.",
        principle: "Both formulas generalize directly to n dimensions - the lab's 2D arrows are a teaching visualization, not a mathematical limit.",
      },
    ],
  },
  {
    id: "q4",
    text: "A vector's magnitude is 0. What does that mean geometrically?",
    options: [
      {
        text: "It has no length - it's a single point at the origin, with no defined direction",
        correct: true,
        principle: "‖v‖ = 0 only when every coordinate is 0, which collapses the arrow to a point.",
      },
      {
        text: "It points directly along the x-axis",
        correct: false,
        socratic: "If a vector points exactly along the x-axis, what would its y-coordinate be? Would BOTH coordinates be zero, or just one?",
        whyWrong: "Pointing along an axis just means one coordinate is zero, not the whole vector.",
        misconception: "Zero in one coordinate is easy to confuse with the whole vector being zero.",
        principle: "Magnitude 0 requires every coordinate to be 0, not just one of them.",
      },
      {
        text: "It's impossible - every vector has a nonzero magnitude",
        correct: false,
        socratic: "What does √(0² + 0²) actually equal? Is that a valid, computable number, or something undefined?",
        whyWrong: "The zero vector (0, 0) is a completely valid vector with magnitude exactly 0.",
        misconception: "It's tempting to assume 'a vector' always implies some minimum length.",
        principle: "‖(0,0)‖ = √(0² + 0²) = 0 - perfectly well-defined, just degenerate (no direction).",
      },
    ],
  },
  {
    id: "q5",
    text: "Two vectors have a cosine similarity of -1. What does that tell you?",
    options: [
      {
        text: "They point in exactly opposite directions",
        correct: true,
        principle: "cos(180°) = -1. This is the minimum possible cosine similarity, reached only at a perfect opposite direction.",
      },
      {
        text: "They are unrelated / independent",
        correct: false,
        socratic: "Which cosine value corresponds to two truly unrelated (perpendicular) vectors - is it 0, or is it -1?",
        whyWrong: "'Unrelated' corresponds to a cosine similarity near 0 (perpendicular), not -1.",
        misconception: "It's natural to read a negative number as simply 'bad' or 'no relationship,' but -1 is actually the strongest possible signal in the opposite direction.",
        principle: "0 means unrelated (perpendicular); -1 means maximally opposed, which is itself a strong, informative relationship.",
        tryThis: "In the lab above, try dragging b to point exactly opposite to a and watch the value land at -1.00, not near 0.",
      },
      {
        text: "One vector is much larger than the other",
        correct: false,
        socratic: "Does the cosine similarity formula divide the magnitudes out of the result, or leave them factored in?",
        whyWrong: "Cosine similarity has no information about magnitude at all - it's normalized out by design.",
        misconception: "This mixes up the two questions the lab distinguishes: direction (cosine similarity) versus length (magnitude).",
        principle: "Cosine similarity of -1 tells you exclusively about direction (180° apart) - it says nothing about how long either vector is.",
      },
    ],
  },
];

export function QuizSection() {
  return <QuizBlock moduleId={1} courseId="math-for-ml" questions={QUESTIONS} />;
}
