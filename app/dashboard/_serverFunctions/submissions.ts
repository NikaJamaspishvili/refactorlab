"use server";

import { db } from "@/src/prisma/db";
import { SubmissionsFilters } from "../types/submissions";

export const FetchSubmissionsData = async (
  filters: SubmissionsFilters,
  userId: string,
) => {
  const plan = db.sql.public.Submissions.innerJoin(
    db.sql.public.Exercises,
    (f, fns) => fns.eq(f.Submissions.exerciseId, f.Exercises.id),
  )
    .select("userId", "score", "count", "title", "difficulty", "description")
    .where((f, fns) =>
      fns.and(
        fns.eq(f.Submissions.userId, userId),

        ...(filters.DIFFICULTY !== "ALL"
          ? [fns.eq(f.Exercises.difficulty, filters.DIFFICULTY)]
          : []),

        ...(filters.PROBLEM_STATUS === "IN_PROGRESS"
          ? [fns.lt(f.Submissions.score, 100)]
          : filters.PROBLEM_STATUS === "SOLVED"
            ? [fns.eq(f.Submissions.score, 100)]
            : []),

        ...(filters.TITLE.length > 0
          ? [fns.ilike(f.Exercises.title, `%${filters.TITLE}%`)]
          : []),
      ),
    )
    .build();

  const rows = await db.runtime().query(plan);

  console.log(rows);

  return rows || [];
};
