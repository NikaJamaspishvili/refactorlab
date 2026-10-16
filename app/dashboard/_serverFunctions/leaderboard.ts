"use server";
import { db } from "@/src/prisma/db";
import { graphType as sectionType, informationType } from "../types/types";

type MetricKey = "solvedCount" | "tackledCount" | "scoreSum";

const baseLeaderboardQuery = () =>
  db.sql.public.Submissions.innerJoin(db.sql.public.Account, (f, fns) =>
    fns.eq(f.Submissions.userId, f.Account.id),
  ).innerJoin(db.sql.public.Exercises, (f, fns) =>
    fns.eq(f.Submissions.exerciseId, f.Exercises.id),
  );

const runLeaderboardQuery = async ({
  difficulty,
  metricKey,
  metricSelect,
  scoreCondition,
  filterByUserId,
}: {
  difficulty: string;
  metricKey: MetricKey;
  metricSelect: (f: any, fns: any) => any;
  scoreCondition: (f: any, fns: any) => any;
  filterByUserId?: string;
}) => {
  let plan = baseLeaderboardQuery()
    .select("userId", (f) => f.Submissions.userId)
    .select("username", (f) => f.Account.username)
    .select(metricKey, metricSelect)
    .where((f, fns) =>
      fns.and(
        fns.eq(f.Exercises.difficulty, difficulty),
        scoreCondition(f, fns),
      ),
    );

  if (filterByUserId) {
    const selectPlan = plan.where((f, fns) =>
      fns.eq(f.Account.id, filterByUserId),
    );
    return db.runtime().query(selectPlan.build());
  } else {
    const groupPlan = plan
      .groupBy("userId")
      .groupBy("username")
      .orderBy(metricKey, { direction: "desc" })
      .limit(10);
    return db.runtime().query(groupPlan.build());
  }
};

const findMostProblemsSolved = (difficulty: string, filterByUserId?: string) =>
  runLeaderboardQuery({
    difficulty,
    metricKey: "solvedCount",
    metricSelect: (f, fns) => fns.count(f.Submissions.exerciseId),
    scoreCondition: (f, fns) => fns.eq(f.Submissions.score, 100),
    filterByUserId,
  });

const findMostProblemsTackled = (difficulty: string, filterByUserId?: string) =>
  runLeaderboardQuery({
    difficulty,
    metricKey: "tackledCount",
    metricSelect: (f, fns) => fns.count(f.Submissions.exerciseId),
    scoreCondition: (f, fns) => fns.lt(f.Submissions.score, 100),
    filterByUserId,
  });

const findHighestSumScore = (difficulty: string, filterByUserId?: string) =>
  runLeaderboardQuery({
    difficulty,
    metricKey: "scoreSum",
    metricSelect: (f, fns) => fns.sum(f.Submissions.score),
    scoreCondition: (f, fns) => fns.lt(f.Submissions.score, 100),
    filterByUserId,
  });

export const fetchLeaderboardInfo = async (
  section: sectionType,
  informationType: informationType,
  filterByUserId?: string,
) => {
  let finder: (difficulty: string, filterByUserId?: string) => Promise<any>;

  if (section === "MOST_PROBLEMS_SOLVED") {
    finder = findMostProblemsSolved;
  } else if (section === "HIGHEST_SCORE") {
    finder = findHighestSumScore;
  } else {
    finder = findMostProblemsTackled;
  }

  const response = await Promise.all(
    informationType.map(async (difficulty) => ({
      difficulty,
      data: await finder(difficulty, filterByUserId),
    })),
  );

  return { SECTION: section, response };
};
