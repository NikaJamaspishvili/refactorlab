import { graphType, informationType } from "./dashboard/types/types";

export const dashboardSections: graphType[] = [
  "HIGHEST_SCORE",
  "MOST_PROBLEMS_SOLVED",
  "MOST_PROBLEMS_TACKLED",
];

export const dashboardSectionsMapping = {
  HIGHEST_SCORE: "HIGHEST SCORE",
  MOST_PROBLEMS_SOLVED: "MOST PROBLEMS SOLVED",
  MOST_PROBLEMS_TACKLED: "MOST PROBLEMS TACKLED",
};

export const difficulties: informationType = ["HARD", "NORMAL", "EASY"];
