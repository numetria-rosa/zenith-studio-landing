import { ProbabilityLab } from "@/components/course-engine/ProbabilityLab";
import { MathLevels } from "@/components/course-engine/MathLevels";
import { QuizBlock, type QuizQuestion } from "@/components/course-engine/QuizBlock";
import { InlineMath, BlockMath } from "@/components/course-engine/Math";
import { ProgressiveHint } from "@/components/course-engine/tour/ProgressiveHint";

export function ProbabilityLabSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
        Probability Lab
      </span>
      <ProbabilityLab />
      <ProgressiveHint
        hints={[
          "Flip a handful of times and watch the running average early on - does it jump around a lot, or stay steady, in the first 10 flips?",
          "Now keep flipping to 500+ and compare how much it wobbles at that point versus the first 10 flips.",
          "Try setting p away from 0.5 (a biased coin) - does the running average still eventually settle near the true p, just from a different starting point?",
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
          A single coin flip tells you almost nothing about how biased the coin really is - you could flip a
          fair coin and get heads twice in a row purely by chance. But the more times you flip it, the more
          the running fraction of heads has to settle down near the coin&apos;s true probability, simply
          because lucky and unlucky streaks average each other out over a long run. That settling-down is the{" "}
          <b>law of large numbers</b>, and it&apos;s the entire justification for trusting an average computed
          from enough data.
        </p>
      }
      applied={
        <div className="flex flex-col gap-3">
          <p>For a single Bernoulli trial with true probability <InlineMath tex="p" /> (a biased coin):</p>
          <BlockMath tex="\mathbb{E}[X] = p \qquad \operatorname{Var}(X) = p(1-p)" />
          <p>For the running average of <InlineMath tex="n" /> independent flips, the variance shrinks with more data:</p>
          <BlockMath tex="\operatorname{Var}(\bar{X}_n) = \frac{p(1-p)}{n} \qquad \text{SE} = \sqrt{\frac{p(1-p)}{n}}" />
          <p className="text-[#9aa0ae]">
            Every symbol: <InlineMath tex="\mathbb{E}[X]" /> (expectation) is the long-run average outcome.{" "}
            <InlineMath tex="\operatorname{Var}(X)" /> measures how spread out a single outcome is around that
            average. <InlineMath tex="\bar{X}_n" /> is the running average shown as the lab&apos;s blue line.
            The standard error (SE) shrinking as <InlineMath tex="1/\sqrt{n}" /> is exactly why the line
            wobbles wildly at first and calms down as you keep flipping.
          </p>
        </div>
      }
      proof={
        <div className="flex flex-col gap-3">
          <p>
            Why does variance divide by <InlineMath tex="n" />? For independent random variables, variances of
            a sum add:
          </p>
          <BlockMath tex="\operatorname{Var}(X_1 + X_2 + \dots + X_n) = n \cdot \operatorname{Var}(X)" />
          <p>
            The running average is that sum divided by <InlineMath tex="n" />. Using the rule that scaling a
            random variable by a constant <InlineMath tex="c" /> scales its variance by <InlineMath tex="c^2" />:
          </p>
          <BlockMath tex="\operatorname{Var}(\bar{X}_n) = \operatorname{Var}\!\left(\frac{1}{n}\sum X_i\right) = \frac{1}{n^2}\cdot n\cdot\operatorname{Var}(X) = \frac{\operatorname{Var}(X)}{n}" />
          <p>
            Taking a square root to get back to the same units as the original measurement gives the standard
            error, <InlineMath tex="\sqrt{\operatorname{Var}(X)/n}" /> - this is not an empirical observation
            about how the lab&apos;s line happens to behave, it&apos;s a direct algebraic consequence of
            independence plus how variance scales.
          </p>
        </div>
      }
    />
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "You flip a fair coin (p = 0.5) 4 times and get 4 heads in a row. What does the law of large numbers say about this?",
    options: [
      {
        text: "Nothing is wrong - 4 flips is far too few for the law of large numbers to have 'kicked in' yet; the running average is expected to be noisy at small n",
        correct: true,
        principle: "The law of large numbers is a statement about what happens as n grows large - it makes no promise about small samples, where streaks are common and expected.",
      },
      {
        text: "The coin must be biased toward heads",
        correct: false,
        socratic: "A fair coin lands 4-heads-in-a-row about 1 in 16 times purely by chance. Is a 1-in-16 event so rare that it forces you to abandon the 'fair' assumption?",
        whyWrong: "4 heads in a row happens about 1 in 16 times with a genuinely fair coin - unlikely, but far from rare enough to conclude bias from this alone.",
        misconception: "It's a very common statistical mistake to draw a strong conclusion about a true probability from a tiny sample.",
        principle: "Small-sample streaks are expected noise, not evidence of bias - you'd need a much larger n before an unusual running average became meaningful evidence.",
        tryThis: "In the lab, set p=0.5 and flip ×1 a few times - short streaks toward one side happen regularly even with a perfectly fair setting.",
      },
      {
        text: "The next flip is now more likely to be tails, to balance things out",
        correct: false,
        socratic: "Independence means each flip's outcome doesn't depend on past flips. Does the coin have any physical mechanism to 'remember' the streak and compensate for it?",
        whyWrong: "This is the gambler's fallacy - each flip is independent, so a coin has no 'memory' of previous flips and the next flip is still exactly p regardless of the streak.",
        misconception: "It's intuitive but incorrect to think a system 'owes' a correction after a streak.",
        principle: "Independent trials mean each flip's probability is unaffected by any previous outcome - the coin doesn't compensate for streaks.",
      },
    ],
  },
  {
    id: "q2",
    text: "In the lab, why does the blue line wobble much more wildly in the first 10 flips than after 500 flips?",
    options: [
      {
        text: "The standard error shrinks as 1/√n, so the running average's typical deviation from the true p is much larger when n is small",
        correct: true,
        principle: "SE = √(p(1-p)/n) - a direct, quantitative explanation for exactly this visual pattern, not just a qualitative 'more data is better' hand-wave.",
      },
      {
        text: "The random number generator is less accurate early on",
        correct: false,
        socratic: "Every flip, whether the 1st or the 500th, is generated by the exact same process. Does SE = √(p(1-p)/n) reference anything about 'flip order' or 'generator quality' - or only n?",
        whyWrong: "Each flip uses the same random process regardless of how many flips came before it - there's no sense in which early flips are generated less accurately.",
        misconception: "It's easy to blame a tool's implementation when a visible pattern actually has a clean mathematical explanation.",
        principle: "The wobble-then-settle pattern is a property of averaging, not of random-number quality - it would occur with a mathematically perfect random source too.",
      },
      {
        text: "It doesn't actually wobble less - that's an illusion caused by the chart's scale",
        correct: false,
        socratic: "Compute √(p(1-p)/10) and √(p(1-p)/500) yourself with p=0.5. Do those two numbers come out equal, or genuinely different?",
        whyWrong: "The standard error is a real, computable quantity that genuinely shrinks with n - this isn't a charting illusion, it's the actual behavior of the running average.",
        misconception: "It's tempting to distrust a visual pattern as a rendering artifact rather than checking the underlying math.",
        principle: "Compute SE at n=10 versus n=500 directly (√(p(1-p)/10) vs √(p(1-p)/500)) - the numbers themselves confirm the visible shrinkage.",
      },
    ],
  },
  {
    id: "q3",
    text: "A classifier's reported 'confidence' on a single prediction is 87%. Based on this module, what should you be cautious about?",
    options: [
      {
        text: "That confidence describes a probability over MANY predictions, not a guarantee about this one specific prediction being 87% likely to be correct in some checkable sense",
        correct: true,
        principle: "The whole point of expectation and variance is that they describe long-run behavior across many trials - treating one instance's stated probability as a certainty about that single case skips past exactly what the law of large numbers actually promises.",
      },
      {
        text: "87% confidence means the model is 87% accurate on all future data forever",
        correct: false,
        socratic: "This module's expectation and variance describe behavior across MANY trials, computed from a specific distribution of inputs. Does one prediction's score tell you anything about a completely different future distribution of inputs?",
        whyWrong: "A single prediction's confidence score doesn't guarantee anything about the model's overall future accuracy, which depends on the full distribution of future inputs, not one number from one prediction.",
        misconception: "It's easy to inflate one reported statistic into a much broader, unwarranted guarantee.",
        principle: "A per-prediction confidence and an aggregate accuracy rate are related but distinct quantities - one data point never fixes the other with certainty.",
      },
      {
        text: "Nothing - a stated probability is always exactly reliable regardless of sample size",
        correct: false,
        socratic: "The lab's running average was noisy at n=10 and settled by n=500 purely because of sample size. Would a probability estimated from very little evidence behave any differently?",
        whyWrong: "This ignores the entire lesson of standard error shrinking with n - a probability estimated or reported from limited evidence carries real uncertainty, especially at small sample sizes.",
        misconception: "It's easy to treat any number labeled 'probability' as automatically trustworthy without asking how it was estimated.",
        principle: "Reported probabilities are estimates with their own uncertainty, exactly like the lab's running average before it has enough flips to settle down.",
      },
    ],
  },
  {
    id: "q4",
    text: "You want the standard error of your running average to shrink to half its current size. Roughly how many times more data do you need?",
    options: [
      {
        text: "About 4 times as much data",
        correct: true,
        principle: "SE ∝ 1/√n, so halving SE requires n to increase by a factor of 4 (since √4 = 2).",
      },
      {
        text: "About 2 times as much data",
        correct: false,
        socratic: "SE shrinks with 1/√n, not 1/n. If n doubles, does SE actually shrink by a factor of 2, or by √2 ≈ 1.41?",
        whyWrong: "Doubling n only shrinks SE by a factor of √2 ≈ 1.41, not 2 - SE doesn't shrink linearly with n, it shrinks with the square root of n.",
        misconception: "It's natural to assume a linear relationship (double the data, half the error) when the actual relationship involves a square root.",
        principle: "SE = √(Var/n) - because of the square root, you need 4x the data to halve SE, not 2x.",
      },
      {
        text: "About 16 times as much data",
        correct: false,
        socratic: "√16 = 4, meaning 16x the data shrinks SE to a QUARTER, not a half. What factor of extra data gives you √k = 2, exactly the halving you want?",
        whyWrong: "16x data would shrink SE to a quarter of its size (since √16 = 4), overshooting the goal of halving it.",
        misconception: "It's easy to overcorrect once you know a square root is involved, guessing too large a multiplier.",
        principle: "To achieve a specific SE reduction factor k, you need n to increase by k² - for k=2 (halving), that's 4x, not 16x.",
      },
    ],
  },
  {
    id: "q5",
    text: "Why is independence between flips such an important assumption in this module's variance formula?",
    options: [
      {
        text: "Variance adding across trials (which the whole 1/n shrinkage depends on) is only valid when the trials don't influence each other",
        correct: true,
        principle: "Var(X1+...+Xn) = n·Var(X) specifically requires independence - correlated trials would make the sum's variance larger, breaking the clean 1/n shrinkage.",
      },
      {
        text: "Independence isn't actually required - the formula works identically either way",
        correct: false,
        socratic: "If a coin tended to repeat its last result, would consecutive flips still be adding 'fresh' independent randomness, or would they start echoing each other and increasing the sum's spread?",
        whyWrong: "If flips were correlated (e.g. a coin that tends to repeat its last result), the variance of their sum would generally be larger than n times a single flip's variance, and the SE formula in this module would no longer hold.",
        misconception: "It's easy to treat a formula's stated assumptions as decorative rather than load-bearing.",
        principle: "The Full Derivation level explicitly uses independence to justify variances adding - remove that assumption and the derivation breaks.",
      },
      {
        text: "Independence only matters for the mean, not the variance",
        correct: false,
        socratic: "E[sum] always adds regardless of correlation, but Var[sum] only adds cleanly under independence. Which of the two quantities does this module's SE formula actually depend on shrinking?",
        whyWrong: "The expectation of a sum is actually independence-agnostic (it always adds), but the VARIANCE of a sum specifically requires independence (or zero correlation) to add cleanly - this module's variance-shrinkage argument is exactly where independence is doing real work.",
        misconception: "It's easy to assume whatever assumption is needed applies uniformly to every related quantity, when different quantities can have different requirements.",
        principle: "E[sum] = sum of E[] always. Var[sum] = sum of Var[] only under independence (or uncorrelatedness) - a real, important distinction.",
      },
    ],
  },
  {
    id: "q6",
    text: "For a fair coin (p = 0.5), compute the standard error of the running average after n = 400 flips.",
    options: [
      {
        text: "0.025, from √(0.25/400) = √0.000625",
        correct: true,
        principle: "SE = √(p(1-p)/n) = √(0.5×0.5/400) = √(0.25/400) = √0.000625 = 0.025 - the same three-step formula as the worked example, with n=400 instead of 100.",
      },
      {
        text: "0.00125, from 0.5/400",
        correct: false,
        socratic: "The formula is √(p(1-p)/n) - a square root of a fraction, not the probability divided directly by n. Did you apply the square root at all?",
        whyWrong: "This skips both the p(1-p) numerator and the square root entirely - it just divides p by n directly, which isn't the standard error formula.",
        misconception: "It's easy to shortcut a multi-step formula by using only the most familiar-looking piece of it.",
        principle: "SE requires computing p(1-p), dividing by n, THEN taking a square root - each step matters.",
      },
      {
        text: "0.0625, from 0.25/4 by simplifying n=400 to 4",
        correct: false,
        whyWrong: "n=400 must be used as-is in the division (0.25/400), not simplified to a smaller number first - there's no valid step that turns 400 into 4 here.",
        misconception: "It's easy to introduce an arbitrary simplification that isn't mathematically justified by the actual formula.",
        principle: "Divide by the actual sample size, 400, not a simplified stand-in for it.",
      },
    ],
  },
  {
    id: "q7",
    text: "You compute SE at n=100 and get 0.05. Someone collects 4x more data (n=400). By what factor should SE shrink?",
    options: [
      {
        text: "By a factor of 2 (from 0.05 to 0.025), since SE scales with 1/√n and √4 = 2",
        correct: true,
        principle: "Quadrupling n always halves SE, because of the square root in the formula - exactly matching the two worked SE computations above (0.05 at n=100, 0.025 at n=400).",
      },
      {
        text: "By a factor of 4, matching the 4x increase in data directly",
        correct: false,
        socratic: "Does SE scale directly (linearly) with n, or with the square root of n? Compute √4 - is it 4, or 2?",
        whyWrong: "SE scales with 1/√n, not 1/n - a 4x increase in data gives a √4 = 2x reduction in SE, not a 4x reduction.",
        misconception: "It's natural to expect a direct, linear relationship when the actual one involves a square root.",
        principle: "SE ∝ 1/√n - always take the square root of the data-multiplication factor to find the SE-reduction factor.",
      },
      {
        text: "SE won't change, since both are 'large enough' sample sizes",
        correct: false,
        whyWrong: "SE keeps shrinking predictably with more data at any sample size - there's no threshold after which additional data stops helping, though the absolute improvement does get smaller in later doublings.",
        misconception: "It's easy to assume there's some informal cutoff past which 'more data' stops mattering at all.",
        principle: "SE = √(p(1-p)/n) keeps decreasing for every increase in n, without a special cutoff point.",
      },
    ],
  },
  {
    id: "q8",
    text: "A weighted coin has p = 0.9 (90% heads). Compared to a fair coin (p = 0.5), how does its standard error at the same n compare?",
    options: [
      {
        text: "Smaller - because p(1-p) = 0.9×0.1 = 0.09 is less than 0.5×0.5 = 0.25",
        correct: true,
        principle: "p(1-p) is maximized at p=0.5 and shrinks as p moves toward 0 or 1 - a heavily biased coin's outcomes are inherently less variable than a fair coin's, so its running average settles faster at the same n.",
      },
      {
        text: "Larger - a more 'extreme' probability should be noisier",
        correct: false,
        socratic: "Compute p(1-p) for p=0.9 and for p=0.5 directly - which one is actually bigger?",
        whyWrong: "p(1-p) is 0.09 for p=0.9 but 0.25 for p=0.5 - the 'extreme' probability actually produces the SMALLER value, not larger.",
        misconception: "It's easy to associate 'extreme-sounding' probabilities with 'more randomness,' when the opposite is true here.",
        principle: "A coin close to always-heads or always-tails is more predictable (lower variance) than a perfectly balanced one.",
      },
      {
        text: "Exactly the same - standard error only depends on n, not on p",
        correct: false,
        whyWrong: "The formula √(p(1-p)/n) has p explicitly inside it - different values of p genuinely change the standard error at the same n, they don't cancel out.",
        misconception: "It's easy to assume a quantity depends on only one of several variables actually present in its own formula.",
        principle: "SE depends on BOTH p and n - p(1-p) inside the square root is not a constant.",
      },
    ],
  },
];

export function QuizSection() {
  return <QuizBlock moduleId={6} courseId="math-for-ml" questions={QUESTIONS} sampleSize={5} />;
}
