import { NeuronLab } from "@/components/course-engine/NeuronLab";
import { MathLevels } from "@/components/course-engine/MathLevels";
import { QuizBlock, type QuizQuestion } from "@/components/course-engine/QuizBlock";
import { InlineMath, BlockMath } from "@/components/course-engine/Math";
import { GuidedTour, type TourStep } from "@/components/course-engine/tour/GuidedTour";
import { ProgressiveHint } from "@/components/course-engine/tour/ProgressiveHint";

const TOUR_STEPS: TourStep[] = [
  {
    target: "neuron-canvas",
    title: "The tiny network",
    body: "Two inputs flow into one neuron: a weighted sum z, then a sigmoid squashes it into an output a between 0 and 1. Green edges are positive weights, red are negative.",
  },
  {
    target: "neuron-sliders",
    title: "Weights, bias, and learning rate",
    body: "w1 and w2 scale each input, b shifts the sum independent of the inputs, and the learning rate controls how big each gradient-descent step is.",
  },
  {
    target: "neuron-loss",
    title: "The loss",
    body: "This is what training tries to shrink: how far the neuron's output a is from the target. Every gradient below is computed from this exact number.",
  },
  {
    target: "neuron-grad",
    title: "The gradient",
    body: "∂Loss/∂w1 is the chain rule from Module 4 applied here: how loss changes if w1 changes, computed by multiplying three local derivatives together.",
  },
  {
    target: "neuron-step",
    title: "Step and watch it learn",
    body: "Click Step to take one real gradient-descent update — the exact rule from Module 5, applied to this neuron's own loss surface.",
  },
];

