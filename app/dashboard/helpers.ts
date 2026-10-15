import { AllExercisesFilter } from "./types/types";

export const addDifficultyWhere = (plan: any, filters: AllExercisesFilter) => {
  if (filters.DIFFICULTY === "ALL") return plan;

  return plan.where((f: any, fns: any) =>
    fns.eq(f.Exercises.difficulty, filters.DIFFICULTY),
  );
};

export const addTitleWhere = (plan: any, filters: AllExercisesFilter) => {
  if (filters.TITLE.length === 0) return plan;

  return plan.where((f: any, fns: any) =>
    fns.ilike(f.Exercises.title, `%${filters.TITLE}%`),
  );
};
