import { GradientLab } from "@/components/course-engine/GradientLab";
import { MathLevels } from "@/components/course-engine/MathLevels";
import { QuizBlock, type QuizQuestion } from "@/components/course-engine/QuizBlock";
import { InlineMath, BlockMath } from "@/components/course-engine/Math";
import { ProgressiveHint } from "@/components/course-engine/tour/ProgressiveHint";

/* Module-4-specific MDX section components - "Mathematics of Change"
   (derivatives, partial derivatives, gradients, chain rule). Same shared
   engine pattern as modules 1-3. */

export function GradientLabSection() {
  return (
    <div className="mt-5 rounded-xl border border-[#333a4c] bg-[#151920] p-6">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#5fc2e8]/10 px-3 py-1 font-[family-name:var(--font-course-mono)] text-[11px] font-bold uppercase tracking-[0.1em] text-[#5fc2e8]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5fc2e8] shadow-[0_0_8px_#5fc2e8]" />
        Gradient Lab
      </span>
      <GradientLab />
      <ProgressiveHint
        hints={[
          "Drag the point close to the center of the bowl and watch both arrows shrink - what does that tell you about the gradient right at the minimum?",
          "Toggle between showing ∇f and −∇f. Which one actually points toward the bottom of the bowl?",
          "Try a point where the surface is steep in one direction and shallow in the other - do the two partial derivatives (∂f/∂x and ∂f/∂y) come out equal, or very different?",
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
          A derivative is just a slope - how steep a function is at one exact point. On a curve with hills and
          valleys, the slope is positive going uphill, negative going downhill, and exactly zero at the very
          top or bottom. Once a function takes two inputs instead of one (like the surface in the lab above),
          there isn&apos;t one slope anymore - there&apos;s a slope in the x-direction and a separate slope in
          the y-direction. Bundling those two slopes together into one arrow gives you the <b>gradient</b>: an
          arrow that always points toward the steepest way uphill from wherever you&apos;re standing.
        </p>
      }
      applied={
        <div className="flex flex-col gap-3">
          <p>The derivative of a single-variable function measures instantaneous rate of change:</p>
          <BlockMath tex="f'(x) = \frac{df}{dx}" />
          <p>For a function of two variables, a partial derivative holds one variable fixed and differentiates with respect to the other:</p>
          <BlockMath tex="\frac{\partial f}{\partial x},\quad \frac{\partial f}{\partial y}" />
          <p>The gradient bundles both partials into a single vector:</p>
          <BlockMath tex="\nabla f = \left(\frac{\partial f}{\partial x},\; \frac{\partial f}{\partial y}\right)" />
          <p>For the lab&apos;s function <InlineMath tex="f(x,y) = x^2 + 3y^2" />:</p>
          <BlockMath tex="\nabla f = (2x,\; 6y)" />
          <p className="text-[#9aa0ae]">
            Every symbol: <InlineMath tex="x, y" /> are the coordinates you dragged the point to.{" "}
            <InlineMath tex="\nabla f" /> (read &quot;grad f&quot;) always points toward the steepest{" "}
            <i>increase</i> - the direction a gradient-descent optimizer moves is <InlineMath tex="-\nabla f" />, the
            exact opposite arrow, which is why the lab&apos;s toggle flips the sign to show it.
          </p>
        </div>
      }
      proof={
        <div className="flex flex-col gap-3">
          <p>
            Why does the gradient point toward the steepest increase, specifically? For a small step{" "}
            <InlineMath tex="\mathbf{d} = (dx, dy)" /> of fixed length, the resulting change in{" "}
            <InlineMath tex="f" /> is approximated (to first order) by the multivariable chain rule:
          </p>
          <BlockMath tex="df \approx \frac{\partial f}{\partial x}\,dx + \frac{\partial f}{\partial y}\,dy = \nabla f \cdot \mathbf{d}" />
          <p>
            This is exactly a dot product - the same one from Module 1. Recall that{" "}
            <InlineMath tex="\mathbf{a}\cdot\mathbf{b} = \|\mathbf{a}\|\|\mathbf{b}\|\cos\theta" />, which is
            largest exactly when <InlineMath tex="\theta = 0" /> - that is, when the step{" "}
            <InlineMath tex="\mathbf{d}" /> points in the <i>same direction</i> as{" "}
            <InlineMath tex="\nabla f" /> itself. So among every direction you could step, the one that
            increases <InlineMath tex="f" /> the most, for a given step size, is the direction of{" "}
            <InlineMath tex="\nabla f" /> - not by definition, but as a direct consequence of the dot-product
            identity from Module 1.
          </p>
        </div>
      }
    />
  );
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "At the exact center of the bowl in the lab (x=0, y=0), what is the gradient?",
    options: [
      {
        text: "(0, 0) - the zero vector",
        correct: true,
        principle: "∇f = (2x, 6y) = (0, 0) at the origin. A gradient of zero marks a flat point - here, the minimum of the whole surface.",
      },
      {
        text: "It's undefined, because there's no single direction to point at the exact minimum",
        correct: false,
        socratic: "The formula ∇f = (2x, 6y) can be evaluated at any (x, y) you plug in, including (0, 0). Does plugging in x=0, y=0 produce an error, or a valid pair of numbers?",
        whyWrong: "The gradient is a well-defined vector everywhere on this smooth surface, including exactly at the minimum - it's simply the zero vector there, not an undefined one.",
        misconception: "It's easy to confuse 'no preferred direction' with 'undefined,' when zero is itself a perfectly valid, meaningful answer.",
        principle: "∇f = (2x, 6y) is a formula that can be evaluated at any (x, y), including (0, 0), giving exactly (0, 0).",
        tryThis: "In the lab, drag the point as close to the center as you can and watch both partial derivatives shrink toward 0.",
      },
      {
        text: "(1, 1), since that's a 'neutral' direction",
        correct: false,
        socratic: "∇f = (2x, 6y) is a formula, not a guess. What do you get when you actually substitute x=0 and y=0 into (2x, 6y)?",
        whyWrong: "There's no reason for the gradient to default to (1,1) - it's computed directly from the formula (2x, 6y), which gives (0,0) when x=0 and y=0.",
        misconception: "It's tempting to guess a 'default-looking' vector rather than actually applying the formula.",
        principle: "Always compute ∇f = (∂f/∂x, ∂f/∂y) from the actual coordinates, not from intuition about what 'should' be neutral.",
      },
    ],
  },
  {
    id: "q2",
    text: "You're standing at a point where ∇f = (4, 0). Which direction should a gradient-descent step move, to decrease f as fast as possible?",
    options: [
      {
        text: "In the direction (−4, 0) - straight in the negative x direction",
        correct: true,
        principle: "Gradient descent moves along −∇f. If ∇f = (4, 0), then −∇f = (−4, 0): pure movement in the negative x direction.",
      },
      {
        text: "In the direction (4, 0) - straight in the positive x direction",
        correct: false,
        socratic: "(4, 0) is ∇f itself - the direction of steepest INCREASE. If you want to decrease f as fast as possible, should you move with the gradient, or against it?",
        whyWrong: "(4, 0) is ∇f itself, which points toward the steepest INCREASE, not decrease - moving that way would make f larger, the opposite of what training wants.",
        misconception: "It's a very common mix-up to move along the gradient itself rather than its negative.",
        principle: "The gradient always points uphill. Decreasing a loss function requires moving along −∇f, not ∇f.",
        tryThis: "In the lab, leave the toggle off (showing ∇f itself) and check which way the arrow points relative to the basin - it points away from the minimum, not toward it.",
      },
      {
        text: "In the direction (0, 4) - perpendicular to the gradient",
        correct: false,
        socratic: "The dot product identity says the change in f from a step d is approximately ∇f · d. What is ∇f · d when d is perpendicular to ∇f?",
        whyWrong: "Moving perpendicular to the gradient doesn't change f at all, to first order - it's neither the fastest increase nor the fastest decrease.",
        misconception: "It's easy to assume 'the other direction' means perpendicular rather than exactly reversed.",
        principle: "The steepest decrease direction is exactly −∇f, the gradient rotated 180°, not 90°.",
      },
    ],
  },
  {
    id: "q3",
    text: "In neural network training, what does backpropagation actually compute?",
    options: [
      {
        text: "The gradient of the loss function with respect to every weight in the network, using the chain rule",
        correct: true,
        principle: "Backpropagation is the chain rule applied systematically, layer by layer, to compute ∂loss/∂weight for every single weight - exactly the object this module studies, just at a much larger scale.",
      },
      {
        text: "The final predicted output of the network",
        correct: false,
        socratic: "Producing an output from an input is the forward pass. Backpropagation runs AFTER the loss is known, moving backward - what would it even need to compute at that point, if the output is already done?",
        whyWrong: "Computing the output is the forward pass, a separate, earlier step - backpropagation specifically computes gradients, running backward from the loss.",
        misconception: "It's easy to conflate 'what the network does with an input' (forward pass) with 'how the network learns from a mistake' (backpropagation).",
        principle: "Forward pass: input → output. Backpropagation: loss → gradients for every weight, via the chain rule, moving backward through the network.",
      },
      {
        text: "The accuracy of the model on a test set",
        correct: false,
        socratic: "Accuracy is measured by comparing predictions to labels on data - it needs no gradients at all. Does that sound like what a chain-rule computation over network weights would produce?",
        whyWrong: "Accuracy is a separate evaluation metric computed after training or on held-out data - it has nothing to do with what backpropagation itself calculates.",
        misconception: "It's common to bundle 'everything related to how good a model is' into one mental category.",
        principle: "Backpropagation's job is strictly computing gradients so an optimizer knows which way to adjust each weight.",
      },
    ],
  },
  {
    id: "q4",
    text: "Why does ‖∇f‖ (the gradient's magnitude) matter, not just its direction?",
    options: [
      {
        text: "It tells you how steep the surface is at that point - near a minimum it shrinks toward zero, which is a real, usable signal for when training is converging",
        correct: true,
        principle: "A small gradient magnitude near a minimum is exactly why many training loops monitor gradient norm as a stopping/convergence signal.",
      },
      {
        text: "It doesn't matter - only the direction is ever used in any optimization algorithm",
        correct: false,
        socratic: "The gradient-descent update is w − learning_rate × gradient. If the gradient's magnitude were bigger or smaller, would the SIZE of the step actually change?",
        whyWrong: "Magnitude directly affects step size in most optimizers (a larger gradient, all else equal, produces a larger update before any learning-rate scaling), and its shrinking near a minimum is diagnostically useful.",
        misconception: "It's easy to overcorrect toward 'direction is what matters' after learning that the SIGN determines uphill/downhill, and forget the magnitude carries real information too.",
        principle: "Both direction and magnitude of ∇f carry real information: direction says which way, magnitude says how strongly.",
      },
      {
        text: "It always equals exactly the loss value itself",
        correct: false,
        socratic: "f(x,y) tells you the height of the surface at a point; ‖∇f‖ tells you how fast that height is changing nearby. Are 'how high' and 'how steep' the same measurement?",
        whyWrong: "The gradient's magnitude and the function's value are two different numbers computed by two different formulas - nothing forces them to be equal.",
        misconception: "It's tempting to assume any two important numbers coming from the same function must be the same number.",
        principle: "f(x,y) is the function's value; ‖∇f‖ is how fast that value changes nearby - related concepts, but numerically independent.",
      },
    ],
  },
  {
    id: "q5",
    text: "The lab's function is steeper along y than along x (coefficient 3 vs 1). What does that predict about gradient descent's behavior if the learning rate is the same in both directions?",
    options: [
      {
        text: "Steps will tend to overshoot back and forth in the steep (y) direction while crawling slowly in the shallow (x) direction - a real, common training instability",
        correct: true,
        principle: "Uneven steepness across directions is a textbook cause of oscillating/zig-zagging training, which Module 5's optimization lab lets you actually trigger and observe.",
      },
      {
        text: "Nothing - gradient descent always converges at the same rate regardless of the function's shape",
        correct: false,
        socratic: "A learning rate tuned to be safe for the steep y-direction - how large or small would that same rate then be for the much shallower x-direction?",
        whyWrong: "The function's curvature (how steep it is in different directions) has a large, well-documented effect on convergence speed and stability - it's not shape-independent.",
        misconception: "It's easy to assume an algorithm 'just works' the same way regardless of the specific problem it's applied to.",
        principle: "A single learning rate that's well-tuned for a steep direction is often far too large for a shallow one, and vice versa - this mismatch is a real, diagnosable training problem.",
      },
      {
        text: "It means the function has no minimum",
        correct: false,
        socratic: "An elliptical bowl (steeper one way, shallower the other) still has a single lowest point at its center. Does uneven steepness change WHETHER a minimum exists, or just how easy it is to reach with a fixed learning rate?",
        whyWrong: "An elliptical bowl like this one has exactly one minimum (at the origin) regardless of how uneven its steepness is in different directions - uneven steepness affects HOW you get there, not WHETHER a minimum exists.",
        misconception: "It's easy to conflate 'harder to optimize' with 'doesn't have a solution.'",
        principle: "Existence of a minimum and difficulty of reaching it via gradient descent are separate questions.",
      },
    ],
  },
];

