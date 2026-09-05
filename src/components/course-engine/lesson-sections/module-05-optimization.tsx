import { GradientDescentLab } from "@/components/course-engine/GradientDescentLab";
import { MathLevels } from "@/components/course-engine/MathLevels";
import { QuizBlock, type QuizQuestion } from "@/components/course-engine/QuizBlock";
import { InlineMath, BlockMath } from "@/components/course-engine/Math";
import { GuidedTour, type TourStep } from "@/components/course-engine/tour/GuidedTour";
import { ProgressiveHint } from "@/components/course-engine/tour/ProgressiveHint";

const TOUR_STEPS: TourStep[] = [
  { target: "gd-canvas", title: "Click to place a starting point", body: "The heatmap is the same loss surface from Module 4. Click anywhere to restart gradient descent from that exact point." },
  { target: "gd-lr", title: "The learning rate", body: "This one slider decides whether you converge smoothly, oscillate, or diverge. Try a small value first, then push it higher." },
  { target: "gd-steps", title: "Step through it", body: "Step ×1 gives you fine control near an interesting learning rate; Step ×10 gets you to the interesting part fast." },
  { target: "gd-loss", title: "Watch the loss", body: "A shrinking number means real convergence. A growing one means you've found this surface's instability threshold — on purpose." },
];

