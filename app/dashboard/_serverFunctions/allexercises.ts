"use server";

import { db } from "@/src/prisma/db";
import { AllExercisesFilter, AllExercisesItem } from "../types/types";
import { addDifficultyWhere, addTitleWhere } from "../helpers";
function normalise(rows: AllExercisesItem[]) {
  return rows.map((result) => ({
    count: result.count,
    score: result.score,
    description: result.description,
    difficulty: result.difficulty,
    title: result.title,
    exerciseId: result.exerciseId,
  }));
}

export const FetchAllExercisesData = async (
  filters: AllExercisesFilter,
  userId?: string,
) => {
  console.debug("FILTERS: ", filters);
  console.debug("USERID: ", userId);

  if (
    (filters.PROBLEM_STATUS === "IN_PROGRESS" ||
      filters.PROBLEM_STATUS === "SOLVED") &&
    userId
  ) {
    let plan = db.sql.public.Submissions.innerJoin(
      db.sql.public.Exercises,
      (f, fns) => fns.eq(f.Submissions.exerciseId, f.Exercises.id),
    )
      .select(
        "exerciseId",
        "score",
        "count",
        "title",
        "difficulty",
        "description",
      )
      .where((f, fns) =>
        fns.and(
          fns.eq(f.Submissions.userId, userId),
          ...(filters.PROBLEM_STATUS === "IN_PROGRESS"
            ? [fns.lt(f.Submissions.score, 100)]
            : filters.PROBLEM_STATUS === "SOLVED"
              ? [fns.eq(f.Submissions.score, 100)]
              : []),
        ),
      );

    plan = addDifficultyWhere(plan, filters);
    plan = addTitleWhere(plan, filters);

    const rows = await db.runtime().query(plan.build());

    return normalise(rows);
  } else if (filters.PROBLEM_STATUS === "FIRST_VIEW" && userId) {
    let plan = db.sql.public.Exercises.select(
      "title",
      "description",
      "difficulty",
    )
      .select("exerciseId", (f) => f.id)
      .where((f, fns) =>
        fns.notExists(
          db.sql.public.Submissions.select("exerciseId").where(
            (inner, innerFns) =>
              innerFns.and(
                innerFns.eq(inner.Submissions.userId, userId),
                innerFns.eq(inner.Submissions.exerciseId, f.Exercises.id),
              ),
          ),
        ),
      );

    plan = addDifficultyWhere(plan, filters);
    plan = addTitleWhere(plan, filters);

    const rows = await db.runtime().query(plan.build());

    return normalise(rows);
  } else if (filters.PROBLEM_STATUS === "ALL") {
    let plan = db.sql.public.Exercises.outerLeftJoin(
      db.sql.public.Submissions,
      (f, fns) => fns.eq(f.Exercises.id, f.Submissions.exerciseId),
    )
      .select("exerciseId", (f) => f.id)
      .select("title", "description", "difficulty", "score", "count");

    plan = addDifficultyWhere(plan, filters);
    plan = addTitleWhere(plan, filters);

    const rows = await db.runtime().query(plan.build());

    return normalise(rows);
  }

  throw new Error("Filters Doesn't match any branch logic.");
};
