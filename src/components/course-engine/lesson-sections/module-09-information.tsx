import { EntropyLab } from "@/components/course-engine/EntropyLab";
import { MathLevels } from "@/components/course-engine/MathLevels";
import { QuizBlock, type QuizQuestion } from "@/components/course-engine/QuizBlock";
import { InlineMath, BlockMath } from "@/components/course-engine/Math";
import { GuidedTour, type TourStep } from "@/components/course-engine/tour/GuidedTour";
import { ProgressiveHint } from "@/components/course-engine/tour/ProgressiveHint";

const TOUR_STEPS: TourStep[] = [
  { target: "entropy-canvas", title: "Two distributions, side by side", body: "Blue bars are p (the truth). Violet bars are q (a prediction). They're independently normalized - each set always sums to 1." },
  { target: "entropy-p-sliders", title: "The true distribution", body: "These 4 sliders set the real, ground-truth probabilities. Think of them as 'what actually happens.'" },
  { target: "entropy-q-sliders", title: "The predicted distribution", body: "These set a model's predicted probabilities. Try making one of q's sliders very low for a category where p is high." },
  { target: "entropy-kl", title: "KL divergence", body: "This number is the 'extra cost' of using q instead of the true p - watch it spike when a prediction is confidently wrong." },
];

export function EntropyLabSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
          Entropy Lab
        </span>
        <GuidedTour steps={TOUR_STEPS} />
      </div>
      <EntropyLab />
      <ProgressiveHint
        hints={[
          "Set q's sliders to match p's sliders exactly (same ratios) - KL divergence should drop to essentially 0.",
          "Cross-entropy H(p,q) is always at least as large as entropy H(p) - the gap between them IS the KL divergence, by definition.",
          "Try dragging one of q's sliders to its minimum for a category where p is large - the resulting -log2(q_i) term grows very fast as q_i approaches 0.",
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
          <b>Entropy</b> measures how surprising, on average, outcomes from a distribution are - a coin that&apos;s
          always heads has zero surprise (zero entropy), while a fair coin is maximally unpredictable (maximum
          entropy for two outcomes). <b>Cross-entropy</b> asks a related but different question: if reality
          follows distribution p, but you&apos;re making predictions using distribution q instead, how surprised are
          you on average? If q perfectly matches p, cross-entropy equals entropy - no extra surprise. The gap
          between them, called <b>KL divergence</b>, is exactly the extra confusion your mismatched
          predictions cost you.
        </p>
      }
      applied={
        <div className="flex flex-col gap-3">
          <p>Entropy of a distribution <InlineMath tex="p" /> over categories:</p>
          <BlockMath tex="H(p) = -\sum_i p_i \log_2 p_i" />
          <p>Cross-entropy between true distribution <InlineMath tex="p" /> and predicted distribution <InlineMath tex="q" />:</p>
          <BlockMath tex="H(p, q) = -\sum_i p_i \log_2 q_i" />
          <p>KL divergence - the &quot;extra cost&quot; of using q instead of the true p:</p>
          <BlockMath tex="D_{KL}(p \parallel q) = H(p,q) - H(p) = \sum_i p_i \log_2\frac{p_i}{q_i}" />
          <p className="text-[#9aa0ae]">
            Every symbol: <InlineMath tex="p_i" />/<InlineMath tex="q_i" /> are the normalized bar heights in
            the lab. Since <InlineMath tex="\log_2 q_i \le \log_2 p_i" /> whenever <InlineMath tex="q_i \le p_i" />,
            a confident-but-wrong prediction (small <InlineMath tex="q_i" /> where the true <InlineMath tex="p_i" /> is
            large) makes <InlineMath tex="-\log_2 q_i" /> very large - this is exactly why cross-entropy loss
            punishes confident wrong predictions so heavily.
          </p>
        </div>
      }
      proof={
        <div className="flex flex-col gap-3">
          <p>
            Why is <InlineMath tex="D_{KL}(p\parallel q) \ge 0" /> always, with equality only when{" "}
            <InlineMath tex="p = q" /> exactly? This follows from Jensen&apos;s inequality applied to the
            (concave) log function:
          </p>
          <BlockMath tex="D_{KL}(p\parallel q) = \sum_i p_i \log_2\frac{p_i}{q_i} = -\sum_i p_i \log_2\frac{q_i}{p_i} \ge -\log_2\left(\sum_i p_i \cdot \frac{q_i}{p_i}\right) = -\log_2\left(\sum_i q_i\right) = -\log_2(1) = 0" />
          <p>
            The middle inequality is Jensen&apos;s inequality: for a concave function like{" "}
            <InlineMath tex="\log_2" />, the average of the function is less than or equal to the function of
            the average - flipping the sign (since we negated) gives the{" "}
            <InlineMath tex="\ge" /> direction shown. This is exactly why cross-entropy{" "}
            <InlineMath tex="H(p,q)" /> can never be smaller than the true entropy{" "}
            <InlineMath tex="H(p)" /> - you cannot be predicting better than the truth&apos;s own inherent
            unpredictability, only worse or exactly as well (when <InlineMath tex="q=p" />).
          </p>
        </div>
      }
    />
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "In the lab, you set q so that one category has a very small probability, but the true p for that same category is large. What happens to the cross-entropy?",
    options: [
      {
        text: "It increases sharply, since -log2(q_i) becomes very large when q_i is small but p_i is not",
        correct: true,
        principle: "This is exactly why confidently wrong predictions are punished so heavily by cross-entropy - a near-zero predicted probability for something that actually happens contributes a huge penalty term.",
      },
      {
        text: "It decreases, because a smaller number (q_i) was used in the formula",
        correct: false,
        socratic: "-log2(q_i) has a NEGATIVE sign in front of the logarithm. As q_i shrinks toward 0, does -log2(q_i) shrink too, or does it grow?",
        whyWrong: "q_i appears inside a logarithm with a negative sign - a smaller q_i makes -log2(q_i) LARGER (more positive), not smaller.",
        misconception: "It's easy to assume 'plugging in a smaller number' always makes a formula's output smaller, without checking how that number is actually used.",
        principle: "-log2(q_i) grows without bound as q_i approaches 0 - a small predicted probability for something that happens is heavily penalized, the opposite of a small output.",
        tryThis: "In the lab, drag one of q's sliders down to near its minimum while keeping p's matching slider high, and watch the cross-entropy number.",
      },
      {
        text: "Nothing changes, since cross-entropy only depends on p, not q",
        correct: false,
        socratic: "Look at the formula H(p,q) = -Σp_i log2(q_i) - does the variable q appear anywhere in it?",
        whyWrong: "The formula H(p,q) = -Σp_i log2(q_i) has q inside the logarithm - cross-entropy depends directly and heavily on q, not just p.",
        misconception: "It's easy to mix up entropy H(p) (which depends only on p) with cross-entropy H(p,q) (which genuinely depends on both).",
        principle: "Entropy uses only p; cross-entropy specifically measures how well q's predictions align with p, so q matters a great deal.",
      },
    ],
  },
  {
    id: "q2",
    text: "You set q exactly equal to p. What should D_KL(p ‖ q) equal?",
    options: [
      {
        text: "Exactly 0",
        correct: true,
        principle: "KL divergence is 0 precisely when the two distributions are identical - there's no 'extra surprise' from predicting q when q IS the truth.",
      },
      {
        text: "The maximum possible value, since KL divergence measures difference and there's a lot of 'information' in a full distribution",
        correct: false,
        socratic: "If p and q are set to be exactly identical, is there any actual DIFFERENCE between them for KL divergence to measure?",
        whyWrong: "KL divergence measures the DIFFERENCE between two distributions - when they're identical, that difference is minimal (zero), not maximal.",
        misconception: "It's easy to conflate 'has a lot of information content' (true of any real distribution) with 'is very different from another distribution' (only true when they actually differ).",
        principle: "D_KL measures mismatch, not information content - identical distributions have zero mismatch by definition.",
      },
      {
        text: "It depends on which specific distribution p and q happen to be, even when they're equal",
        correct: false,
        socratic: "D_KL(p ‖ q) = H(p,q) - H(p). If p and q are the same distribution, is there any 'extra' bits wasted predicting one from the other?",
        whyWrong: "The Full Derivation shows D_KL(p‖q) ≥ 0 with equality exactly when p=q, for ANY distribution - this isn't case-by-case, it's a general mathematical guarantee.",
        misconception: "It's easy to assume every quantity varies case-by-case rather than recognizing a general, provable property.",
        principle: "D_KL(p‖p) = 0 always, as a direct consequence of the Jensen's-inequality argument in the Full Derivation level.",
      },
    ],
  },
  {
    id: "q3",
    text: "Why is cross-entropy loss such a common choice for training classifiers, based on this module?",
    options: [
      {
        text: "It directly measures how well the model's predicted probability distribution matches the true labels' distribution, and heavily penalizes confident wrong predictions - exactly the behavior you want from a classification loss",
        correct: true,
        principle: "Cross-entropy loss for classification is literally H(p,q) from this module, with p being the true (one-hot) label distribution and q the model's predicted probabilities.",
      },
      {
        text: "It's simpler to compute than any alternative loss function",
        correct: false,
        socratic: "Cross-entropy's real justification is about what it MEASURES (extra bits from a wrong prediction), not how easy the arithmetic is. What does H(p,q) actually measure?",
        whyWrong: "Simplicity isn't the reason it's chosen - mean squared error is arguably simpler to compute and is sometimes used instead for other reasons, but cross-entropy is preferred specifically for its probabilistic interpretation and gradient behavior for classification.",
        misconception: "It's easy to assume the most common tool must be the simplest one, when it's actually chosen for its specific mathematical properties.",
        principle: "Cross-entropy is chosen because of what it measures (distributional mismatch, with heavy penalties for confident errors), not primarily for computational simplicity.",
      },
      {
        text: "It guarantees the model will never make a confident wrong prediction",
        correct: false,
        socratic: "Cross-entropy is a loss to minimize during training, not a constraint the model is forced to obey at prediction time. Can a trained model still be confidently wrong on a new example?",
        whyWrong: "Cross-entropy loss penalizes confident wrong predictions heavily DURING TRAINING (pushing the model away from them), but it doesn't guarantee a trained model will never make one - a poorly trained or out-of-distribution input can still produce one.",
        misconception: "It's easy to conflate 'the loss function discourages X' with 'X becomes impossible.'",
        principle: "Cross-entropy loss shapes training incentives; it doesn't provide an absolute guarantee about a deployed model's future behavior.",
      },
    ],
  },
  {
    id: "q4",
    text: "A fair 4-sided die (each outcome equally likely, p=0.25 each) has what entropy, compared to a heavily loaded 4-sided die (say, p = [0.97, 0.01, 0.01, 0.01])?",
    options: [
      {
        text: "The fair die has HIGHER entropy - it's the most unpredictable possible distribution over 4 outcomes",
        correct: true,
        principle: "Entropy is maximized by the uniform distribution among a fixed number of outcomes - maximal uncertainty means maximal entropy.",
      },
      {
        text: "The loaded die has higher entropy, since it has more 'extreme' probability values",
        correct: false,
        socratic: "Entropy measures how UNCERTAIN an outcome is. Is a loaded die (predictable, favors one face) more or less certain than a fair die?",
        whyWrong: "Extreme (very high or very low) probability values actually REDUCE entropy - a loaded die is more predictable (you can guess '0.97 outcome' and usually be right), which means less surprise, not more.",
        misconception: "It's easy to associate 'more varied-looking numbers' with 'more information/entropy,' when uniformity is actually what maximizes entropy.",
        principle: "Entropy measures unpredictability - a heavily loaded distribution is highly predictable and therefore has LOW entropy, close to 0 in the most extreme case.",
      },
      {
        text: "They have exactly the same entropy, since both have 4 possible outcomes",
        correct: false,
        socratic: "Entropy depends on the actual probability VALUES, not just how many outcomes exist. Does a 4-outcome distribution that heavily favors one category feel as 'spread out' as one where all 4 are equally likely?",
        whyWrong: "Entropy depends on the actual probability VALUES, not just the count of possible outcomes - two 4-outcome distributions can have very different entropies depending on how uniform or skewed they are.",
        misconception: "It's easy to assume entropy is purely a function of 'how many things could happen' rather than how likely each one actually is.",
        principle: "H(p) = -Σp_i log2(p_i) depends on the specific p_i values - try both distributions in the lab (weighting one category heavily vs. weighting all equally) and compare the H(p) numbers directly.",
      },
    ],
  },
  {
    id: "q5",
    text: "Why is D_KL(p ‖ q) generally NOT equal to D_KL(q ‖ p) - i.e., why is KL divergence not symmetric?",
    options: [
      {
        text: "The two versions penalize different kinds of mismatch differently - D_KL(p‖q) heavily penalizes q assigning low probability to outcomes p considers likely, while D_KL(q‖p) penalizes the reverse situation, so swapping p and q changes which mismatches matter most",
        correct: true,
        principle: "This asymmetry is a real, important property (not a flaw) - it's why the specific ORDER of arguments matters when KL divergence is used in ML (e.g., in variational inference, the choice of direction has real consequences).",
      },
      {
        text: "It actually is always symmetric - the formula just happens to look asymmetric",
        correct: false,
        socratic: "Try it with the sliders: set p and q to two very different distributions and compare D_KL(p‖q) to D_KL(q‖p) in the lab above. Do you actually get the same number both ways?",
        whyWrong: "Try computing D_KL(p‖q) and D_KL(q‖p) for two different, non-identical distributions in the lab (by comparing p_i log2(p_i/q_i) sums in each direction) - the two sums are generally different numbers, not just different-looking expressions of the same number.",
        misconception: "It's tempting to assume any measure of 'difference' between two things must be symmetric, the way ordinary distance is.",
        principle: "KL divergence is explicitly known as a non-symmetric 'divergence,' not a true distance metric, precisely because D_KL(p‖q) ≠ D_KL(q‖p) in general.",
      },
      {
        text: "It's a limitation of the formula that should be fixed by taking an average of both directions",
        correct: false,
        socratic: "The asymmetry isn't a bug - it reflects a real difference in meaning: 'extra bits from predicting q when truth is p' is a different question from 'extra bits from predicting p when truth is q.' Which direction matches how a trained model is actually used?",
        whyWrong: "The asymmetry is intentional and meaningful, not a bug to fix - each direction answers a genuinely different question about which distribution is treated as 'ground truth.' (A symmetrized version, like Jensen-Shannon divergence, does exist for cases where symmetry is specifically wanted, but that's a different, deliberately-designed quantity, not KL 'fixed.')",
        misconception: "It's easy to assume any non-symmetric formula must be an oversight rather than a deliberate design reflecting a real conceptual asymmetry (which distribution is 'truth' vs. 'prediction').",
        principle: "KL divergence's asymmetry directly reflects the asymmetry in the question it's answering: 'how surprised am I, believing q, when reality is p' is genuinely a different question from the reverse.",
      },
    ],
  },
];

export function QuizSection() {
  return <QuizBlock moduleId={9} courseId="math-for-ml" questions={QUESTIONS} />;
}
