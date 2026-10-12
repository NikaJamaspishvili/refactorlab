export type DIFFICULTY = "ALL" | "HARD" | "NORMAL" | "EASY";
export type title = string;
export type PROBLEM_STATUS = "ALL" | "SOLVED" | "IN_PROGRESS";

export interface SubmissionsFilters {
  DIFFICULTY: DIFFICULTY;
  TITLE: title;
  PROBLEM_STATUS: PROBLEM_STATUS;
}

export type SubmissionItem = {
  count: number;
  score: number;
  description: string;
  difficulty: "EASY" | "NORMAL" | "HARD";
  title: string;
};
