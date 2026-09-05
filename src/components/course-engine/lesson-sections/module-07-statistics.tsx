import { SamplingLab } from "@/components/course-engine/SamplingLab";
import { MathLevels } from "@/components/course-engine/MathLevels";
import { QuizBlock, type QuizQuestion } from "@/components/course-engine/QuizBlock";
import { InlineMath, BlockMath } from "@/components/course-engine/Math";
import { ProgressiveHint } from "@/components/course-engine/tour/ProgressiveHint";

export function SamplingLabSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
        Sampling Distribution Lab
      </span>
      <SamplingLab />
      <ProgressiveHint
        hints={[
          "Set n=1 and collect several sample means - does that histogram's shape resemble the skewed population, or something different?",
          "Now raise n to 30 and collect many sample means - compare this histogram's shape and width to the n=1 case.",
          "Watch the spread specifically: does it shrink proportionally to n, or to √n, as you move from small to large n?",
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
          A <b>population</b> is every possible thing you could measure (every user, every transaction); a{" "}
          <b>sample</b> is the handful you actually looked at. No matter how lopsided the population&apos;s own
          distribution is, if you repeatedly draw samples and average each one, the resulting collection of
          averages piles up into a roughly bell-shaped, symmetric distribution centered on the true population
          average - and that pile gets narrower the larger each sample is. This surprising fact is called the{" "}
          <b>Central Limit Theorem</b>, and it&apos;s the reason averages (not individual data points) are
          usually the trustworthy thing to reason about.
        </p>
      }
      applied={
        <div className="flex flex-col gap-3">
          <p>For a population with mean <InlineMath tex="\mu" /> and standard deviation <InlineMath tex="\sigma" />, the distribution of the sample mean <InlineMath tex="\bar{X}_n" /> (from samples of size <InlineMath tex="n" />) approaches:</p>
          <BlockMath tex="\bar{X}_n \sim \mathcal{N}\!\left(\mu,\; \frac{\sigma^2}{n}\right) \quad \text{as } n \to \infty" />
          <p className="text-[#9aa0ae]">
            Every symbol: <InlineMath tex="\mu" /> is the population mean (the lab&apos;s gold dashed line).{" "}
            <InlineMath tex="\sigma" /> is the population&apos;s own spread - large here, since the population is
            heavily skewed. <InlineMath tex="\mathcal{N}(\cdot,\cdot)" /> denotes a normal (bell-curve)
            distribution - notice this holds regardless of what shape the ORIGINAL population had.{" "}
            <InlineMath tex="\sigma/\sqrt{n}" /> is exactly the standard error from Module 6, now describing
            the spread of an entire histogram of sample means, not just one running average.
          </p>
        </div>
      }
      proof={
        <div className="flex flex-col gap-3">
          <p>
            The Central Limit Theorem is a genuinely deep result (its full proof needs characteristic functions
            and is well beyond this course), but its variance claim follows directly from Module 6&apos;s
            derivation. If <InlineMath tex="X_1, \dots, X_n" /> are independent draws from ANY population with
            variance <InlineMath tex="\sigma^2" />:
          </p>
          <BlockMath tex="\operatorname{Var}(\bar{X}_n) = \operatorname{Var}\!\left(\frac{1}{n}\sum_{i=1}^n X_i\right) = \frac{\sigma^2}{n}" />
          <p>
            What the CLT adds on top of that - and what makes it surprising - is the claim about{" "}
            <i>shape</i>: regardless of how skewed each individual <InlineMath tex="X_i" /> is, their average
            becomes approximately normally distributed for large enough <InlineMath tex="n" />. This is why the
            lab&apos;s histogram visibly rounds out into a bell shape as you collect more sample means, even
            though the population feeding it is nothing like a bell curve.
          </p>
        </div>
      }
    />
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "The lab's population is heavily right-skewed. As you increase the sample size n and collect many sample means, what shape does the histogram of sample means tend toward?",
    options: [
      {
        text: "A roughly symmetric, bell-shaped distribution, regardless of the population's own skewed shape",
        correct: true,
        principle: "This is the Central Limit Theorem's defining claim: the sample-mean distribution trends toward normal even when the underlying population is nothing like normal.",
      },
      {
        text: "The same right-skewed shape as the population, just narrower",
        correct: false,
        socratic: "Try n=1 versus n=30 in the lab and compare the SHAPES, not just the widths. Does the n=30 histogram still look lopsided like the population, or has it rounded out?",
        whyWrong: "The shape itself changes toward symmetric/bell-like as n grows - it's not simply a scaled-down copy of the population's skew.",
        misconception: "It's a reasonable-sounding guess that averaging would just 'shrink' the original shape rather than genuinely reshape it.",
        principle: "The CLT's surprising part is specifically that shape converges toward normal, not merely that spread shrinks.",
        tryThis: "In the lab, set n=1 (no averaging effect) and compare the histogram's shape to n=30 - the difference in shape, not just width, is the point.",
      },
      {
        text: "It becomes uniform (flat), since averaging smooths out all structure",
        correct: false,
        socratic: "Averaging pulls values toward the population's center rather than spreading them evenly. Does concentrating near a center sound like a flat/uniform shape, or a peaked one?",
        whyWrong: "Averaging concentrates values near the population mean rather than spreading them out evenly - a uniform distribution is actually the opposite of what averaging produces.",
        misconception: "It's easy to associate 'smoothing' with 'flattening,' when averaging actually concentrates mass near the center.",
        principle: "The CLT predicts concentration around the mean in a bell shape, not a flat/uniform spread.",
      },
    ],
  },
  {
    id: "q2",
    text: "You increase the sample size n from 5 to 20. What happens to the spread of the sample-mean histogram?",
    options: [
      {
        text: "It shrinks by a factor of 2, since SD of sample means = population SD / √n, and √(20/5) = 2",
        correct: true,
        principle: "This is exactly the σ/√n relationship - quadrupling n only halves the spread, because of the square root.",
      },
      {
        text: "It shrinks by a factor of 4, matching the ratio of the sample sizes",
        correct: false,
        socratic: "The formula is σ/√n, with a square root over n. Does a 4x increase in n translate to a 4x reduction in spread, or a √4 = 2x reduction?",
        whyWrong: "The spread scales with 1/√n, not 1/n - a 4x increase in sample size produces a 2x decrease in spread, not a 4x decrease.",
        misconception: "It's natural to expect the spread to scale linearly with sample size, when the actual relationship involves a square root, exactly as in Module 6.",
        principle: "SD of sample means = σ/√n - going from n=5 to n=20 (a 4x increase) gives a √4 = 2x reduction in spread.",
      },
      {
        text: "It stays the same - sample size doesn't affect the spread of sample means, only how many you've collected",
        correct: false,
        socratic: "σ/√n has n (sample size) directly in the denominator. If n changes, does that fraction stay fixed?",
        whyWrong: "Sample size directly enters the σ/√n formula - a larger n produces genuinely tighter individual sample means, independent of how many sample means you go on to collect.",
        misconception: "It's easy to conflate 'number of samples drawn' (which affects how filled-in the histogram looks) with 'size of each individual sample' (which affects how spread out each mean is).",
        principle: "n (sample size) and the count of collected sample means are two different quantities in this lab - only n affects the theoretical spread σ/√n.",
      },
    ],
  },
  {
    id: "q3",
    text: "A dataset shows that ice cream sales and drowning incidents are strongly correlated across months. What does this module's framing say about concluding ice cream causes drowning?",
    options: [
      {
        text: "Correlation alone doesn't establish causation - a third factor (like hot weather driving both more swimming and more ice cream sales) can produce strong correlation with no causal link between the two measured variables",
        correct: true,
        principle: "This is the textbook confounding-variable example - a real, common trap when interpreting correlational data as if it were experimental evidence.",
      },
      {
        text: "Since the correlation is strong, causation is essentially proven",
        correct: false,
        socratic: "Hot weather could independently drive both more swimming (and thus drowning risk) and more ice cream sales. Does that shared cause require ice cream itself to have any causal effect on drowning?",
        whyWrong: "Strength of correlation says nothing about whether one variable causes the other - a strong correlation can be entirely explained by a shared underlying cause.",
        misconception: "It's a very common (and named) statistical mistake to treat a large correlation coefficient as if it were direct evidence of causation.",
        principle: "Correlation measures how two variables move together; causation is a separate claim about one variable's changes producing changes in the other, which requires more than correlational evidence to establish.",
      },
      {
        text: "The correlation must be a coincidence with no explanation at all",
        correct: false,
        socratic: "Is there a plausible shared cause (hot weather) that explains why both variables would rise and fall together, without it being random chance?",
        whyWrong: "There's a very plausible common-cause explanation here (hot weather) - it's not an unexplainable coincidence, just not a direct causal link between the two measured variables.",
        misconception: "It's easy to swing from 'not causation' all the way to 'meaningless coincidence,' skipping the more likely explanation of a shared confounding cause.",
        principle: "A real correlation without direct causation often still has a real explanation - usually a confounding variable - rather than being pure coincidence.",
      },
    ],
  },
  {
    id: "q4",
    text: "Why does this module emphasize sample MEANS specifically, rather than individual sample values?",
    options: [
      {
        text: "Individual values from a skewed population stay skewed no matter how many you collect, but MEANS of samples become approximately normal - this predictable behavior is what makes confidence intervals and hypothesis tests mathematically tractable",
        correct: true,
        principle: "The CLT applies to sums/averages specifically, not to raw individual observations - this is exactly why so much of classical statistics is built around means.",
      },
      {
        text: "Individual values and sample means behave identically, so the distinction doesn't matter",
        correct: false,
        socratic: "Set n=1 in the lab (which is really just looking at individual values) versus a larger n. Do the two histograms end up looking the same shape?",
        whyWrong: "They behave very differently - individual values retain the population's original (possibly skewed) shape, while sample means trend toward a bell shape as n grows, as shown directly in the lab.",
        misconception: "It's easy to assume a headline result (bell-shaped sample means) also applies to the simpler, related quantity (individual data points), when it specifically doesn't.",
        principle: "In the lab, set n=1 to see individual-value behavior (matches the population's skew) versus larger n (bell-shaped) - a direct, checkable contrast.",
      },
      {
        text: "Because individual values are always more accurate for decision-making",
        correct: false,
        socratic: "A single point carries the population's full variance; a mean of n points carries only variance/n. Which one, then, tends to sit closer to the true underlying value?",
        whyWrong: "This module's entire framing (and standard error shrinking with n) points the opposite way - averages over more data are typically the MORE reliable basis for decisions, not individual data points.",
        misconception: "It's easy to assume 'more granular/individual' automatically means 'more accurate,' when averaging is specifically valuable because it reduces noise.",
        principle: "A single data point carries the full variance of the population; a mean of n points carries only variance/n - averages are the less noisy quantity.",
      },
    ],
  },
  {
    id: "q5",
    text: "A colleague says: \"I ran the experiment once and got a great result, so the effect is real.\" What does this module suggest asking first?",
    options: [
      {
        text: "How much sample-to-sample variability would be expected from a single run of this size, and whether the observed result could plausibly be explained by that variability alone",
        correct: true,
        principle: "This is the exact question the sampling distribution answers - a single favorable draw is exactly what's expected sometimes even with no real underlying effect, especially at small n.",
      },
      {
        text: "Whether the result looked visually impressive",
        correct: false,
        socratic: "The lab shows a single sample mean can land almost anywhere by chance alone, regardless of how striking it looks. Does 'looks impressive' answer the question of whether chance alone could explain it?",
        whyWrong: "How impressive a result looks has no bearing on whether it's distinguishable from ordinary sampling variability - that requires actually reasoning about the sampling distribution, not a visual impression.",
        misconception: "It's easy to substitute a subjective impression for the specific statistical question that actually needs answering.",
        principle: "The relevant question is quantitative: how much would results vary by chance alone, at this sample size, if there were no real effect?",
      },
      {
        text: "Nothing further - a single run is always sufficient evidence in a well-designed experiment",
        correct: false,
        socratic: "Good design controls for bias, but does it change the fact that a single sample mean can still land almost anywhere by pure chance, especially at small n?",
        whyWrong: "This module's entire lab demonstrates that a single sample (n=1 sample-mean) can land almost anywhere just from chance - one run is essentially never, on its own, enough to rule out chance as the explanation.",
        misconception: "It's easy to treat 'the experiment was well-designed' as if it eliminates the need to think about sampling variability, when good design and accounting for variability are separate concerns.",
        principle: "Good experimental design reduces certain biases, but it does not eliminate sampling variability - that still needs to be reasoned about explicitly.",
      },
    ],
  },
  {
    id: "q6",
    text: "A population has σ = 20. Compute the standard error of the sample mean for n = 25.",
    options: [
      {
        text: "4, since 20/√25 = 20/5",
        correct: true,
        principle: "SE = σ/√n = 20/√25 = 20/5 = 4 - the same computation as the worked example, with σ=20 and n=25.",
      },
      {
        text: "0.8, since 20/25 = 0.8",
        correct: false,
        socratic: "The formula is σ divided by the SQUARE ROOT of n, not σ divided directly by n. Did you take a square root anywhere in this calculation?",
        whyWrong: "This divides σ by n directly (20/25), skipping the square root that the formula σ/√n specifically requires.",
        misconception: "It's easy to drop the square root and treat the formula as a plain division.",
        principle: "Always take √n first, then divide σ by that result - not by n itself.",
      },
      {
        text: "100, by multiplying 20 by 5",
        correct: false,
        whyWrong: "√25 = 5 should be used to DIVIDE σ, not multiply it - multiplying instead of dividing inverts the whole relationship (more data would then seem to increase error, which is backwards).",
        misconception: "It's easy to swap multiplication for division when working through a formula from memory.",
        principle: "SE = σ/√n is always a division - larger n must make SE smaller, never larger.",
      },
    ],
  },
  {
    id: "q7",
    text: "You want to cut the standard error of your sample mean in half. How many times more data do you need to collect?",
    options: [
      {
        text: "4 times as much, since halving SE requires quadrupling n (because of the square root)",
        correct: true,
        principle: "SE ∝ 1/√n - to halve SE, n must increase by a factor of 4, since √4 = 2. This is the same relationship the Module 6/7 worked examples both demonstrate numerically.",
      },
      {
        text: "2 times as much, matching the 2x reduction in SE directly",
        correct: false,
        socratic: "Does SE shrink in direct proportion to n, or to the square root of n? If you double n, does SE really halve, or shrink by less than that?",
        whyWrong: "Doubling n only shrinks SE by a factor of √2 ≈ 1.41, not 2 - reaching an actual 2x reduction in SE requires quadrupling n, not doubling it.",
        misconception: "It's natural to expect a 1-to-1 relationship between a change in data and a change in error, when a square root is actually involved.",
        principle: "To achieve a k-fold reduction in SE, you need n multiplied by k² - here k=2, so n must increase 4-fold.",
      },
      {
        text: "Exactly enough to double the sample's total sum",
        correct: false,
        whyWrong: "The relevant quantity for standard error is the sample SIZE (n), not the sample's total sum - and the two aren't proportional in any way relevant here.",
        misconception: "It's easy to substitute a related-sounding but different quantity for the one the formula actually depends on.",
        principle: "SE depends specifically on n (the count of observations), through σ/√n - not on any running total or sum.",
      },
    ],
  },
  {
    id: "q8",
    text: "A study reports 'ice cream sales strongly predict shark attacks' from real correlated data. What does this module say is the most likely explanation?",
    options: [
      {
        text: "A confounding variable (like summer heat) independently drives both more ice cream sales and more people swimming, without either one causing the other",
        correct: true,
        principle: "This is the same confounding-variable pattern the lesson names directly - a shared underlying cause producing a real correlation with no direct causal link between the two measured things.",
      },
      {
        text: "Ice cream consumption must be biologically attracting sharks somehow",
        correct: false,
        socratic: "Is there a simpler, well-documented shared cause (like summer weather driving both swimming and ice cream sales) that would explain this correlation without needing a direct causal link?",
        whyWrong: "There's a far simpler, well-supported explanation (shared seasonal cause) that doesn't require inventing a direct causal mechanism between ice cream and shark behavior.",
        misconception: "It's easy to reach for a direct causal story before checking whether a shared external cause already explains the pattern.",
        principle: "When two unrelated-sounding things correlate strongly, checking for a shared external cause comes before assuming either one causes the other.",
      },
      {
        text: "The correlation is definitely a coincidence and shouldn't be taken seriously at all",
        correct: false,
        whyWrong: "This correlation has a well-understood, non-coincidental explanation (summer heat) - dismissing it as pure coincidence skips past the actual, identifiable confounding variable.",
        misconception: "It's easy to swing from 'not directly causal' all the way to 'meaningless,' when a real, explainable pattern is often still present.",
        principle: "A real correlation without direct causation usually still has a real explanation - most often a confounding variable, not pure chance.",
      },
    ],
  },
];

export function QuizSection() {
  return <QuizBlock moduleId={7} courseId="math-for-ml" questions={QUESTIONS} sampleSize={5} />;
}