export function GradientDescentLabSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
          Gradient Descent Lab
        </span>
        <GuidedTour steps={TOUR_STEPS} />
      </div>
      <GradientDescentLab />
      <ProgressiveHint
        hints={[
          "Start with a small learning rate (under 0.1) and click Step ×10 a few times — you should see the path spiral smoothly into the center.",
          "This surface is steeper in y (coefficient 3) than in x (coefficient 1) — the theoretical instability threshold for y is η < 1/3, tighter than x's η < 1.",
          "Try a learning rate right around 0.33 and watch the y-coordinate specifically — does it settle down, bounce back and forth, or grow?",
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
          Gradient descent is a very simple recipe repeated many times: look at which way is downhill from
          where you are right now, take a step that direction, and repeat. The learning rate controls how big
          each step is. Too small, and you crawl toward the minimum forever. Too large, and you can leap right
          over the minimum and land further away than you started — sometimes so far that the next step lands
          even further, spiraling out of control instead of converging.
        </p>
      }
      applied={
        <div className="flex flex-col gap-3">
          <p>The gradient descent update rule, applied once per step:</p>
          <BlockMath tex="\mathbf{x}_{n+1} = \mathbf{x}_n - \eta \nabla f(\mathbf{x}_n)" />
          <p className="text-[#9aa0ae]">
            Every symbol: <InlineMath tex="\mathbf{x}_n" /> is the current point (the lab&apos;s red dot before a
            step). <InlineMath tex="\eta" /> (eta) is the learning rate — the slider in the lab.{" "}
            <InlineMath tex="\nabla f(\mathbf{x}_n)" /> is the gradient at the current point, from Module 4.{" "}
            <InlineMath tex="\mathbf{x}_{n+1}" /> is where the point lands next. Run this update enough times
            and, for a small enough <InlineMath tex="\eta" />, <InlineMath tex="\mathbf{x}_n" /> converges to a
            point where <InlineMath tex="\nabla f = \mathbf{0}" /> — a minimum.
          </p>
        </div>
      }
      proof={
        <div className="flex flex-col gap-3">
          <p>
            For the lab&apos;s function <InlineMath tex="f(x,y) = x^2 + 3y^2" />, the gradient is{" "}
            <InlineMath tex="(2x, 6y)" />, so the update rule for the y-coordinate alone is:
          </p>
          <BlockMath tex="y_{n+1} = y_n - \eta(6y_n) = y_n(1 - 6\eta)" />
          <p>
            This is a simple geometric sequence: <InlineMath tex="y_n = y_0(1-6\eta)^n" />. Whether this
            converges to zero depends entirely on the size of <InlineMath tex="|1-6\eta|" />:
          </p>
          <BlockMath tex="|1 - 6\eta| < 1 \iff 0 < \eta < \tfrac{1}{3}" />
          <p>
            This is exactly why the lab&apos;s y-direction (the steeper one, coefficient 3) is the one that
            oscillates or diverges first as you raise the learning rate — the stable range for it is smaller
            than for the shallower x-direction (coefficient 1, stable up to <InlineMath tex="\eta < 1" />).
            When <InlineMath tex="|1-6\eta| > 1" />, each step is literally further from zero than the last —
            that is exactly divergence, derived directly from the update rule, not observed by accident.
          </p>
        </div>
      }
    />
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "You run gradient descent and the loss value grows larger with every step instead of shrinking. What's the most likely cause?",
    options: [
      {
        text: "The learning rate is too large for this loss surface's curvature",
        correct: true,
        principle: "A learning rate outside the stable range for a direction (see the derivation above) causes each step to overshoot further than the last — that's growing loss, i.e. divergence.",
      },
      {
        text: "The gradient was computed incorrectly and always points the wrong way",
        correct: false,
        socratic: "A wrong-signed gradient would walk steadily uphill in a straight line. Does 'growing larger with every step' sound like a steady walk, or something more like overshooting back and forth?",
        whyWrong: "A wrong-signed gradient would send the point away from the minimum in a straight line, not the oscillating, ever-growing-then-shrinking-then-growing pattern that a too-large learning rate produces.",
        misconception: "It's a natural first guess to blame the gradient itself when training misbehaves, since a sign error is also a real, separate failure mode.",
        principle: "Divergence with growing-then-overshooting behavior is the specific signature of too-large a step size, not a wrong-signed gradient (which just walks confidently uphill instead).",
      },
      {
        text: "The starting point was too close to the minimum",
        correct: false,
        socratic: "If you're already close to the minimum with a well-chosen learning rate, would you expect to converge faster or slower than starting far away?",
        whyWrong: "Starting close to a minimum should make convergence easier and faster, not cause growing loss — a well-behaved optimizer with a reasonable learning rate converges fastest from a nearby start.",
        misconception: "It's easy to assume something about the starting conditions must be wrong when the real issue is a hyperparameter (the learning rate).",
        principle: "Divergence is a learning-rate-vs-curvature problem, independent of how close the starting point was to the minimum.",
      },
    ],
  },
  {
    id: "q2",
    text: "In the lab, the y-direction (coefficient 3) becomes unstable at a smaller learning rate than the x-direction (coefficient 1). Why?",
    options: [
      {
        text: "A steeper direction has a larger gradient for the same displacement, so the same learning rate produces a bigger, more overshoot-prone step there",
        correct: true,
        principle: "The stability condition η < 1/(2·coefficient) is tighter for a larger coefficient — exactly why real optimizers often need per-direction or adaptive learning rates for unevenly-curved loss surfaces.",
      },
      {
        text: "It's a rendering artifact of the lab, not a real mathematical effect",
        correct: false,
        socratic: "Could you derive the instability threshold η < 1/3 for y using only pen-and-paper algebra on the update rule, with no lab or visualization involved at all?",
        whyWrong: "This is a real, derivable consequence of the update rule (see the Full Derivation level above) — it would occur with pen and paper, not just in this specific visualization.",
        misconception: "It's easy to assume something visually striking in a demo must be a display quirk rather than the actual underlying mathematics.",
        principle: "The instability threshold η < 1/3 for the y-direction (vs η < 1 for x) comes directly from the algebra of the update rule, not from how the lab happens to draw it.",
      },
      {
        text: "The y-direction has a smaller gradient, making it harder to move",
        correct: false,
        socratic: "The gradient is (2x, 6y). For the same coordinate value, is the y-component's coefficient (6) bigger or smaller than x's (2)?",
        whyWrong: "The opposite is true — the y-direction has coefficient 3, giving it a LARGER gradient (6y vs 2x) for the same displacement, which is exactly why it's more overshoot-prone, not less.",
        misconception: "It's easy to mix up which direction being 'steeper' means a larger vs. smaller gradient.",
        principle: "A steeper (higher-coefficient) direction produces a larger gradient magnitude for the same coordinate value, making its stable learning-rate range narrower.",
      },
    ],
  },
  {
    id: "q3",
    text: "Why do real optimizers like Adam use a different effective learning rate for different parameters, instead of one shared value?",
    options: [
      {
        text: "Different parameters/directions in a real loss landscape often have very different curvature, and a single learning rate that's safe for the steepest direction can be far too small for the shallowest one",
        correct: true,
        principle: "This module's y-vs-x instability difference is a 2-parameter miniature of exactly the problem adaptive optimizers were designed to solve at scale.",
      },
      {
        text: "To make training use less memory",
        correct: false,
        socratic: "Would tracking a separate effective learning rate for every parameter require MORE bookkeeping/state, or LESS, compared to one shared number?",
        whyWrong: "Per-parameter learning rates actually require MORE memory (extra state per parameter), not less — memory efficiency isn't the motivation.",
        misconception: "It's easy to guess 'efficiency' as a catch-all justification for any optimizer design choice.",
        principle: "The motivation is optimization behavior (handling uneven curvature well), not memory footprint.",
      },
      {
        text: "Because gradients are always positive and a shared learning rate can't represent that",
        correct: false,
        socratic: "Look back at the gradient formula (2x, 6y) — if x or y is negative, is the corresponding gradient component still positive?",
        whyWrong: "Gradients are frequently negative (this module's own examples have negative gradient components) — this isn't the relevant constraint at all.",
        misconception: "It's easy to invent a plausible-sounding but unrelated technical reason when the real cause (differing curvature) hasn't been learned yet.",
        principle: "The real driver is curvature differences across directions/parameters, exactly as demonstrated by this lab's x vs. y instability gap.",
      },
    ],
  },
  {
    id: "q4",
    text: "You reset the lab and click Step ×1 exactly once from the starting point. What determines exactly where the point lands?",
    options: [
      {
        text: "The starting point's gradient and the current learning rate, via x_new = x - η∇f(x)",
        correct: true,
        principle: "One step is a direct, deterministic application of the update rule — no randomness, no approximation beyond the formula itself.",
      },
      {
        text: "A small amount of randomness is added to help escape local minima",
        correct: false,
        socratic: "If you reset and click Step ×1 twice in a row from the exact same starting point, would you expect two different results, or the same one both times?",
        whyWrong: "This lab's gradient descent is fully deterministic — the same starting point and learning rate always produce exactly the same next point, with no randomness injected.",
        misconception: "It's easy to import mental models from stochastic gradient descent (which does involve randomness, from mini-batching) onto plain gradient descent (which doesn't).",
        principle: "Plain gradient descent, as implemented here, is a deterministic formula: the same inputs always produce the same output.",
      },
      {
        text: "It always lands exactly at the minimum after one step, regardless of learning rate",
        correct: false,
        socratic: "The update rule moves a FRACTION of the way based on the gradient and learning rate. Does anything in that formula guarantee landing exactly at (0,0) after just one application?",
        whyWrong: "One step almost never reaches the exact minimum — it moves partway (or, with too large a learning rate, overshoots past it) according to the formula, not directly to (0,0).",
        misconception: "It's tempting to imagine an optimization step as 'solving' the problem outright rather than making one incremental, formula-driven move.",
        principle: "Each step is one application of x_new = x - η∇f(x) — reaching the true minimum typically takes many steps, not one.",
      },
    ],
  },
  {
    id: "q5",
    text: "A training curve shows loss decreasing smoothly for 100 steps, then suddenly spiking up and never recovering. Based on this module, what's a reasonable first thing to check?",
    options: [
      {
        text: "Whether the learning rate (or a learning-rate schedule) increased or stayed too large once the loss landscape near the new region got steeper",
        correct: true,
        principle: "A sudden spike-and-never-recover pattern, after smooth progress, is a classic signature of hitting a steeper region where the existing learning rate is now unstable — exactly this module's core lesson.",
      },
      {
        text: "Whether the dataset was shuffled before training started",
        correct: false,
        socratic: "Does the specific pattern described — smooth progress, THEN a sudden spike that never recovers — sound more like a data-ordering issue, or a learning-rate/curvature mismatch you can trigger yourself in this lab?",
        whyWrong: "Dataset shuffling affects training dynamics in other ways, but it doesn't explain a specific pattern of 'smooth progress, then sudden irrecoverable divergence' the way a learning-rate/curvature mismatch does.",
        misconception: "It's easy to reach for a generic 'data hygiene' checklist item rather than reasoning from the specific failure pattern described.",
        principle: "The described symptom (smooth then suddenly diverging) points specifically at an optimization-stability issue, which this module gives you the tools to diagnose.",
      },
      {
        text: "Whether the model has enough parameters",
        correct: false,
        socratic: "Would too few parameters explain a SUDDEN spike after 100 steps of smooth progress, or would it more likely show up as the loss never getting very low in the first place?",
        whyWrong: "Model capacity issues (too few parameters) typically show up as loss plateauing too high, not as smooth progress followed by a sudden spike.",
        misconception: "It's easy to reach for 'the model isn't big enough' as a default explanation for almost any training problem.",
        principle: "Capacity problems and optimization-stability problems have different symptoms — matching the symptom to the right category is the diagnostic skill this module builds.",
      },
    ],
  },
];

export function QuizSection() {
  return <QuizBlock moduleId={5} courseId="math-for-ml" questions={QUESTIONS} />;
}
