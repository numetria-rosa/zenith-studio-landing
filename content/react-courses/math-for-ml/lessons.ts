/* Ordered lesson manifest for the "react"-render-mode Mathematics for Machine
   Learning course (see src/lib/courses.ts's lessonManifest field). Drives
   routing (/lab/math-for-ml/learn/[slug]), the sidebar's active-state, and
   next/prev links. Only Module 1 is real content - extended as later
   modules are actually written, not pre-populated with placeholders. */

export type Lesson = {
  id: number;
  slug: string;
  title: string;
  /** .mdx filename inside content/react-courses/math-for-ml/lessons/ */
  file: string;
};

export const LESSONS: Lesson[] = [
  { id: 0, slug: "orientation", title: "Orientation", file: "00-orientation.mdx" },
  { id: 50, slug: "foundation-a-algebra", title: "Foundation A: Algebra for ML", file: "foundation-a-algebra.mdx" },
  { id: 51, slug: "foundation-b-graphs", title: "Foundation B: Graphs and Functions", file: "foundation-b-graphs.mdx" },
  { id: 52, slug: "foundation-c-notation", title: "Foundation C: Mathematical Notation", file: "foundation-c-notation.mdx" },
  { id: 1, slug: "01-vectors", title: "Thinking in Vectors", file: "01-vectors.mdx" },
  { id: 2, slug: "02-matrices", title: "Transforming Data", file: "02-matrices.mdx" },
  { id: 3, slug: "03-pca", title: "Finding the Important Directions", file: "03-pca.mdx" },
  { id: 4, slug: "04-calculus", title: "Mathematics of Change", file: "04-calculus.mdx" },
  { id: 5, slug: "05-optimization", title: "How Models Learn", file: "05-optimization.mdx" },
  { id: 6, slug: "06-probability", title: "Reasoning Under Uncertainty", file: "06-probability.mdx" },
  { id: 7, slug: "07-statistics", title: "Learning From Data", file: "07-statistics.mdx" },
  { id: 8, slug: "08-likelihood", title: "Probability Meets Machine Learning", file: "08-likelihood.mdx" },
  { id: 9, slug: "09-information", title: "Information and Loss", file: "09-information.mdx" },
  { id: 10, slug: "10-neural-networks", title: "The Mathematics of a Neural Network", file: "10-neural-networks.mdx" },
  { id: 11, slug: "11-attention", title: "The Math Behind Attention", file: "11-attention.mdx" },
  { id: 60, slug: "math-detective", title: "Math Detective", file: "math-detective.mdx" },
  { id: 100, slug: "cheatsheet", title: "Cheat Sheet", file: "cheatsheet.mdx" },
  { id: 200, slug: "project-similarity-engine", title: "Project: Similarity Engine", file: "project-01-similarity.mdx" },
  { id: 201, slug: "project-pca-explorer", title: "Project: PCA Explorer", file: "project-02-pca.mdx" },
  { id: 202, slug: "project-gradient-descent", title: "Project: Gradient Descent From Scratch", file: "project-03-gradient-descent.mdx" },
  { id: 203, slug: "project-probability-simulator", title: "Project: Probability Simulator", file: "project-04-probability.mdx" },
  { id: 204, slug: "project-neural-network", title: "Project: Neural Network From Scratch", file: "project-05-neural-network.mdx" },
  { id: 205, slug: "capstone", title: "Capstone: Build the Mathematics Behind a Machine Learning System", file: "capstone.mdx" },
];

export function getLessonBySlug(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

export function getLessonById(id: number): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function firstLesson(): Lesson {
  return LESSONS[0];
}

export function nextLesson(currentId: number): Lesson | undefined {
  return LESSONS.find((l) => l.id === currentId + 1);
}

export function prevLesson(currentId: number): Lesson | undefined {
  return LESSONS.find((l) => l.id === currentId - 1);
}