export function NeuronLabSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
          Neural Network Math Lab
        </span>
        <GuidedTour steps={TOUR_STEPS} />
      </div>
      <NeuronLab />
      <ProgressiveHint
        hints={[
          "Start by watching the loss stat while you drag w1 — does the loss go up or down as you move it further from the value that makes a match the target?",
          "Now click Step a few times without touching the sliders. The gradient shown updates each time because w1, w2, and b all changed on the previous step.",
          "Try setting the learning rate very high (near 5) and stepping repeatedly — does the loss decrease smoothly, or does it start bouncing around like Module 5's oscillation case?",
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
          A single artificial neuron does exactly what every module so far has been building toward: it takes
          a weighted sum of its inputs (Module 1&apos;s dot product, Module 2&apos;s linear transformation),
          squashes that sum through an activation function to produce an output, compares that output to a
          target (Module 8&apos;s likelihood framing, if you use the right loss), and uses the gradient
          (Module 4) of that comparison to nudge every weight in the direction that would have made the
          output a little more correct (Module 5&apos;s gradient descent). A real neural network is this exact
          loop, repeated across many more neurons, many more layers, and many more examples.
        </p>
      }
      applied={
        <div className="flex flex-col gap-3">
          <p>Forward pass — weighted sum, then activation:</p>
          <BlockMath tex="z = w_1x_1 + w_2x_2 + b \qquad a = \sigma(z) = \frac{1}{1+e^{-z}}" />
          <p>Loss — how far the output is from the target:</p>
          <BlockMath tex="L = (a - y)^2" />
          <p>Backward pass — the chain rule, applied step by step back through the forward computation:</p>
          <BlockMath tex="\frac{\partial L}{\partial w_1} = \frac{\partial L}{\partial a}\cdot\frac{\partial a}{\partial z}\cdot\frac{\partial z}{\partial w_1}" />
          <p className="text-[#9aa0ae]">
            Every symbol: <InlineMath tex="x_1, x_2" /> are the fixed inputs. <InlineMath tex="w_1, w_2, b" /> are
            the lab&apos;s sliders. <InlineMath tex="\sigma" /> is the sigmoid activation, squashing any real
            number into (0, 1). <InlineMath tex="y" /> is the target. Each factor in the chain-rule product is
            individually simple — it&apos;s the CHAINING of simple derivatives that makes backpropagation work
            for networks with many layers, not any one difficult step.
          </p>
        </div>
      }
      proof={
        <div className="flex flex-col gap-3">
          <p>Each piece of the chain rule product, computed explicitly:</p>
          <BlockMath tex="\frac{\partial L}{\partial a} = 2(a-y)" />
          <p>The sigmoid&apos;s own derivative has a famously clean form in terms of its own output:</p>
          <BlockMath tex="\frac{\partial a}{\partial z} = \sigma(z)\bigl(1-\sigma(z)\bigr) = a(1-a)" />
          <p>And the weighted sum&apos;s derivative with respect to any one weight is just that weight&apos;s input:</p>
          <BlockMath tex="\frac{\partial z}{\partial w_1} = x_1" />
          <p>Multiplying all three together gives the exact gradient the lab computes on every step:</p>
          <BlockMath tex="\frac{\partial L}{\partial w_1} = 2(a-y)\cdot a(1-a)\cdot x_1" />
          <p>
            This is backpropagation in miniature: compute the forward pass, then walk backward through the
            same computation, multiplying local derivatives together at each step. A real network just has many
            more of these multiplications chained together, one per layer, computed automatically instead of by
            hand.
          </p>
        </div>
      }
    />
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "In the lab, w1 has a large POSITIVE gradient ∂L/∂w1. What does the gradient-descent step do to w1?",
    options: [
      {
        text: "Decreases w1 by a meaningful amount, since the update rule is w1_new = w1 − learning_rate × ∂L/∂w1",
        correct: true,
        principle: "This is Module 5's update rule applied to one specific weight — a large positive gradient means a large decrease.",
      },
      {
        text: "Increases w1, since gradient descent moves toward the gradient",
        correct: false,
        socratic: "The update rule has a MINUS sign: w1_new = w1 − learning_rate × gradient. If the gradient is positive, does subtracting a positive number increase or decrease w1?",
        whyWrong: "Gradient DESCENT moves opposite to the gradient (subtracting it), not toward it — this is the exact sign mix-up Module 5's quiz specifically called out.",
        misconception: "It's a recurring, easy mistake to move along the gradient instead of against it.",
        principle: "w_new = w_old − η·∂L/∂w — the minus sign is what makes it descent.",
        tryThis: "In the lab, note w1's value, click Step, and check whether w1 moved up or down relative to the sign of ∂L/∂w1 shown.",
      },
      {
        text: "Sets w1 to exactly zero, to remove its influence",
        correct: false,
        socratic: "The update is w1 − learning_rate × gradient — a subtraction of some computed amount. Is there anything in that formula that forces the result to land exactly on zero?",
        whyWrong: "Gradient descent makes an incremental, proportional adjustment (scaled by the learning rate) — it doesn't zero out a weight in one step regardless of gradient size.",
        misconception: "It's easy to imagine an update as a drastic correction rather than a small, controlled step.",
        principle: "The update's size is η × gradient — a big learning rate and a big gradient can produce a big change, but it's still a computed adjustment, not a reset.",
      },
    ],
  },
  {
    id: "q2",
    text: "Why does the chain rule multiply three separate derivatives together (∂L/∂a, ∂a/∂z, ∂z/∂w1) instead of computing ∂L/∂w1 directly in one step?",
    options: [
      {
        text: "Because w1 doesn't affect L directly — it affects z, which affects a, which affects L, so the influence has to be tracked through each intermediate step",
        correct: true,
        principle: "This is exactly the multi-step chain rule from Module 4, and it's the reason backpropagation scales to networks with many layers: each layer only needs to know its own local derivative.",
      },
      {
        text: "Computing it directly in one step would give a different (wrong) answer than the chain-rule version",
        correct: false,
        socratic: "The Full Derivation level of Show Me the Math multiplies the three terms out explicitly. If you fully expanded L in terms of w1 by hand, algebraically, would that expression differ from the chain-rule product?",
        whyWrong: "For a function this simple, a direct symbolic derivative (fully expanding L in terms of w1) would give the exact same answer as the chain rule — the chain rule isn't a different, approximate method, it's the correct and more scalable way to organize the same computation.",
        misconception: "It's easy to assume a more complex-looking method must be solving a different problem than a simpler one, rather than the same problem more efficiently.",
        principle: "The chain rule and a fully-expanded direct derivative agree exactly — the practical value of the chain rule is that it stays manageable as the number of intermediate steps (layers) grows.",
      },
      {
        text: "It's an approximation used only because computers can't do exact calculus",
        correct: false,
        socratic: "Each factor — ∂L/∂a, ∂a/∂z, ∂z/∂w1 — is a closed-form derivative computed with an exact formula, not estimated numerically. Does multiplying exact numbers together introduce approximation?",
        whyWrong: "The chain rule is an exact mathematical identity, not a numerical approximation — every term multiplied together is computed exactly (as the Full Derivation level shows), with no approximation involved.",
        misconception: "It's easy to assume anything computed inside software must be an approximation.",
        principle: "Backpropagation via the chain rule computes exact gradients (up to floating-point precision), not approximate ones.",
      },
    ],
  },
  {
    id: "q3",
    text: "What is a bias term (b) actually for, in this neuron?",
    options: [
      {
        text: "It shifts the weighted sum z up or down independent of the inputs, letting the neuron activate even when all inputs are zero, or stay inactive even with substantial input",
        correct: true,
        principle: "Without a bias, z=0 whenever all inputs are 0, forcing a=σ(0)=0.5 regardless of what the neuron 'should' output in that case — the bias removes that rigid constraint.",
      },
      {
        text: "It's a leftover historical term with no real mathematical function today",
        correct: false,
        socratic: "Try dragging the b slider in the lab while watching z. Does z actually change, even if you don't touch x1 or x2 at all?",
        whyWrong: "The bias directly appears in the formula z = w1x1 + w2x2 + b and has a real, checkable effect — try setting b to different values in the lab and watch z (and therefore a and the loss) change accordingly.",
        misconception: "It's easy to dismiss a term as 'legacy' when it hasn't been clearly explained yet.",
        principle: "b is an active, functioning parameter in the formula, updated by gradient descent exactly like w1 and w2.",
      },
      {
        text: "It controls the learning rate for this specific neuron",
        correct: false,
        socratic: "b appears in the forward-pass formula z = w1x1 + w2x2 + b. Does the learning rate appear anywhere in that formula, or only in the separate update rule?",
        whyWrong: "The bias and the learning rate are two completely different quantities in this lab — the bias is a model parameter (adjustable via its own slider, updated by gradient descent), while the learning rate is a separate hyperparameter controlling step size.",
        misconception: "It's easy to conflate two different sliders/parameters that both sound like 'tuning knobs.'",
        principle: "b is part of the forward-pass formula; the learning rate only appears in the update rule, a distinct role.",
      },
    ],
  },
  {
    id: "q4",
    text: "You click 'Step' repeatedly and watch the loss shown in the lab. What should happen, if the learning rate is reasonable?",
    options: [
      {
        text: "The loss should generally decrease over repeated steps, since each step moves the weights in the direction that locally reduces it",
        correct: true,
        principle: "This is the entire point of gradient descent applied to this neuron — the loss is exactly the quantity being minimized, step by step.",
      },
      {
        text: "The loss should immediately drop to exactly zero after one step",
        correct: false,
        socratic: "A gradient step moves weights by learning_rate × gradient — a finite, local nudge, not a search for the exact solution. Would one small nudge in the right direction usually land exactly on the minimum?",
        whyWrong: "One gradient step makes a small, local improvement — reaching exactly zero loss (a perfect fit) in a single step is not what gradient descent does, especially for a nonlinear (sigmoid) output.",
        misconception: "It's easy to imagine an optimization step as instantly 'solving' the problem rather than incrementally improving it.",
        principle: "Gradient descent typically needs many steps to substantially reduce loss — try clicking Step repeatedly and watching the gradual trend, not an instant jump.",
      },
      {
        text: "The loss is unrelated to the weight updates and won't change from stepping",
        correct: false,
        socratic: "Trace the dependency chain: weights → z → a → loss. If w1 changes, does z have to stay the same?",
        whyWrong: "The loss is computed directly from a, which is computed directly from z, which is computed directly from w1, w2, and b — updating those weights necessarily changes the loss on the next render.",
        misconception: "It's easy to lose track of the dependency chain (weights → z → a → loss) when several quantities are shown at once.",
        principle: "Every displayed quantity in the lab is a deterministic function of the current w1, w2, b — nothing is independent of the weight updates.",
      },
    ],
  },
  {
    id: "q5",
    text: "A real network has many layers, not just one neuron. What does this module's chain rule pattern predict about training a much deeper network?",
    options: [
      {
        text: "The same local-derivative-multiplication pattern repeats through every layer, chaining together many more terms — this is exactly what 'backpropagation' means at scale",
        correct: true,
        principle: "This module's 3-term chain rule is literally the same operation a deep network performs, just with many more layers' worth of local derivatives multiplied together.",
      },
      {
        text: "Deeper networks require a completely different mathematical technique unrelated to the chain rule",
        correct: false,
        socratic: "Backpropagation, the algorithm every deep learning framework actually runs, is described as 'the chain rule applied layer by layer.' Does that description sound like a different technique, or the same one repeated more times?",
        whyWrong: "Backpropagation, the standard training algorithm for networks of any depth, IS the chain rule applied systematically layer by layer — it's the same technique, not a different one.",
        misconception: "It's easy to assume 'production-scale' techniques must be entirely different from what a small, hand-workable example demonstrates.",
        principle: "This lab's forward-pass-then-backward-pass structure is the same structure used (via automatic differentiation) in every deep learning framework, just automated and scaled up.",
      },
      {
        text: "Adding more layers doesn't change how gradients are computed, only how many neurons exist per layer",
        correct: false,
        socratic: "This lab's chain rule has exactly 3 links because the path from w1 to the loss passes through exactly 2 intermediate quantities (z, then a). If you stacked another layer in between, would the path from an early weight to the loss gain another link, or stay the same length?",
        whyWrong: "More LAYERS specifically means more chain-rule terms multiplied together (one additional local derivative per layer depth), which is a different effect than adding more neurons within a single layer.",
        misconception: "It's easy to conflate 'network is wider' (more neurons per layer) with 'network is deeper' (more layers) — they have different mathematical implications for the chain rule.",
        principle: "Depth adds more links to the chain-rule product; width adds more parallel weighted sums within a layer — related but distinct effects.",
      },
    ],
  },
];

export function QuizSection() {
  return <QuizBlock moduleId={10} courseId="math-for-ml" questions={QUESTIONS} />;
}