const MORE_QUESTIONS: QuizQuestion[] = [
  {
    id: "q6",
    text: "For f(x, y) = x² + 3y², what is ∇f at the point (2, 1)?",
    options: [
      {
        text: "(4, 6)",
        correct: true,
        principle: "∇f = (2x, 6y). Substituting x=2, y=1: (2·2, 6·1) = (4, 6).",
      },
      {
        text: "(2, 1)",
        correct: false,
        socratic: "∇f = (2x, 6y) is a formula involving the COEFFICIENTS from the original function, not just a copy of the input point. Does plugging x=2, y=1 into (2x, 6y) just give back (2, 1)?",
        whyWrong: "This just repeats the input point rather than applying the gradient formula (2x, 6y) to it.",
        misconception: "It's easy to forget to actually apply the derivative formula and just restate the input.",
        principle: "Always apply ∇f = (2x, 6y) to the specific point - here that gives (4, 6), not the point itself.",
      },
      {
        text: "(4, 3)",
        correct: false,
        socratic: "The y-component of ∇f is 6y, not 3y. Did you use the coefficient from the original function f(x,y) = x² + 3y² correctly for the y-partial?",
        whyWrong: "The partial with respect to y is 6y (since the y² term has a coefficient of 3, and differentiating y² gives 2y, so 3·2y = 6y), not 3y.",
        misconception: "It's easy to reuse the original coefficient (3) directly instead of completing the derivative (which doubles it to 6).",
        principle: "∂f/∂y = 6y here because d/dy[3y²] = 3 · 2y = 6y - the coefficient and the exponent's derivative both contribute.",
      },
    ],
  },
  {
    id: "q7",
    text: "You're at the point where ∇f = (0, 3). Is this point a minimum of f?",
    options: [
      {
        text: "Not necessarily - a zero gradient in only one direction isn't enough; you need ALL components to be zero",
        correct: true,
        principle: "A true minimum (or maximum, or flat point) requires ∇f = (0, 0) - every component zero. (0, 3) still has a nonzero y-component, meaning the surface is still sloped in the y-direction.",
      },
      {
        text: "Yes, because one of the components is small enough to ignore",
        correct: false,
        socratic: "Is there a rule in this module that says a gradient component can be 'small enough to ignore'? What does ∇f = (0,0) actually require?",
        whyWrong: "A minimum requires the FULL gradient vector to be exactly (0, 0) - a nonzero y-component of 3 means the surface is still climbing or falling in that direction, wherever you are.",
        misconception: "It's easy to focus on the zero component and treat the nonzero one as negligible, when both must be zero.",
        principle: "∇f = (0, 0) is the complete condition for a flat point - partial flatness in only one direction isn't the same thing.",
      },
      {
        text: "Yes, because gradients only need to be zero in the x-direction to signal a minimum",
        correct: false,
        whyWrong: "There's no special priority given to the x-direction - both partial derivatives must be zero for a point to be a candidate minimum.",
        misconception: "It's easy to arbitrarily treat one axis as more important than the other without a mathematical reason to do so.",
        principle: "Every direction's partial derivative must vanish at a true minimum - x and y are treated identically by the condition ∇f = (0,0).",
      },
    ],
  },
  {
    id: "q8",
    text: "The chain rule says d/dx[g(h(x))] = g'(h(x)) · h'(x). If h(x) = 2x and g(u) = u², what is d/dx[g(h(x))] at x = 3?",
    options: [
      {
        text: "24, since g'(h(x)) = 2h(x) = 12 and h'(x) = 2, so 12 × 2 = 24",
        correct: true,
        principle: "g(h(x)) = (2x)², so its derivative is 2(2x) · 2 = 8x, and 8(3) = 24 - matching the chain-rule computation exactly.",
      },
      {
        text: "6, by just multiplying h(x) and h'(x) together",
        correct: false,
        socratic: "The chain rule specifically requires g'(h(x)) - the derivative of the OUTER function evaluated at h(x) - not h(x) itself. Did you use g' at all, or just h and h'?",
        whyWrong: "This skips g' entirely and just uses h(x)=6 times h'(x)=2 - the outer function's own derivative g'(h(x))=2h(x)=12 is missing from the computation.",
        misconception: "It's easy to forget the outer function's derivative entirely and only differentiate the inner one.",
        principle: "The chain rule needs BOTH factors: the outer function's derivative at the inner value, AND the inner function's own derivative.",
      },
      {
        text: "4, since h'(x) = 2 and that's squared to get 4",
        correct: false,
        whyWrong: "Squaring h'(x) isn't part of the chain rule at all - the rule multiplies g'(h(x)) by h'(x), it doesn't square either piece.",
        misconception: "Since g(u)=u² involves squaring, it's easy to misapply that squaring operation to the wrong part of the chain-rule formula.",
        principle: "The chain rule is a product of two specific derivatives, g'(h(x)) and h'(x) - no squaring operation belongs in the rule itself.",
      },
    ],
  },
];

export function QuizSection() {
  return <QuizBlock moduleId={4} courseId="math-for-ml" questions={[...QUESTIONS, ...MORE_QUESTIONS]} sampleSize={5} />;
}
