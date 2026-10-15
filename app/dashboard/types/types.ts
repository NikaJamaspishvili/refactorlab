export type DIFFICULTY = "ALL" | "HARD" | "NORMAL" | "EASY";
export type title = string;
export type PROBLEM_STATUS = "ALL" | "SOLVED" | "IN_PROGRESS" | "FIRST_VIEW";

export interface AllExercisesFilter {
  DIFFICULTY: DIFFICULTY;
  TITLE: title;
  PROBLEM_STATUS: PROBLEM_STATUS;
}

export type AllExercisesItem = {
  count?: number | null;
  score?: number | null;
  description: string;
  difficulty: string;
  title: string;
  exerciseId: number;
};

export type informationType = ["HARD", "NORMAL", "EASY"];
export type graphType =
  "HIGHEST_SCORE" | "MOST_PROBLEMS_SOLVED" | "MOST_PROBLEMS_TACKLED";
