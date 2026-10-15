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
}: {
  difficulty: string;
  metricKey: MetricKey;
  metricSelect: (f: any, fns: any) => any;
  scoreCondition: (f: any, fns: any) => any;
}) => {
  const plan = baseLeaderboardQuery()
    .select("userId", (f) => f.Submissions.userId)
    .select("username", (f) => f.Account.username)
    .select(metricKey, metricSelect)
    .where((f, fns) =>
      fns.and(
        fns.eq(f.Exercises.difficulty, difficulty),
        scoreCondition(f, fns),
      ),
    )
    .groupBy("userId")
    .groupBy("username")
    .orderBy(metricKey, { direction: "desc" })
    .limit(10)
    .build();

  return db.runtime().query(plan);
};

const findMostProblemsSolved = (difficulty: string) =>
  runLeaderboardQuery({
    difficulty,
    metricKey: "solvedCount",
    metricSelect: (f, fns) => fns.count(f.Submissions.exerciseId),
    scoreCondition: (f, fns) => fns.eq(f.Submissions.score, 100),
  });

const findMostProblemsTackled = (difficulty: string) =>
  runLeaderboardQuery({
    difficulty,
    metricKey: "tackledCount",
    metricSelect: (f, fns) => fns.count(f.Submissions.exerciseId),
    scoreCondition: (f, fns) => fns.lt(f.Submissions.score, 100),
  });

const findHighestSumScore = (difficulty: string) =>
  runLeaderboardQuery({
    difficulty,
    metricKey: "scoreSum",
    metricSelect: (f, fns) => fns.sum(f.Submissions.score),
    scoreCondition: (f, fns) => fns.lt(f.Submissions.score, 100),
  });

export const fetchLeaderboardInfo = async (
  section: sectionType,
  informationType: informationType,
) => {
  let finder: (difficulty: string) => Promise<any>;

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
      data: await finder(difficulty),
    })),
  );

  return { SECTION: section, response };
};
