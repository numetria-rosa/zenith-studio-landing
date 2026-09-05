import type { DetectiveScenario } from "./types";

export const SCENARIOS: DetectiveScenario[] = [
  {
    id: "gradient",
    title: "The Gradient Detective",
    claim: "Increasing the learning rate will always make training faster.",
    claimSource: "— a comment left on a training script's pull request",
    context:
      "A teammate raises the learning rate on a training run because it seemed to help once before. Before merging, you need to figure out exactly what's plausible in their reasoning, and what's dangerously oversimplified.",
    chargeSheet: [
      { id: "g1", label: "A larger learning rate always reduces total training time.", isTrue: false, why: "Past a stability threshold (Module 5's η < 1/3 for the lab's surface), a larger learning rate causes oscillation or divergence — training gets slower or never converges, not faster." },
      { id: "g2", label: "A learning rate that's too large can cause the loss to oscillate or diverge instead of converging faster.", isTrue: true, why: "This is exactly the failure mode Module 5's lab lets you trigger on purpose." },
      { id: "g3", label: "The best learning rate depends on the curvature of the loss surface in each direction.", isTrue: true, why: "Module 5's x-vs-y instability gap (different stable thresholds for different coefficients) demonstrates this directly." },
      { id: "g4", label: "There is one universally correct learning rate that works for every possible problem.", isTrue: false, why: "The stable range depends on the specific loss surface's curvature — there's no single number that's safe everywhere." },
      { id: "g5", label: "A very small learning rate guarantees the fastest possible convergence.", isTrue: false, why: "A very small learning rate is always stable, but it's frequently far slower than a well-chosen larger one — 'small is safe' isn't the same as 'small is fastest.'" },
    ],
    fixOptions: [
      { text: "Increasing the learning rate speeds up training only up to the surface's stability threshold — beyond that point, it causes oscillation or divergence instead of faster convergence.", correct: true, feedback: "Correct — this keeps the true part of the original claim (increasing CAN speed things up) while adding the missing condition that makes it accurate." },
      { text: "Increasing the learning rate always makes training faster, with no exceptions.", correct: false, feedback: "This is the original, unqualified claim — it's exactly what the charge sheet showed is false." },
      { text: "Learning rate has no real effect on how fast training converges.", correct: false, feedback: "This overcorrects — learning rate clearly does affect speed, up to the stability threshold. The problem was the missing qualifier, not the whole idea." },
    ],
  },
  {
    id: "statistics",
    title: "The Statistics Detective",
    claim: "Our model has 99% accuracy, so it's ready to ship.",
    claimSource: "— a Slack message from a stakeholder",
    context:
      "A fraud-detection model reports 99% accuracy on a dataset where only 1% of transactions are actually fraudulent. Before agreeing it's ready, you need to work out exactly what that number does and doesn't tell you.",
    chargeSheet: [
      { id: "s1", label: "If only 1% of cases are the positive class, a model that always predicts 'negative' would also score 99% accuracy.", isTrue: true, why: "This is the class-imbalance trap — a trivial, useless model can match a seemingly impressive accuracy figure." },
      { id: "s2", label: "High accuracy alone guarantees a model is useful for the task.", isTrue: false, why: "Accuracy alone says nothing about whether the model catches the rare, important cases — that's exactly what recall measures instead." },
      { id: "s3", label: "Precision and recall can reveal problems that overall accuracy hides.", isTrue: true, why: "These metrics specifically break down performance on the positive (rare) class, which a single accuracy number averages away." },
      { id: "s4", label: "A baseline (like always predicting the majority class) should be checked before trusting a high accuracy number.", isTrue: true, why: "If the baseline already scores 99%, the model has shown zero real skill despite the impressive-looking number." },
      { id: "s5", label: "99% accuracy always means the model correctly identifies 99% of the rare, important cases.", isTrue: false, why: "Accuracy is computed across ALL cases combined — a model can have high accuracy while missing almost all of the rare positive cases specifically." },
    ],
    fixOptions: [
      { text: "99% accuracy is only meaningful once compared to a baseline and checked with precision/recall — with a 1%-positive class, a trivial model could score just as high.", correct: true, feedback: "Correct — this keeps the real number but adds exactly the missing context needed to interpret it honestly." },
      { text: "99% accuracy means the model is definitely ready to ship.", correct: false, feedback: "This is the original claim — precisely what the charge sheet showed can be misleading with class imbalance." },
      { text: "Accuracy is a useless metric and should never be reported.", correct: false, feedback: "This overcorrects — accuracy is fine to report, it just needs a baseline and complementary metrics (precision/recall) alongside it, not to be discarded." },
    ],
  },
  {
    id: "probability",
    title: "The Probability Detective",
    claim: "This medical test is 99% accurate, so if you test positive, there's a 99% chance you have the disease.",
    claimSource: "— an AI assistant's explanation, given to a worried patient",
    context:
      "An AI chatbot is explaining a positive test result using the test's stated accuracy. The disease it's testing for affects roughly 1 in 1,000 people. Before trusting this explanation, check whether it's actually applying probability correctly.",
    chargeSheet: [
      { id: "p1", label: "The test's accuracy (99%) is not automatically the same number as the probability you have the disease given a positive result.", isTrue: true, why: "These are two different conditional probabilities — P(positive | disease) versus P(disease | positive) — and confusing them is a classic, well-documented reasoning error." },
      { id: "p2", label: "If the disease is rare, most positive results can still be false positives, even with a 99% accurate test.", isTrue: true, why: "With a 1-in-1,000 base rate, the much larger pool of healthy people means even a 1% false-positive rate produces many more false positives than true positives." },
      { id: "p3", label: "P(disease | positive test) always equals the test's stated accuracy.", isTrue: false, why: "This is exactly the AI's mistake — it treats the test's own accuracy as if it were the answer to a different question." },
      { id: "p4", label: "Bayes' theorem is needed to correctly compute P(disease | positive test) from the test's accuracy and the disease's base rate.", isTrue: true, why: "Bayes' theorem is specifically the tool for converting one conditional probability into its reverse, using the base rate." },
      { id: "p5", label: "The base rate (how common the disease is) is irrelevant to interpreting a positive test result.", isTrue: false, why: "The base rate is exactly what makes rare diseases produce so many false positives relative to true positives — it's central, not irrelevant." },
    ],
    fixOptions: [
      { text: "Given a positive result, the actual probability of having the disease depends on both the test's accuracy AND how rare the disease is, combined via Bayes' theorem — it is not simply equal to the test's accuracy.", correct: true, feedback: "Correct — this names the real dependency (accuracy AND base rate, via Bayes' theorem) that the original claim skipped entirely." },
      { text: "If you test positive, you definitely have the disease.", correct: false, feedback: "This is even more overconfident than the original AI explanation — definitely not supported." },
      { text: "Test accuracy is meaningless and tells you nothing about a positive result.", correct: false, feedback: "This overcorrects — accuracy is one of the two real inputs needed (along with the base rate) to correctly compute the answer via Bayes' theorem." },
    ],
  },
];
