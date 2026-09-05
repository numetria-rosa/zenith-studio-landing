import type { DetectiveScenario } from "./types";

export const SCENARIOS: DetectiveScenario[] = [
  {
    id: "gradient",
    title: "The Gradient Detective",
    claim: "Increasing the learning rate will always make training faster.",
    claimSource: "- a comment left on a training script's pull request",
    context:
      "A teammate raises the learning rate on a training run because it seemed to help once before. Before merging, you need to figure out exactly what's plausible in their reasoning, and what's dangerously oversimplified.",
    chargeSheet: [
      { id: "g1", label: "A larger learning rate always reduces total training time.", isTrue: false, why: "Past a stability threshold (Module 5's η < 1/3 for the lab's surface), a larger learning rate causes oscillation or divergence - training gets slower or never converges, not faster." },
      { id: "g2", label: "A learning rate that's too large can cause the loss to oscillate or diverge instead of converging faster.", isTrue: true, why: "This is exactly the failure mode Module 5's lab lets you trigger on purpose." },
      { id: "g3", label: "The best learning rate depends on the curvature of the loss surface in each direction.", isTrue: true, why: "Module 5's x-vs-y instability gap (different stable thresholds for different coefficients) demonstrates this directly." },
      { id: "g4", label: "There is one universally correct learning rate that works for every possible problem.", isTrue: false, why: "The stable range depends on the specific loss surface's curvature - there's no single number that's safe everywhere." },
      { id: "g5", label: "A very small learning rate guarantees the fastest possible convergence.", isTrue: false, why: "A very small learning rate is always stable, but it's frequently far slower than a well-chosen larger one - 'small is safe' isn't the same as 'small is fastest.'" },
    ],
    fixOptions: [
      { text: "Increasing the learning rate speeds up training only up to the surface's stability threshold - beyond that point, it causes oscillation or divergence instead of faster convergence.", correct: true, feedback: "Correct - this keeps the true part of the original claim (increasing CAN speed things up) while adding the missing condition that makes it accurate." },
      { text: "Increasing the learning rate always makes training faster, with no exceptions.", correct: false, feedback: "This is the original, unqualified claim - it's exactly what the charge sheet showed is false." },
      { text: "Learning rate has no real effect on how fast training converges.", correct: false, feedback: "This overcorrects - learning rate clearly does affect speed, up to the stability threshold. The problem was the missing qualifier, not the whole idea." },
    ],
  },
  {
    id: "statistics",
    title: "The Statistics Detective",
    claim: "Our model has 99% accuracy, so it's ready to ship.",
    claimSource: "- a Slack message from a stakeholder",
    context:
      "A fraud-detection model reports 99% accuracy on a dataset where only 1% of transactions are actually fraudulent. Before agreeing it's ready, you need to work out exactly what that number does and doesn't tell you.",
    chargeSheet: [
      { id: "s1", label: "If only 1% of cases are the positive class, a model that always predicts 'negative' would also score 99% accuracy.", isTrue: true, why: "This is the class-imbalance trap - a trivial, useless model can match a seemingly impressive accuracy figure." },
      { id: "s2", label: "High accuracy alone guarantees a model is useful for the task.", isTrue: false, why: "Accuracy alone says nothing about whether the model catches the rare, important cases - that's exactly what recall measures instead." },
      { id: "s3", label: "Precision and recall can reveal problems that overall accuracy hides.", isTrue: true, why: "These metrics specifically break down performance on the positive (rare) class, which a single accuracy number averages away." },
      { id: "s4", label: "A baseline (like always predicting the majority class) should be checked before trusting a high accuracy number.", isTrue: true, why: "If the baseline already scores 99%, the model has shown zero real skill despite the impressive-looking number." },
      { id: "s5", label: "99% accuracy always means the model correctly identifies 99% of the rare, important cases.", isTrue: false, why: "Accuracy is computed across ALL cases combined - a model can have high accuracy while missing almost all of the rare positive cases specifically." },
    ],
    fixOptions: [
      { text: "99% accuracy is only meaningful once compared to a baseline and checked with precision/recall - with a 1%-positive class, a trivial model could score just as high.", correct: true, feedback: "Correct - this keeps the real number but adds exactly the missing context needed to interpret it honestly." },
      { text: "99% accuracy means the model is definitely ready to ship.", correct: false, feedback: "This is the original claim - precisely what the charge sheet showed can be misleading with class imbalance." },
      { text: "Accuracy is a useless metric and should never be reported.", correct: false, feedback: "This overcorrects - accuracy is fine to report, it just needs a baseline and complementary metrics (precision/recall) alongside it, not to be discarded." },
    ],
  },
  {
    id: "probability",
    title: "The Probability Detective",
    claim: "This medical test is 99% accurate, so if you test positive, there's a 99% chance you have the disease.",
    claimSource: "- an AI assistant's explanation, given to a worried patient",
    context:
      "An AI chatbot is explaining a positive test result using the test's stated accuracy. The disease it's testing for affects roughly 1 in 1,000 people. Before trusting this explanation, check whether it's actually applying probability correctly.",
    chargeSheet: [
      { id: "p1", label: "The test's accuracy (99%) is not automatically the same number as the probability you have the disease given a positive result.", isTrue: true, why: "These are two different conditional probabilities - P(positive | disease) versus P(disease | positive) - and confusing them is a classic, well-documented reasoning error." },
      { id: "p2", label: "If the disease is rare, most positive results can still be false positives, even with a 99% accurate test.", isTrue: true, why: "With a 1-in-1,000 base rate, the much larger pool of healthy people means even a 1% false-positive rate produces many more false positives than true positives." },
      { id: "p3", label: "P(disease | positive test) always equals the test's stated accuracy.", isTrue: false, why: "This is exactly the AI's mistake - it treats the test's own accuracy as if it were the answer to a different question." },
      { id: "p4", label: "Bayes' theorem is needed to correctly compute P(disease | positive test) from the test's accuracy and the disease's base rate.", isTrue: true, why: "Bayes' theorem is specifically the tool for converting one conditional probability into its reverse, using the base rate." },
      { id: "p5", label: "The base rate (how common the disease is) is irrelevant to interpreting a positive test result.", isTrue: false, why: "The base rate is exactly what makes rare diseases produce so many false positives relative to true positives - it's central, not irrelevant." },
    ],
    fixOptions: [
      { text: "Given a positive result, the actual probability of having the disease depends on both the test's accuracy AND how rare the disease is, combined via Bayes' theorem - it is not simply equal to the test's accuracy.", correct: true, feedback: "Correct - this names the real dependency (accuracy AND base rate, via Bayes' theorem) that the original claim skipped entirely." },
      { text: "If you test positive, you definitely have the disease.", correct: false, feedback: "This is even more overconfident than the original AI explanation - definitely not supported." },
      { text: "Test accuracy is meaningless and tells you nothing about a positive result.", correct: false, feedback: "This overcorrects - accuracy is one of the two real inputs needed (along with the base rate) to correctly compute the answer via Bayes' theorem." },
    ],
  },
  {
    id: "embedding",
    title: "The Embedding Detective",
    claim: "Document B's embedding has a higher raw dot product with the query than Document A's, so Document B must be more relevant.",
    claimSource: "- a code comment in a search-ranking pull request",
    context:
      "An engineer ranks search results by raw dot product between the query embedding and each document embedding, without normalizing. Before approving this, you need to check whether that ranking actually measures relevance.",
    chargeSheet: [
      { id: "e1", label: "A higher raw dot product always means a more semantically relevant document.", isTrue: false, why: "Dot product is sensitive to magnitude - a document with a larger-magnitude embedding can score higher purely for being 'bigger,' not more relevant." },
      { id: "e2", label: "Cosine similarity removes the effect of embedding magnitude, leaving only direction.", isTrue: true, why: "Dividing by both magnitudes is specifically what makes cosine similarity a direction-only comparison, immune to this bias." },
      { id: "e3", label: "Two embeddings pointing in the exact same direction always have the same dot product, regardless of their length.", isTrue: false, why: "Dot product scales directly with magnitude even when direction is unchanged - a longer version of the same-direction vector produces a larger dot product." },
      { id: "e4", label: "If every document embedding happened to have exactly the same magnitude, ranking by raw dot product would give the same order as ranking by cosine similarity.", isTrue: true, why: "When magnitude is constant across all documents, cosine similarity is just dot product divided by the same constant every time - dividing by a shared constant never changes the relative ranking." },
      { id: "e5", label: "Real embedding models always guarantee constant magnitude, so this issue never actually happens in practice.", isTrue: false, why: "Most embedding models make no such guarantee - embedding norms commonly vary by document length and content, which is exactly why this bug shows up for real." },
    ],
    fixOptions: [
      { text: "Document B might simply have a larger-magnitude embedding, not a more relevant one - cosine similarity, not raw dot product, should be used when embeddings can have different magnitudes.", correct: true, feedback: "Correct - this identifies the real risk (magnitude bias) and names the standard fix (cosine similarity)." },
      { text: "Document B is definitely more relevant, since its dot product is higher.", correct: false, feedback: "This is the original, unqualified claim - exactly what the charge sheet showed can be misleading." },
      { text: "Dot product should never be used anywhere in a retrieval system.", correct: false, feedback: "This overcorrects - dot product is the core computation inside cosine similarity too; the fix is normalizing it, not discarding it entirely." },
    ],
  },
  {
    id: "pca",
    title: "The Dimensionality Detective",
    claim: "PC1 explains 95% of the variance, so we can safely drop everything else with no real loss.",
    claimSource: "- a data science team's slide deck, justifying a feature-compression decision",
    context:
      "A team wants to compress a fraud-detection dataset down to just its first principal component before training a model. Before signing off, you need to check what \"95% variance explained\" actually promises.",
    chargeSheet: [
      { id: "pc1", label: "95% variance explained means 95% of the information relevant to the actual task is preserved.", isTrue: false, why: "Variance explained is a statement about total spread only - it says nothing about which specific direction a downstream task (like catching fraud) actually needs." },
      { id: "pc2", label: "A direction with very small variance could still carry an important, rare signal.", isTrue: true, why: "This is exactly the fraud-detection failure mode from Module 3: a rare, critical signal can live entirely in a low-variance direction PCA would drop." },
      { id: "pc3", label: "Rotating the data before running PCA changes the actual amount of variance along its principal directions.", isTrue: false, why: "Rotation is a rigid transformation - it changes which raw axes the eigenvectors point along, but not the eigenvalues (the actual variance amounts) themselves." },
      { id: "pc4", label: "The eigenvalues of the covariance matrix directly give the amount of variance along each principal direction.", isTrue: true, why: "This is the direct definition used throughout Module 3 - each eigenvalue is literally the variance along its corresponding eigenvector." },
      { id: "pc5", label: "PCA can identify which of the discarded directions are pure noise versus real signal.", isTrue: false, why: "PCA only ranks directions by variance - it has no concept of 'noise' versus 'signal relevant to my task,' that judgment requires domain knowledge PCA doesn't have." },
    ],
    fixOptions: [
      { text: "High variance explained means most of the data's total spread is captured, not that all task-relevant information is preserved - a low-variance direction can still carry a rare, critical signal that a pure variance ranking would discard.", correct: true, feedback: "Correct - this keeps the real number (95%) while adding exactly the missing distinction between 'variance' and 'task-relevant information.'" },
      { text: "95% variance explained means it's always completely safe to drop the rest.", correct: false, feedback: "This is the original claim - exactly what the fraud-detection failure mode shows can go wrong." },
      { text: "PCA should never be used for dimensionality reduction under any circumstances.", correct: false, feedback: "This overcorrects - PCA is a legitimate, widely-used technique; the issue is checking what a discarded direction might represent, not avoiding PCA entirely." },
    ],
  },
  {
    id: "information",
    title: "The Cross-Entropy Detective",
    claim: "Model A and Model B both scored 90% accuracy on the test set, so they're equally good models.",
    claimSource: "- a model comparison report shared before a deployment decision",
    context:
      "Two classifiers tied on accuracy, but one tends to be confidently wrong on its mistakes while the other is only mildly wrong. Before treating them as equivalent, you need to check what accuracy alone actually captures.",
    chargeSheet: [
      { id: "i1", label: "Two models with identical accuracy can have very different cross-entropy losses.", isTrue: true, why: "Cross-entropy also scores confidence, not just whether the top prediction was correct - two equally-accurate models can differ sharply here." },
      { id: "i2", label: "A model that's confidently wrong is penalized the same amount as a model that's only mildly wrong, under cross-entropy.", isTrue: false, why: "Cross-entropy's logarithm specifically punishes confident wrong predictions far more heavily than mildly unsure ones - this is Module 9's central point." },
      { id: "i3", label: "Accuracy alone captures whether a model's predicted probabilities are well-calibrated.", isTrue: false, why: "Accuracy only checks whether the top guess was correct - it says nothing about whether the STATED confidence behind that guess was honest." },
      { id: "i4", label: "Cross-entropy loss can differ significantly between two models even when their accuracy is identical, because it also scores confidence, not just the top guess.", isTrue: true, why: "This is exactly why cross-entropy, not accuracy, is usually the more honest signal for comparing how well-calibrated two models are." },
      { id: "i5", label: "A model with lower cross-entropy will always also have higher accuracy.", isTrue: false, why: "These are related but distinct metrics measuring different things - it's possible for them to disagree, since cross-entropy also weighs calibration, not just top-choice correctness." },
    ],
    fixOptions: [
      { text: "Identical accuracy doesn't mean identical quality - cross-entropy also scores how well-calibrated each model's confidence is, and one could be far more confidently wrong on its mistakes than the other.", correct: true, feedback: "Correct - this names the real, separate dimension (calibration, via cross-entropy) that identical accuracy hides." },
      { text: "Since both scored 90% accuracy, their cross-entropy losses must also be identical.", correct: false, feedback: "This assumes a link between the two metrics that doesn't actually hold - accuracy and cross-entropy can diverge for models with the same top-choice correctness." },
      { text: "Accuracy is a completely useless metric and should never be reported.", correct: false, feedback: "This overcorrects - accuracy is a fine, simple summary; the issue is treating it as the WHOLE picture rather than pairing it with cross-entropy." },
    ],
  },
  {
    id: "attention",
    title: "The Attention Detective",
    claim: "The model attended most strongly to the word 'excellent,' so that's definitely the exact reason it classified this review as positive.",
    claimSource: "- an interpretability report attached to a sentiment-classification model",
    context:
      "A report explains a model's decision by pointing to its single highest attention weight. Before accepting that as a complete explanation, you need to check what an attention weight actually is and isn't.",
    chargeSheet: [
      { id: "a1", label: "A high attention weight between two tokens definitely means the model captured a human-intuitive semantic reason for their relationship.", isTrue: false, why: "A high weight means the learned query/key vectors aligned well under a dot product - a real, computed similarity in a learned space, not a guarantee of matching human logic." },
      { id: "a2", label: "Attention weights come from a dot product between learned query and key vectors, scaled and normalized by softmax.", isTrue: true, why: "This is the exact pipeline Module 11 builds up: dot product, scale by 1/√d, then softmax." },
      { id: "a3", label: "A real model has many layers and attention heads, so one single attention weight rarely tells the whole story of a decision.", isTrue: true, why: "Multi-head, multi-layer attention means many separate computations contribute to a final decision - one highlighted weight is a small piece of a much larger computation." },
      { id: "a4", label: "Because attention weights are computed mathematically, they are automatically a complete and transparent explanation of a model's reasoning.", isTrue: false, why: "Being a real, precisely-computed number doesn't make something an automatically complete explanation - the same is true of any single number pulled from a large computation." },
      { id: "a5", label: "The 1/√d scaling factor exists to keep softmax numerically well-behaved as dimension grows, not to make attention more human-interpretable.", isTrue: true, why: "This is Module 11's Full Derivation point exactly: the scaling compensates for variance growth, an engineering fix, not an interpretability feature." },
    ],
    fixOptions: [
      { text: "A high attention weight on 'excellent' is a real, computed signal that the model's learned vectors aligned there, but it isn't automatically a complete, human-legible explanation of the whole decision, especially across multiple layers and heads.", correct: true, feedback: "Correct - this keeps the real observation (the weight is genuine) while correcting the overclaim (that it fully explains the decision)." },
      { text: "The single highest attention weight is always the complete and correct explanation for a model's decision.", correct: false, feedback: "This is the original claim - exactly the overreach the charge sheet identified." },
      { text: "Attention weights are meaningless and reveal nothing about a model's computation.", correct: false, feedback: "This overcorrects - attention weights are a real, precisely-defined quantity; the issue is treating one of them as a complete explanation, not that they carry no information at all." },
    ],
  },
];
