import type { PracticeTask } from "./types";

/* 35 real practice tasks across all 11 modules — distinct from each
   module's checkpoint quiz (different questions, different framing),
   giving students repeated exposure beyond the one pass/fail gate.
   Calculation tasks are graded by real arithmetic (a numeric answer plus
   tolerance); interpretation/debugging/decision tasks are graded like the
   quiz's multiple-choice pattern but framed as untimed, retriable practice
   rather than a module-completion gate. */

export const PRACTICE_TASKS: PracticeTask[] = [
  // ---------------- Module 1: Vectors ----------------
  {
    id: "m1-calc-dot",
    moduleId: 1,
    type: "calculation",
    given: "a = (3, 4), b = (2, -1)",
    prompt: "Compute a · b.",
    answer: 2,
    tolerance: 0.01,
    hint: "a · b = a₁b₁ + a₂b₂.",
    explanation: "a · b = (3)(2) + (4)(-1) = 6 - 4 = 2.",
  },
  {
    id: "m1-calc-magnitude",
    moduleId: 1,
    type: "calculation",
    given: "v = (6, 8)",
    prompt: "Compute ‖v‖ (the magnitude of v).",
    answer: 10,
    tolerance: 0.01,
    hint: "‖v‖ = √(v₁² + v₂²).",
    explanation: "‖v‖ = √(36 + 64) = √100 = 10.",
  },
  {
    id: "m1-interp-cossim",
    moduleId: 1,
    type: "interpretation",
    prompt: "Two document embeddings have a cosine similarity of exactly -1. What does that tell a search engine?",
    options: [
      { text: "The documents are about exactly opposite things — as unrelated as this metric can express", correct: true, feedback: "Correct. -1 is the minimum possible cosine similarity, reached only at a perfect opposite direction." },
      { text: "The documents are identical", correct: false, feedback: "Identical documents would produce a cosine similarity of +1, not -1 — the two ends of the scale mean opposite things." },
      { text: "One document is much longer than the other", correct: false, feedback: "Cosine similarity is normalized specifically to remove any effect of length/magnitude — it says nothing about document length." },
    ],
  },
  {
    id: "m1-debug-dotproduct",
    moduleId: 1,
    type: "debugging",
    given: "a = (2, 3), b = (4, 1). A student computes a · b as 2 + 3 + 4 + 1 = 10.",
    prompt: "What did the student do wrong?",
    options: [
      { text: "They added all four numbers together instead of multiplying matching components and summing those products", correct: true, feedback: "Correct. The right computation is (2)(4) + (3)(1) = 8 + 3 = 11 — multiply matching components first, then add." },
      { text: "Nothing — 10 is correct", correct: false, feedback: "10 is not correct. The real dot product is (2)(4) + (3)(1) = 11." },
      { text: "They should have subtracted instead of added", correct: false, feedback: "The dot product does use addition — the error is that the student never multiplied the matching components first." },
    ],
  },

  // ---------------- Module 2: Matrices ----------------
  {
    id: "m2-calc-matvec",
    moduleId: 2,
    type: "calculation",
    given: "M = [[2, 0], [1, 3]], v = (1, 2)",
    prompt: "Compute the y-component (second entry) of Mv.",
    answer: 7,
    tolerance: 0.01,
    hint: "The second row of M gives the y-component: (row 2) · v.",
    explanation: "y-component = (1)(1) + (3)(2) = 1 + 6 = 7.",
  },
  {
    id: "m2-calc-det",
    moduleId: 2,
    type: "calculation",
    given: "M = [[3, 1], [2, 4]]",
    prompt: "Compute det(M).",
    answer: 10,
    tolerance: 0.01,
    hint: "det(M) = ad - bc.",
    explanation: "det(M) = (3)(4) - (1)(2) = 12 - 2 = 10.",
  },
  {
    id: "m2-interp-detzero",
    moduleId: 2,
    type: "interpretation",
    prompt: "A transformation matrix has det(M) = 0. What does this mean for the transformation?",
    options: [
      { text: "It collapses the plane onto a line (or a point) and cannot be undone by any other matrix", correct: true, feedback: "Correct. Zero determinant means the two columns are parallel (or zero) — a real dimension of information is destroyed." },
      { text: "It rotates everything by 90 degrees", correct: false, feedback: "A rotation preserves area and has determinant 1, not 0 — this is a very different effect." },
      { text: "It has no effect on any vector", correct: false, feedback: "That would be the identity matrix (det = 1), the opposite of a determinant-zero matrix." },
    ],
  },
  {
    id: "m2-debug-det",
    moduleId: 2,
    type: "debugging",
    given: "M = [[2, 5], [1, 3]]. A student computes det(M) as (2)(3) + (5)(1) = 11.",
    prompt: "What did the student do wrong?",
    options: [
      { text: "They added ad and bc instead of subtracting: det(M) = ad − bc, not ad + bc", correct: true, feedback: "Correct. det(M) = (2)(3) - (5)(1) = 6 - 5 = 1, not 11." },
      { text: "They should have multiplied all four numbers together", correct: false, feedback: "The determinant formula for a 2x2 matrix is ad - bc, never a product of all four entries." },
      { text: "Nothing — 11 is correct", correct: false, feedback: "11 is not correct. The determinant subtracts bc from ad: (2)(3) - (5)(1) = 1." },
    ],
  },

  // ---------------- Module 3: PCA ----------------
  {
    id: "m3-interp-varexplained",
    moduleId: 3,
    type: "interpretation",
    prompt: "PC1 explains 95% of a dataset's variance. What's the most accurate description of what that means?",
    options: [
      { text: "Almost all of the dataset's spread lies along one direction — reducing to 1D along PC1 would lose very little information", correct: true, feedback: "Correct — this is exactly the justification for dimensionality reduction." },
      { text: "95% of the individual data points sit exactly on the PC1 line", correct: false, feedback: "Variance explained is an aggregate statistic about total spread, not a count of points sitting exactly on a line." },
      { text: "The model is 95% accurate", correct: false, feedback: "PCA has no 'accuracy' — it isn't a prediction method, it's a description of how spread out the data is in different directions." },
    ],
  },
  {
    id: "m3-calc-eigenvalue",
    moduleId: 3,
    type: "calculation",
    given: "A covariance matrix is diagonal: [[4, 0], [0, 1]]",
    prompt: "What is the larger eigenvalue, λ1?",
    answer: 4,
    tolerance: 0.01,
    hint: "For a diagonal matrix, the eigenvalues are just the diagonal entries themselves.",
    explanation: "For a diagonal matrix, Mv=λv is satisfied by the standard basis vectors with λ equal to each diagonal entry — so λ1=4, λ2=1.",
  },
  {
    id: "m3-decision-lowvariance",
    moduleId: 3,
    type: "decision",
    given: "A fraud-detection dataset has 99.9% of its variance in 'normal transaction size' and 0.1% in a direction that happens to carry the fraud signal.",
    prompt: "Should you drop the low-variance direction to reduce dimensions?",
    options: [
      { text: "No — check what a low-variance direction represents before dropping it; PCA doesn't know which direction matters for your task", correct: true, feedback: "Correct. This is the exact failure mode from the lesson — variance explained isn't the same as task-relevance." },
      { text: "Yes — PCA always drops the least useful information first", correct: false, feedback: "PCA ranks directions by variance, not by relevance to any particular downstream task — a rare but critical signal can live in a low-variance direction." },
      { text: "It doesn't matter which directions you keep, as long as you keep 95% of total variance", correct: false, feedback: "A fixed variance threshold doesn't guarantee you keep task-relevant information — exactly the scenario described here." },
    ],
  },

  // ---------------- Module 4: Calculus ----------------
  {
    id: "m4-calc-partial",
    moduleId: 4,
    type: "calculation",
    given: "f(x, y) = x² + 3y², at the point x = 2",
    prompt: "Compute ∂f/∂x at that point.",
    answer: 4,
    tolerance: 0.01,
    hint: "∂f/∂x = 2x, holding y fixed.",
    explanation: "∂f/∂x = 2x = 2(2) = 4.",
  },
  {
    id: "m4-calc-gradmag",
    moduleId: 4,
    type: "calculation",
    given: "f(x, y) = x² + y², at the point (3, 4)",
    prompt: "Compute ‖∇f‖ at that point.",
    answer: 10,
    tolerance: 0.01,
    hint: "∇f = (2x, 2y). Then take the magnitude of that vector.",
    explanation: "∇f = (6, 8), and ‖(6,8)‖ = √(36+64) = √100 = 10.",
  },
  {
    id: "m4-interp-zerograd",
    moduleId: 4,
    type: "interpretation",
    prompt: "You compute ∇f = (0, 0) at a point. What does that tell you?",
    options: [
      { text: "You're at a flat point — a local minimum, maximum, or saddle point of f", correct: true, feedback: "Correct. A zero gradient means no direction increases f — that's the defining condition of a critical point." },
      { text: "The function is undefined there", correct: false, feedback: "A zero gradient is a perfectly well-defined value — it marks a flat point, not an undefined one." },
      { text: "You made a calculation error, since gradients are never exactly zero", correct: false, feedback: "Gradients are exactly zero at genuine critical points — for example, the origin for f(x,y)=x²+y²." },
    ],
  },

  // ---------------- Module 5: Optimization ----------------
  {
    id: "m5-calc-step",
    moduleId: 5,
    type: "calculation",
    given: "x = 4, ∂L/∂x = 6, learning rate η = 0.1",
    prompt: "Compute x_new after one gradient descent step.",
    answer: 3.4,
    tolerance: 0.01,
    hint: "x_new = x − η · (∂L/∂x).",
    explanation: "x_new = 4 − (0.1)(6) = 4 − 0.6 = 3.4.",
  },
  {
    id: "m5-debug-divergence",
    moduleId: 5,
    type: "debugging",
    given: "A training loss curve decreases smoothly for 50 steps, then suddenly spikes upward and keeps growing.",
    prompt: "What's the most likely explanation?",
    options: [
      { text: "The learning rate is too large for the current curvature of the loss surface, causing overshoot that compounds each step", correct: true, feedback: "Correct — this is the exact divergence signature from the lesson: smooth progress, then growing overshoot." },
      { text: "The dataset was shuffled incorrectly", correct: false, feedback: "Shuffling issues don't typically produce this specific smooth-then-diverging pattern — a learning-rate/curvature mismatch does." },
      { text: "The model doesn't have enough parameters", correct: false, feedback: "Insufficient capacity usually shows up as loss plateauing too high, not as smooth progress followed by a sudden, growing spike." },
    ],
  },
  {
    id: "m5-decision-lr",
    moduleId: 5,
    type: "decision",
    given: "One direction of your loss surface is very steep, another is very shallow.",
    prompt: "You can only set one shared learning rate. What's the safest choice?",
    options: [
      { text: "A learning rate small enough to be stable for the steep direction, accepting slower progress in the shallow direction", correct: true, feedback: "Correct — this is exactly why adaptive optimizers (Adam, RMSProp) were invented: to avoid this compromise." },
      { text: "A learning rate tuned for the shallow direction, since it needs bigger steps to make progress", correct: false, feedback: "That learning rate would likely be unstable (oscillating or diverging) in the steep direction — stability in the steepest direction has to come first." },
      { text: "It doesn't matter which one you pick — a single shared rate works equally well for both", correct: false, feedback: "This is exactly the problem: a shared rate that's stable for one direction is very often wrong for the other." },
    ],
  },

  // ---------------- Module 6: Probability ----------------
  {
    id: "m6-calc-expectation",
    moduleId: 6,
    type: "calculation",
    given: "A biased coin has true probability p = 0.3 of heads.",
    prompt: "What is the expected value E[X] of a single flip (1 = heads, 0 = tails)?",
    answer: 0.3,
    tolerance: 0.01,
    hint: "For a Bernoulli trial, E[X] = p.",
    explanation: "E[X] = p = 0.3.",
  },
  {
    id: "m6-calc-variance",
    moduleId: 6,
    type: "calculation",
    given: "The same coin, p = 0.3",
    prompt: "What is Var(X) for a single flip?",
    answer: 0.21,
    tolerance: 0.01,
    hint: "Var(X) = p(1-p).",
    explanation: "Var(X) = (0.3)(0.7) = 0.21.",
  },
  {
    id: "m6-debug-gambler",
    moduleId: 6,
    type: "debugging",
    given: "A fair coin has landed heads 5 times in a row. A student says: \"Tails is now more likely on the next flip, to balance things out.\"",
    prompt: "What's wrong with this reasoning?",
    options: [
      { text: "Each flip is independent — the coin has no memory, so the next flip is still exactly 50/50 regardless of the streak", correct: true, feedback: "Correct — this is the gambler's fallacy, a very common and specifically named reasoning error." },
      { text: "Nothing is wrong — the student is applying the law of large numbers correctly", correct: false, feedback: "The law of large numbers describes long-run averages over MANY flips, not a correction on the very next flip — it doesn't imply any single flip 'owes' a different outcome." },
      { text: "Tails is actually less likely now, not more", correct: false, feedback: "Independence means the next flip's probability doesn't change in either direction based on the streak — it stays exactly 50/50." },
    ],
  },

  // ---------------- Module 7: Statistics ----------------
  {
    id: "m7-calc-se",
    moduleId: 7,
    type: "calculation",
    given: "Population standard deviation σ = 8, sample size n = 16",
    prompt: "Compute the standard error of the sample mean.",
    answer: 2,
    tolerance: 0.01,
    hint: "SE = σ / √n.",
    explanation: "SE = 8 / √16 = 8 / 4 = 2.",
  },
  {
    id: "m7-interp-clt",
    moduleId: 7,
    type: "interpretation",
    prompt: "A population's values are heavily right-skewed. What does the Central Limit Theorem predict about the distribution of sample means as n grows?",
    options: [
      { text: "It becomes approximately bell-shaped (normal), regardless of the population's own skewed shape", correct: true, feedback: "Correct — this is the CLT's defining, surprising claim." },
      { text: "It stays exactly as right-skewed as the population, just narrower", correct: false, feedback: "The shape itself changes toward symmetric/normal as n grows — it isn't merely a narrower copy of the original skew." },
      { text: "It becomes uniform (flat)", correct: false, feedback: "Averaging concentrates values near the mean in a bell shape — the opposite of spreading them out uniformly." },
    ],
  },
  {
    id: "m7-decision-samplesize",
    moduleId: 7,
    type: "decision",
    given: "A colleague reports \"our new model is better\" based on a comparison using only 20 test examples.",
    prompt: "What's the most appropriate response?",
    options: [
      { text: "Ask how much the result could plausibly vary from sampling noise alone at that sample size, before trusting the conclusion", correct: true, feedback: "Correct — small samples carry large standard error, exactly this module's core lesson." },
      { text: "Accept the conclusion — a real difference is a real difference regardless of sample size", correct: false, feedback: "A measured difference at a small sample size can easily be explained by ordinary sampling variability, not a genuine effect." },
      { text: "Reject the conclusion outright — small samples are always meaningless", correct: false, feedback: "Small samples aren't meaningless, they're just noisier — the right move is to account for that uncertainty, not dismiss the result entirely." },
    ],
  },

  // ---------------- Module 8: Likelihood ----------------
  {
    id: "m8-calc-mle-mean",
    moduleId: 8,
    type: "calculation",
    given: "Data: 2, 4, 6, 8 (assumed drawn from a Gaussian)",
    prompt: "What is the maximum likelihood estimate for μ?",
    answer: 5,
    tolerance: 0.01,
    hint: "For a Gaussian, the MLE for μ is just the sample mean.",
    explanation: "Sample mean = (2+4+6+8)/4 = 20/4 = 5.",
  },
  {
    id: "m8-interp-mle",
    moduleId: 8,
    type: "interpretation",
    prompt: "What does maximum likelihood estimation actually search for?",
    options: [
      { text: "The parameter values that make the observed data as probable as possible under the assumed model", correct: true, feedback: "Correct — that's the literal definition of MLE." },
      { text: "The parameter values that are most commonly used in similar models", correct: false, feedback: "MLE doesn't reference other models or conventions — it's a direct optimization over probability given THIS specific data." },
      { text: "The simplest possible model that fits the data reasonably well", correct: false, feedback: "That describes a different idea (a simplicity/regularization preference) — MLE only cares about maximizing likelihood, not simplicity." },
    ],
  },
  {
    id: "m8-decision-modelfit",
    moduleId: 8,
    type: "decision",
    given: "Model A gives a log-likelihood of -12.3 on some data. Model B gives -18.7 on the same data.",
    prompt: "Which model fits the data better, by the likelihood criterion?",
    options: [
      { text: "Model A — its log-likelihood is higher (less negative)", correct: true, feedback: "Correct. -12.3 > -18.7, so Model A assigns higher probability to the observed data." },
      { text: "Model B — its log-likelihood is a bigger number in magnitude", correct: false, feedback: "Bigger in magnitude but MORE negative means lower likelihood, not higher — the comparison should be by value, not absolute size." },
      { text: "They fit equally well since both are negative", correct: false, feedback: "Both being negative doesn't make them equal — compare the actual values: -12.3 is greater than -18.7." },
    ],
  },

  // ---------------- Module 9: Information ----------------
  {
    id: "m9-calc-entropy-fair",
    moduleId: 9,
    type: "calculation",
    given: "A fair coin: p = 0.5, 0.5",
    prompt: "Compute H(p) in bits.",
    answer: 1,
    tolerance: 0.02,
    hint: "H(p) = -Σ pᵢ log₂ pᵢ.",
    explanation: "H(p) = -(0.5·log₂0.5 + 0.5·log₂0.5) = -(0.5·(-1) + 0.5·(-1)) = 1 bit.",
  },
  {
    id: "m9-calc-entropy-certain",
    moduleId: 9,
    type: "calculation",
    given: "A distribution: p = 1, 0",
    prompt: "Compute H(p) in bits.",
    answer: 0,
    tolerance: 0.01,
    hint: "A fully predictable outcome has zero average surprise.",
    explanation: "H(p) = -(1·log₂1 + 0·log₂0) = -(1·0 + 0) = 0 bits (using the convention 0·log₂0 = 0).",
  },
  {
    id: "m9-interp-crossentropy",
    moduleId: 9,
    type: "interpretation",
    prompt: "Why is H(p, q) always ≥ H(p), for any predicted distribution q?",
    options: [
      { text: "You can never predict better than the truth's own inherent unpredictability — only match it exactly (when q=p) or do worse", correct: true, feedback: "Correct — this follows from Jensen's inequality, and is exactly why cross-entropy loss has a natural floor at the true entropy." },
      { text: "It isn't always true — H(p,q) can be smaller than H(p) if q is a good enough predictor", correct: false, feedback: "H(p,q) ≥ H(p) is a mathematical guarantee for any q, not something a sufficiently good prediction can break." },
      { text: "H(p,q) and H(p) are unrelated quantities that just happen to look similar", correct: false, feedback: "They're directly related — H(p,q) - H(p) is exactly the KL divergence, a non-negative quantity by construction." },
    ],
  },

  // ---------------- Module 10: Neural networks ----------------
  {
    id: "m10-calc-forward",
    moduleId: 10,
    type: "calculation",
    given: "x1 = 2, x2 = 1, w1 = 0.5, w2 = -0.5, b = 0",
    prompt: "Compute z = w1·x1 + w2·x2 + b.",
    answer: 0.5,
    tolerance: 0.01,
    hint: "Just plug the numbers into the weighted-sum formula.",
    explanation: "z = (0.5)(2) + (-0.5)(1) + 0 = 1 - 0.5 = 0.5.",
  },
  {
    id: "m10-calc-sigmoid-deriv",
    moduleId: 10,
    type: "calculation",
    given: "A neuron's output is a = 0.5",
    prompt: "Compute the sigmoid derivative a(1-a) at that output.",
    answer: 0.25,
    tolerance: 0.01,
    hint: "da/dz = a(1-a).",
    explanation: "a(1-a) = (0.5)(0.5) = 0.25 — this is the sigmoid's derivative's maximum value, reached exactly at a=0.5.",
  },
  {
    id: "m10-debug-signerror",
    moduleId: 10,
    type: "debugging",
    given: "A student implements a weight update as: w_new = w + η · (∂L/∂w).",
    prompt: "What's wrong with this update rule?",
    options: [
      { text: "It should subtract the gradient term, not add it — w_new = w − η·(∂L/∂w) — otherwise it's gradient ASCENT, increasing the loss", correct: true, feedback: "Correct. This exact sign error turns a loss-minimizing update into a loss-maximizing one." },
      { text: "The learning rate η shouldn't be multiplied by the gradient", correct: false, feedback: "Multiplying the gradient by the learning rate is correct — the actual bug is the addition instead of subtraction." },
      { text: "Nothing is wrong — this is the standard gradient descent update", correct: false, feedback: "Standard gradient descent subtracts the scaled gradient (w − η·∂L/∂w); adding it moves the weight in the wrong direction." },
    ],
  },

  // ---------------- Module 11: Attention ----------------
  {
    id: "m11-calc-score",
    moduleId: 11,
    type: "calculation",
    given: "query q = (1, 0), key k = (0.6, 0.8), dimension d = 2",
    prompt: "Compute the scaled attention score, (q · k) / √d.",
    answer: 0.4243,
    tolerance: 0.02,
    hint: "First compute the dot product, then divide by √d.",
    explanation: "q · k = (1)(0.6) + (0)(0.8) = 0.6. Scaled: 0.6 / √2 ≈ 0.4243.",
  },
  {
    id: "m11-interp-weight",
    moduleId: 11,
    type: "interpretation",
    prompt: "In attention, why does a key vector pointing in nearly the same direction as the query receive a high attention weight?",
    options: [
      { text: "Its dot product with the query is large, which softmax converts into a large share of the total probability mass", correct: true, feedback: "Correct — high dot product (alignment) leads directly to high attention weight via the scaled-score-then-softmax pipeline." },
      { text: "Attention always assigns the highest weight to whichever key comes first in the sequence", correct: false, feedback: "Attention weights come strictly from the query-key dot products, not from position in a list." },
      { text: "It's assigned randomly during training and then fixed", correct: false, feedback: "Attention weights are computed fresh for every query via the actual dot-product/softmax formula, not randomly assigned." },
    ],
  },
  {
    id: "m11-decision-scaling",
    moduleId: 11,
    type: "decision",
    given: "You're implementing attention for embeddings with d=512 dimensions instead of the lab's d=2.",
    prompt: "Should you still divide the dot product by √d before softmax?",
    options: [
      { text: "Yes — and it matters MORE at high dimensions, since unscaled dot-product variance grows with d, pushing softmax toward an unstable near-one-hot distribution", correct: true, feedback: "Correct — √d scaling is a real fix for a problem that gets worse, not better, as dimension increases." },
      { text: "No — scaling was only needed for the small 2D teaching example", correct: false, feedback: "The opposite is true: scaling matters more, not less, at realistic (high) dimensions, which is exactly why production transformers use it." },
      { text: "It doesn't matter either way", correct: false, feedback: "Skipping the scaling at high dimensions can make softmax nearly all-or-nothing and gradients vanish — a real, documented training problem." },
    ],
  },
];

export function practiceTasksForModule(moduleId: number): PracticeTask[] {
  return PRACTICE_TASKS.filter((t) => t.moduleId === moduleId);
}
