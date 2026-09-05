import { AttentionLab } from "@/components/course-engine/AttentionLab";
import { MathLevels } from "@/components/course-engine/MathLevels";
import { QuizBlock, type QuizQuestion } from "@/components/course-engine/QuizBlock";
import { InlineMath, BlockMath } from "@/components/course-engine/Math";
import { ProgressiveHint } from "@/components/course-engine/tour/ProgressiveHint";

export function AttentionLabSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
        Attention Lab
      </span>
      <AttentionLab />
      <ProgressiveHint
        hints={[
          "Set the query to 'mouse' and look at the raw dot-product scores before softmax — which word scores highest, and why might its vector point in a similar direction?",
          "Now look at the softmax weights after normalization — do they still sum to 1, and does the highest-scoring word dominate even more after exponentiation?",
          "Try a query with two candidates whose scores are close together — does softmax split the weight more evenly between them than a huge score gap would?",
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
          Attention answers one question for every word in a sentence: &quot;how relevant is every OTHER word
          to understanding me?&quot; It computes that relevance using Module 1&apos;s dot product (larger dot
          product, more aligned direction, more relevant), turns those raw relevance scores into proper
          probabilities that sum to 1 using softmax (Module 9&apos;s territory — softmax is closely related to
          the entropy/probability ideas from that module), and then builds its output as a weighted blend of
          every word&apos;s information, weighted exactly by that relevance.
        </p>
      }
      applied={
        <div className="flex flex-col gap-3">
          <p>For a query vector <InlineMath tex="q" /> and a set of key vectors <InlineMath tex="k_i" />, raw attention scores are scaled dot products:</p>
          <BlockMath tex="\text{score}_i = \frac{q \cdot k_i}{\sqrt{d}}" />
          <p>Softmax turns those scores into weights that sum to 1:</p>
          <BlockMath tex="\text{weight}_i = \frac{e^{\text{score}_i}}{\sum_j e^{\text{score}_j}}" />
          <p>The output is a weighted sum of value vectors <InlineMath tex="v_i" /> (in the lab, values are the same as the key vectors, for simplicity):</p>
          <BlockMath tex="\text{output} = \sum_i \text{weight}_i \cdot v_i" />
          <p className="text-[#9aa0ae]">
            Every symbol: <InlineMath tex="q\cdot k_i" /> is exactly Module 1&apos;s dot product.{" "}
            <InlineMath tex="\sqrt{d}" /> (where <InlineMath tex="d" /> is the vector dimension) rescales the
            scores so they don&apos;t grow too large as dimension increases. The softmax is what makes this a
            genuine <i>weighted average</i> instead of just a list of unbounded scores.
          </p>
        </div>
      }
      proof={
        <div className="flex flex-col gap-3">
          <p>
            Why divide by <InlineMath tex="\sqrt{d}" /> specifically? If a query and key&apos;s entries are
            independent with variance 1, their dot product&apos;s variance grows with the dimension{" "}
            <InlineMath tex="d" />:
          </p>
          <BlockMath tex="\operatorname{Var}(q \cdot k) = \operatorname{Var}\!\left(\sum_{i=1}^d q_ik_i\right) = d \cdot \operatorname{Var}(q_ik_i)" />
          <p>
            As <InlineMath tex="d" /> grows (real transformer embeddings can have hundreds of dimensions),
            unscaled dot products can become very large in magnitude. Feeding very large numbers into softmax
            makes it behave almost like a hard maximum — nearly all the weight collapses onto whichever single
            key has the largest score, and gradients through the softmax become nearly zero everywhere else,
            making the network hard to train. Dividing by <InlineMath tex="\sqrt{d}" /> exactly compensates for
            the variance growing linearly with <InlineMath tex="d" />, keeping scores in a well-behaved range
            regardless of how many dimensions the embeddings have — a real, deliberate engineering fix, not an
            arbitrary constant.
          </p>
        </div>
      }
    />
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "You set the query to 'mouse.' Which other word should receive the highest attention weight, based on the vectors in the lab?",
    options: [
      {
        text: "keyboard — its vector points in a very similar direction to mouse's vector",
        correct: true,
        principle: "Attention weight is driven by dot product (direction alignment) — 'keyboard' and 'mouse' were deliberately placed close together, exactly like Module 1's cosine similarity idea.",
      },
      {
        text: "cat — because it's listed first",
        correct: false,
        socratic: "Attention weight comes from the query·key dot product, a computation on vector values. Does list order ever appear anywhere in that formula?",
        whyWrong: "Order in a list has no effect on the actual computed dot product or attention weight — only the vectors' directions and magnitudes matter.",
        misconception: "It's easy to assume position/order carries some default significance, when the math only cares about the vector values.",
        principle: "Attention weights come strictly from the query·key dot products — recompute by hand: mouse's vector is much closer in direction to keyboard's than to cat's.",
        tryThis: "Click 'mouse' as the query in the lab and read off the actual weight bars — keyboard should visibly dominate.",
      },
      {
        text: "queen — since it's the most different, and different things get more attention",
        correct: false,
        socratic: "Higher dot product means MORE aligned direction, and softmax turns higher scores into higher weight. Does 'most different direction' produce a high or low dot product?",
        whyWrong: "The opposite is true — a LARGER dot product (more similar direction) produces a higher softmax weight, not a smaller one. queen's vector points in a very different direction from mouse's, giving it a low, not high, weight.",
        misconception: "It's easy to assume 'attention' means 'attention to what's unusual,' when it actually means 'weight proportional to relevance/similarity' as defined by the dot product.",
        principle: "Higher dot product (more aligned direction) → higher attention weight, not lower.",
      },
    ],
  },
  {
    id: "q2",
    text: "Why does the lab use softmax instead of just normalizing the raw dot-product scores by dividing by their sum?",
    options: [
      {
        text: "Raw dot products can be negative, and dividing negative numbers by a sum doesn't produce valid probability-like weights the way exponentiating first (as softmax does) reliably does",
        correct: true,
        principle: "Softmax's exponentiation guarantees every weight is positive before normalizing, which plain division can't guarantee when scores can be negative — this module's own lab includes negative dot products (e.g. mouse vs. queen).",
      },
      {
        text: "Softmax and plain normalization always give identical results, so it's just a stylistic choice",
        correct: false,
        socratic: "If one of the raw scores is negative, dividing it by the sum of all scores can produce a negative 'weight.' Can a probability-like weight ever legitimately be negative?",
        whyWrong: "They generally give different results, especially when scores are negative or very spread out — softmax's exponentiation changes the RELATIVE weighting, not just rescaling the same numbers.",
        misconception: "It's easy to assume two ways of 'turning numbers into weights that sum to 1' must be equivalent.",
        principle: "Try computing plain-normalized weights vs. softmax weights by hand for two of the lab's scores — they differ, and only softmax handles negative scores sensibly.",
      },
      {
        text: "Softmax is used purely for historical/traditional reasons with no mathematical justification",
        correct: false,
        socratic: "Softmax guarantees every weight is positive and differentiable everywhere, which matters for gradient-based training. Does 'just tradition' explain why those specific properties are needed?",
        whyWrong: "Softmax has real mathematical properties (always positive, always sums to 1, differentiable everywhere, connects to the entropy/probability framework from Module 9) — these are concrete justifications, not tradition alone.",
        misconception: "It's easy to dismiss a standard tool as 'just convention' before understanding the specific properties that make it the right tool.",
        principle: "Softmax's guaranteed positivity and smooth differentiability (important for gradient-based training) are concrete, checkable reasons for its use.",
      },
    ],
  },
  {
    id: "q3",
    text: "In a real transformer, what plays the role of the fixed 2D vectors used in this lab?",
    options: [
      {
        text: "Learned embedding vectors, typically hundreds of dimensions, produced by earlier layers of the network rather than hand-placed",
        correct: true,
        principle: "The lab's 2D vectors are a teaching simplification of the same underlying object — a real model's query/key/value vectors are learned through training, not manually positioned.",
      },
      {
        text: "The raw text characters of each word, unprocessed",
        correct: false,
        socratic: "A dot product needs two numeric vectors. Can you take a dot product directly on raw text characters, or does something need to happen first?",
        whyWrong: "Raw characters aren't vectors and can't be dot-producted directly — text is first converted into numeric embedding vectors (through a separate, earlier process) before attention's math can apply to them.",
        misconception: "It's easy to skip over the embedding step and imagine attention operating directly on raw text.",
        principle: "Attention operates on numeric vectors; converting words to those vectors (embedding) is a distinct, prior step in the pipeline.",
      },
      {
        text: "The model's final output predictions",
        correct: false,
        socratic: "Query/key/value vectors get consumed WITHIN one attention layer to produce that layer's output, which then feeds into more layers. Is that the same thing as the model's very last, final answer?",
        whyWrong: "Query/key/value vectors are intermediate representations used WITHIN a layer to compute attention — they aren't the model's final predicted output, which comes after many more layers of processing.",
        misconception: "It's easy to conflate an intermediate computation with the end result of the whole model.",
        principle: "Query/key/value vectors are internal, layer-specific representations, not the model's final answer.",
      },
    ],
  },
  {
    id: "q4",
    text: "Why does this module divide dot-product scores by √d before applying softmax, rather than skipping that step?",
    options: [
      {
        text: "Without it, scores can grow large as the vector dimension increases, pushing softmax toward an almost all-or-nothing distribution and making gradients too small to train the network well",
        correct: true,
        principle: "This is exactly the Full Derivation level's variance argument — √d scaling is a deliberate fix for a real numerical/training problem, not decoration.",
      },
      {
        text: "It has no real effect and could safely be removed without changing anything",
        correct: false,
        socratic: "The variance of q·k grows with the dimension d. If you removed the 1/√d scaling, would larger-dimension scores still push softmax toward the same behavior as smaller-dimension scores?",
        whyWrong: "Removing the scaling changes the actual computed attention weights whenever scores are large enough to matter — it's not a no-op, it's precisely calibrated to the dimension d.",
        misconception: "It's easy to assume a small-looking mathematical adjustment must be cosmetic.",
        principle: "The scaling factor 1/√d is derived from a specific variance argument, not chosen arbitrarily or redundantly.",
      },
      {
        text: "It's only relevant for the specific 2D example in this lab and wouldn't apply to real transformers",
        correct: false,
        socratic: "Real transformer embeddings have hundreds of dimensions, not just 2. Does the variance-growth problem this scaling fixes get smaller or larger as dimension increases?",
        whyWrong: "This scaling is standard in real transformer implementations (it's literally called 'scaled dot-product attention' in the original research), and matters MORE at the hundreds-of-dimensions scale real models use, not less.",
        misconception: "It's easy to assume a small teaching example's details don't generalize, when this particular detail is exactly what production systems also do.",
        principle: "√d scaling is a real, standard component of attention as used in production transformer architectures.",
      },
    ],
  },
  {
    id: "q5",
    text: "How does this module's attention mechanism connect back to Module 1's cosine similarity?",
    options: [
      {
        text: "Both are fundamentally asking 'how aligned are these two vectors' directions' — attention's dot product (before softmax) is the same underlying comparison, just used to weight a combination of many vectors instead of producing a single similarity score",
        correct: true,
        principle: "This is the whole point of building the course in this order — the dot product from Module 1 turns out to be the computational core of one of the most important mechanisms in modern deep learning.",
      },
      {
        text: "They're unrelated mathematical ideas that happen to both involve vectors",
        correct: false,
        socratic: "Attention's raw score before softmax IS a dot product — the exact same formula Module 1 used for cosine similarity. Is sharing the identical underlying formula 'unrelated'?",
        whyWrong: "Both are built directly on the dot product — attention's raw scores ARE dot products (scaled), the exact same operation Module 1 introduced for measuring vector similarity.",
        misconception: "It's easy to see two techniques with different names in different contexts and assume no shared mathematical foundation.",
        principle: "The dot product computed in the lab's attention scores is literally the same formula as Module 1's dot product — just applied to more vectors at once and followed by softmax.",
      },
      {
        text: "Attention replaced the need for cosine similarity entirely in modern ML",
        correct: false,
        socratic: "Cosine similarity is still used for tasks like search and direct comparison, separate from attention's role of building weighted combinations inside a model. Does one technique existing make a different-purpose technique obsolete?",
        whyWrong: "Cosine similarity and attention are used for different purposes and both remain common — cosine similarity for direct similarity comparisons (like search), attention for building context-aware combinations within a model — attention didn't make cosine similarity obsolete.",
        misconception: "It's easy to assume a newer, more complex technique must fully supersede a simpler, earlier one.",
        principle: "Attention builds on the same dot-product idea as cosine similarity, extended with scaling and softmax for a different purpose (weighted combination, not a single similarity score).",
      },
    ],
  },
];

export function QuizSection() {
  return <QuizBlock moduleId={11} courseId="math-for-ml" questions={QUESTIONS} />;
}
