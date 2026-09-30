import { db } from "@/lib/db";
import { getAllModules, getCourseIndex } from "./content";
import { modulesComplete } from "./career";
import { courseProgress, getAllProjectProgress, getCompletedLessons, getPassedQuizzes, getQuizStats, type ProjectProgress, type QuizStat } from "./progress";
import type { CourseIndex, ModuleContent } from "./types";

export type CourseState = {
  index: CourseIndex;
  modules: ModuleContent[];
  done: Set<string>;
  passedQuizzes: Set<number>;
  quizStats: Map<string, QuizStat>;
  projects: Map<number, ProjectProgress>;
  exercisesDone: Set<number>;
  progress: { total: number; complete: number; percent: number };
  modulesComplete: number;
  /** Stage colour by module number, from course.json. */
  stageColor: Map<number, string>;
};

/** Everything the dashboard-style pages need about one student's progress, in one round of queries. */
export async function loadCourseState(userId: string): Promise<CourseState> {
  const [index, modules, done, passedQuizzes, quizStats, projects, exercises] = await Promise.all([
    getCourseIndex(),
    getAllModules(),
    getCompletedLessons(userId),
    getPassedQuizzes(userId),
    getQuizStats(userId),
    getAllProjectProgress(userId),
    db.aieExerciseProgress.findMany({ where: { userId }, select: { module: true, passed: true, total: true } }),
  ]);
  return {
    index, modules, done, passedQuizzes, quizStats, projects,
    exercisesDone: new Set(exercises.filter((e) => e.total > 0 && e.passed === e.total).map((e) => e.module)),
    progress: courseProgress(modules, done),
    modulesComplete: modulesComplete(modules, done, passedQuizzes),
    stageColor: new Map(index.stages.flatMap((s) => s.modules.map((m) => [m.number, s.color] as const))),
  };
}
