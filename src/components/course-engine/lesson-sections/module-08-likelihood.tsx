import { LikelihoodLab } from "@/components/course-engine/LikelihoodLab";
import { MathLevels } from "@/components/course-engine/MathLevels";
import { QuizBlock, type QuizQuestion } from "@/components/course-engine/QuizBlock";
import { InlineMath, BlockMath } from "@/components/course-engine/Math";
import { ProgressiveHint } from "@/components/course-engine/tour/ProgressiveHint";

export function LikelihoodLabSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
        Likelihood Lab
      </span>
      <LikelihoodLab />
      <ProgressiveHint
        hints={[
          "Drag μ far away from the cluster of red data points and watch the log-likelihood number - does it get better or worse?",
          "Now drag μ back toward the center of the cluster - does the log-likelihood recover?",
          "Click 'Reveal MLE' and compare those μ, σ values to the sample mean and sample standard deviation of the data points you can see.",
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
          Given some data and a family of possible models (here, Gaussians with different means and spreads),{" "}
          <b>likelihood</b> asks a very specific question: &quot;if this particular model were true, how
          plausible would it be to see exactly this data?&quot; A model that puts your real data points near
          its peak is a good fit; a model that puts them way out in its thin tails is a bad fit, even if it
          isn&apos;t obviously wrong at a glance. <b>Maximum likelihood estimation (MLE)</b> is simply: search
          over every possible model in the family, and pick the one that makes the observed data most
          plausible.
        </p>
      }
      applied={
        <div className="flex flex-col gap-3">
          <p>The Gaussian probability density function, for a single point <InlineMath tex="x" />:</p>
          <BlockMath tex="p(x \mid \mu, \sigma) = \frac{1}{\sigma\sqrt{2\pi}}\exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)" />
          <p>For independent data points, the full likelihood is a product - and since products of small numbers underflow easily, it&apos;s standard to work with the log-likelihood, a sum instead:</p>
          <BlockMath tex="\log \mathcal{L}(\mu,\sigma) = \sum_{i=1}^n \log p(x_i \mid \mu, \sigma)" />
          <p className="text-[#9aa0ae]">
            Every symbol: <InlineMath tex="\mu, \sigma" /> are the sliders in the lab. <InlineMath tex="x_i" /> are
            the fixed data points (red dots). The MLE values are exactly the <InlineMath tex="\mu, \sigma" /> that
            make <InlineMath tex="\log\mathcal{L}" /> as large as possible - for a Gaussian, this has a closed
            form: <InlineMath tex="\hat\mu" /> is just the sample mean, and <InlineMath tex="\hat\sigma" /> is the
            sample standard deviation.
          </p>
        </div>
      }
      proof={
        <div className="flex flex-col gap-3">
          <p>
            Why is the sample mean the MLE for <InlineMath tex="\mu" />? Take the derivative of{" "}
            <InlineMath tex="\log\mathcal{L}" /> with respect to <InlineMath tex="\mu" /> (using Module 4&apos;s
            calculus) and set it to zero - exactly the optimization idea from Module 5, but solved
            analytically instead of by gradient steps:
          </p>
          <BlockMath tex="\frac{\partial}{\partial \mu}\log\mathcal{L} = \sum_{i=1}^n \frac{x_i - \mu}{\sigma^2} = 0" />
          <p>
            Since <InlineMath tex="\sigma^2" /> is a positive constant, this reduces to{" "}
            <InlineMath tex="\sum(x_i - \mu) = 0" />, which rearranges directly to:
          </p>
          <BlockMath tex="\hat\mu = \frac{1}{n}\sum_{i=1}^n x_i" />
          <p>
            - exactly the sample mean. This is a genuinely important realization: fitting a Gaussian by MLE and
            computing a simple average are, for this specific model, the same operation. A similar derivative
            argument (setting <InlineMath tex="\partial \log\mathcal{L}/\partial \sigma = 0" />) gives the
            sample standard deviation for <InlineMath tex="\hat\sigma" />.
          </p>
        </div>
      }
    />
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "You set μ far away from where most of the data points cluster. What happens to the log-likelihood?",
    options: [
      {
        text: "It gets much more negative (worse), because the Gaussian curve now puts low probability density near the actual data points",
        correct: true,
        principle: "Log-likelihood is a sum of log-probabilities under the model - placing μ far from the real data lowers each of those probabilities, making the sum more negative.",
      },
      {
        text: "It stays the same, because log-likelihood only depends on σ, not μ",
        correct: false,
        socratic: "Look at the Gaussian PDF formula: it has (x−μ)² right in it. If μ changes, does that squared term stay fixed?",
        whyWrong: "The Gaussian PDF formula includes (x-μ)² directly - μ has a large, direct effect on the likelihood of every data point.",
        misconception: "It's easy to assume only one parameter matters without checking the actual formula.",
        principle: "Both μ and σ appear in the Gaussian PDF and therefore both affect log-likelihood, as the lab's sliders directly demonstrate.",
        tryThis: "In the lab, drag μ far from the cluster of red dots and watch the log-likelihood number get noticeably more negative.",
      },
      {
        text: "It becomes undefined, since the data no longer 'belongs' to that model",
        correct: false,
        socratic: "The Gaussian PDF is a smooth formula defined at every real x, μ, σ. Does a bad fit break the formula, or just produce a very small (very negative in log form) number?",
        whyWrong: "Log-likelihood is a well-defined (if very negative) number for any valid μ and σ, no matter how poorly the model fits - the Gaussian PDF is defined everywhere on the real line.",
        misconception: "It's easy to assume a bad fit produces an error rather than just a low (very negative) score.",
        principle: "A model can be a bad fit and still produce a perfectly well-defined, computable log-likelihood - that's exactly what makes it usable for comparing fits.",
      },
    ],
  },
  {
    id: "q2",
    text: "Why is log-likelihood used instead of plain likelihood (the raw product of probabilities) in practice?",
    options: [
      {
        text: "Multiplying many small probabilities together underflows to numerically indistinguishable-from-zero very quickly; summing their logarithms avoids that problem while preserving the same ranking of which parameters fit best",
        correct: true,
        principle: "log is a monotonic (order-preserving) function, so maximizing log-likelihood always gives the same answer as maximizing likelihood - it's a numerical-stability choice, not a different optimization problem.",
      },
      {
        text: "Log-likelihood and likelihood are unrelated quantities that happen to share a name",
        correct: false,
        socratic: "log-likelihood is literally defined as log(likelihood). Does taking the log of a number make it a completely different, unrelated quantity?",
        whyWrong: "Log-likelihood is literally defined as the logarithm of the likelihood - they're directly, deterministically related, not unrelated quantities.",
        misconception: "It's easy to assume two related-sounding terms must be doing entirely separate things.",
        principle: "log-likelihood = log(likelihood) - same information, same maximizer, different (more numerically stable) representation.",
      },
      {
        text: "Because probabilities can be negative, and logs fix that",
        correct: false,
        socratic: "By definition, can a probability ever actually be negative in the first place?",
        whyWrong: "Probabilities are never negative by definition - that's not the actual numerical issue log-likelihood solves.",
        misconception: "It's easy to invent a plausible-sounding but incorrect justification when the real reason (underflow from multiplying many small numbers) hasn't been learned yet.",
        principle: "The real issue is that products of many probabilities (each less than 1) shrink toward zero extremely fast - logs turn that product into a sum, which doesn't underflow the same way.",
      },
    ],
  },
  {
    id: "q3",
    text: "How does maximum likelihood estimation connect to Module 5's gradient descent?",
    options: [
      {
        text: "MLE is itself an optimization problem - finding the parameters that maximize log-likelihood - and can be solved with gradient-based methods (or, for the Gaussian, with a closed-form solution) exactly like the loss-minimization problems from Module 5",
        correct: true,
        principle: "In practice, most ML training IS maximum likelihood estimation on a much larger model, solved with gradient descent because a closed form usually isn't available.",
      },
      {
        text: "They're unrelated - gradient descent is about loss functions, and MLE is about probability, a completely separate branch of math",
        correct: false,
        socratic: "Mean squared error, a common loss function, can be derived directly from assuming Gaussian-distributed errors. Does that connection sound like two unrelated branches of math, or the same idea viewed two ways?",
        whyWrong: "Loss minimization and likelihood maximization are frequently the exact same problem in disguise - many common loss functions (like mean squared error) are directly derivable from a Gaussian likelihood assumption.",
        misconception: "It's easy to treat 'optimization' and 'probability' as separate topics rather than seeing how they combine in most real training setups.",
        principle: "Minimizing negative log-likelihood IS a loss-minimization problem - the two frameworks are the same mathematics viewed from different angles.",
      },
      {
        text: "MLE always requires gradient descent - a closed-form solution is never possible",
        correct: false,
        socratic: "The lab derives the Gaussian's MLE (sample mean and sample SD) with an exact algebraic formula, no iteration involved. Does that count as 'always needing gradient descent'?",
        whyWrong: "The lab's own MLE for a Gaussian (sample mean and sample SD) is a closed-form solution, derived exactly in the Full Derivation level - no gradient descent was needed for this specific case.",
        misconception: "It's easy to overgeneralize 'usually needs gradient descent' (true for complex models) into 'always needs it' (not true for simpler, well-understood ones).",
        principle: "Closed-form MLE solutions exist for some models (like the Gaussian); gradient descent becomes necessary once no such closed form is available, which is common for more complex models.",
      },
    ],
  },
  {
    id: "q4",
    text: "The 'Reveal MLE' button sets μ and σ to specific values. What guarantees those specific values are the best possible fit, rather than just a good one?",
    options: [
      {
        text: "They were derived analytically by setting the derivative of log-likelihood to zero and solving exactly - not found by trial and error, so no other value can score higher",
        correct: true,
        principle: "This is the difference between a proven optimum (from calculus) and a merely 'good' value found by manual slider adjustment - the MLE derivation in this module's Full Derivation level is a proof, not a guess.",
      },
      {
        text: "They were chosen because they're round, easy-to-remember numbers",
        correct: false,
        socratic: "The MLE values are computed directly from this specific dataset's mean and standard deviation. Is there any reason a real dataset's mean would happen to be a conveniently round number?",
        whyWrong: "The MLE values are whatever the sample mean and sample standard deviation of this specific dataset happen to be - there's no reason they'd be conveniently round numbers, and the lab doesn't round them for convenience.",
        misconception: "It's easy to assume a 'special' value in a demo was chosen for presentation reasons rather than derived mathematically.",
        principle: "The MLE values are a direct computation (mean and SD) from the actual DATA array, not a curated or simplified number.",
      },
      {
        text: "They were found by trying every possible combination of μ and σ and picking the best one from that search",
        correct: false,
        socratic: "Setting the derivative of log-likelihood to zero and solving gives an exact closed-form answer directly. Does a formula that hands you the answer directly need to search through combinations first?",
        whyWrong: "The lab computes the MLE using the closed-form formulas (sample mean and sample SD) directly - it never performs a brute-force search over parameter combinations.",
        misconception: "It's easy to assume a computer 'found' an optimal value through exhaustive search rather than a direct formula.",
        principle: "For a Gaussian, the MLE has an exact formula (Module 8's Full Derivation) - no search is required at all.",
      },
    ],
  },
  {
    id: "q5",
    text: "Why does this module's Gaussian-likelihood framing matter for understanding logistic regression, later in this course's scope?",
    options: [
      {
        text: "Logistic regression is also fit by maximum likelihood - just with a different probability model (Bernoulli, for a yes/no outcome) instead of a Gaussian, and the same 'find parameters that make the observed data most plausible' logic applies",
        correct: true,
        principle: "The likelihood framework generalizes directly: swap the probability model to match your data type (Gaussian for continuous outcomes, Bernoulli for binary ones), and the same MLE machinery applies.",
      },
      {
        text: "Logistic regression doesn't use likelihood at all - it uses a completely different mathematical framework",
        correct: false,
        socratic: "Logistic regression's log-loss is derived from a Bernoulli likelihood, the same way this module's approach derives fitting from a Gaussian likelihood. Is that a different framework, or the same one with a different distribution plugged in?",
        whyWrong: "Logistic regression's standard loss function (log loss / cross-entropy) is directly derived from a Bernoulli likelihood, exactly analogous to how this module derived MSE-like behavior from a Gaussian likelihood.",
        misconception: "It's easy to assume different-sounding model names imply entirely disconnected mathematical foundations.",
        principle: "Likelihood-based fitting is the shared thread connecting many seemingly different models - only the probability distribution assumed for the data changes.",
      },
      {
        text: "It doesn't matter - Gaussian likelihood and logistic regression are entirely separate topics with no shared math",
        correct: false,
        socratic: "Both cases are 'find the parameters that make the observed data most plausible' - just with a different probability model assumed for the data. Is that a shared pattern, or two unrelated recipes?",
        whyWrong: "Both are instances of the same maximum-likelihood-estimation idea, applied to different probability models - the shared mathematical structure is exactly why this module's Gaussian example is useful preparation.",
        misconception: "It's tempting to treat each named technique as an isolated recipe rather than an instance of a shared, general principle.",
        principle: "This module's likelihood/MLE framework is the general pattern; a Gaussian model and a Bernoulli-based logistic model are two specific applications of it.",
      },
    ],
  },
  {
    id: "q6",
    text: "For the data points {2, 4, 9}, what is the MLE estimate μ̂ for a Gaussian's mean?",
    options: [
      {
        text: "5, since (2+4+9)/3 = 15/3 = 5",
        correct: true,
        principle: "The Gaussian MLE for the mean is always the sample mean: sum the data, divide by the count. (2+4+9)/3 = 5.",
      },
      {
        text: "4, the middle value of the three numbers",
        correct: false,
        socratic: "The MLE formula is the sample MEAN (sum divided by count), not the median (middle value). Are those the same computation?",
        whyWrong: "4 is the median (middle value when sorted), not the mean - the Gaussian MLE specifically requires averaging all the data, not picking the middle one.",
        misconception: "It's easy to confuse the mean and the median, especially since they can coincidentally be close for some datasets.",
        principle: "μ̂ = sample mean = (sum of all data points) / (count of data points), always - not the median.",
      },
      {
        text: "15, the sum of the data points",
        correct: false,
        whyWrong: "15 is just the sum - the MLE formula requires dividing that sum by the count (3) to get the actual mean, 5.",
        misconception: "It's easy to stop halfway through the formula and report an intermediate result as the final answer.",
        principle: "Always complete both steps: sum the data, THEN divide by how many points there are.",
      },
    ],
  },
  {
    id: "q7",
    text: "You fit two different models to the same dataset. Model A has a higher likelihood than Model B. What can you conclude?",
    options: [
      {
        text: "Model A's parameters make the observed data more probable than Model B's parameters do - nothing more general than that",
        correct: true,
        principle: "Likelihood is a comparison of how well specific parameter choices explain the data actually observed - it doesn't by itself certify that Model A is 'the truth' or will generalize better to new data.",
      },
      {
        text: "Model A is definitely the true underlying model that generated the data",
        correct: false,
        socratic: "Does a higher likelihood score guarantee a model is the one true process that generated the data, or does it just mean that model explains THIS specific data better than the alternative you compared it to?",
        whyWrong: "Likelihood only ranks the specific models you compared against each other on this data - it doesn't certify that the winner is the actual true process, especially with limited data or overly flexible models.",
        misconception: "It's easy to treat 'won the comparison' as equivalent to 'proven true,' when it's really a relative, data-dependent ranking.",
        principle: "Likelihood comparisons are relative and data-dependent - not an absolute certificate of truth for the winning model.",
      },
      {
        text: "Model A will definitely perform better on brand-new, unseen data",
        correct: false,
        whyWrong: "Likelihood is computed on the data you already have - a model that overfits that specific data can have very high likelihood on it while performing worse on new data, a distinct problem MLE alone doesn't protect against.",
        misconception: "It's easy to assume 'better fit to the data I have' automatically transfers to 'better fit to data I don't have yet.'",
        principle: "Likelihood measures fit to observed data specifically - generalization to new data is a related but separate question.",
      },
    ],
  },
  {
    id: "q8",
    text: "Why does maximizing likelihood for a Gaussian model produce the same result as minimizing mean squared error?",
    options: [
      {
        text: "Because the Gaussian probability density has a squared-difference term in its exponent, so maximizing that probability is mathematically the same as minimizing that squared difference",
        correct: true,
        principle: "The Gaussian PDF's exponent contains -(x-μ)²/(2σ²) - maximizing a probability with a negative squared term inside is the same as minimizing that squared term, which is exactly mean squared error.",
      },
      {
        text: "It's a coincidence that happens to work out for Gaussian data specifically",
        correct: false,
        socratic: "Does the connection come from a specific mathematical structure inside the Gaussian formula (its exponent), or does it appear with no explanation at all?",
        whyWrong: "This connection is a direct algebraic consequence of the Gaussian PDF's specific mathematical form, not an unexplained coincidence.",
        misconception: "It's easy to label a result 'coincidental' before tracing through the actual algebra that produces it.",
        principle: "The Gaussian's own formula, expanded and maximized, produces MSE - it's derivable, not accidental.",
      },
      {
        text: "Because MSE and likelihood are unrelated, and this module hasn't actually shown they connect",
        correct: false,
        whyWrong: "This module explicitly derives this exact connection - MSE is presented as a direct consequence of maximizing Gaussian likelihood, not as two separate topics.",
        misconception: "It's easy to overlook a connection explicitly built into the material by assuming two familiar-sounding topics must be separate.",
        principle: "Minimizing MSE and maximizing Gaussian likelihood are the same optimization problem, shown directly by this module's math.",
      },
    ],
  },
];

export function QuizSection() {
  return <QuizBlock moduleId={8} courseId="math-for-ml" questions={QUESTIONS} sampleSize={5} />;
}
