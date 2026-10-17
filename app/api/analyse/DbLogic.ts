import { db } from "@/src/prisma/db";
import { VALID_ACCEPTED_SCORE } from "./static";

export const submissionInformation = async (
  userId: string,
  exerciseId: number,
  currentScore: number,
  code: string,
  sonarDetectedProblems: Record<string, string>,
  isHint: boolean,
) => {
  console.info(currentScore);
  const scoreSelectPlan = db.sql.public.Submissions.select("score")
    .where((f, { eq, and }) =>
      and(eq(f.userId, userId), eq(f.exerciseId, exerciseId)),
    )
    .orderBy("score", { direction: "desc" })
    .limit(1)
    .build();

  const [result] = await db.runtime().query(scoreSelectPlan);

  const latestSubmission = {
    code,
    sonarDetectedProblems,
  };

  let STATUS = [];

  if (
    (result === undefined || result?.score < VALID_ACCEPTED_SCORE) &&
    currentScore >= VALID_ACCEPTED_SCORE
  ) {
    STATUS.push("FIRST_ACCEPTED_SUBMISSION");
    console.info("FIRST ACCEPTED SUBMISSION DETECTED");
  }

  if (
    currentScore === 100 &&
    (currentScore > result?.score || result === null)
  ) {
    STATUS.push("HIGHEST_SCORE_SUBMISSION");
    console.info("HIGHEST SCORE SUBMISSION DETECTED");
  }

  if (result === undefined) {
    await db.orm.public.Submissions.create({
      userId,
      exerciseId: exerciseId,
      score: currentScore,
      count: 1,
      latestSubmission,
      hintCount: isHint ? 1 : 0,
    });
    console.info(
      "NO PREVIOUS SUBMISSION DETECTED, INSERTING BRAND NEW SUBMISSION",
    );
  } else {
    if (currentScore > result.score) {
      await db.orm.public.Submissions.where({
        userId,
        exerciseId,
      }).update({ score: currentScore, latestSubmission });
      STATUS.push("HIGHER_SCORE_SUBMISSION");
      console.info("HIGHER SCORE SUBMISSION DETECTED, UPDATING SCORE VALUE");
    } else {
      await db.orm.public.Submissions.where({
        userId,
        exerciseId,
      }).update({ latestSubmission });
    }
  }

  return STATUS;
};

export const queryInitialExerciseData = async (
  exerciseId: number,
  userId: string,
) => {
  const plan = db.sql.public.Exercises.outerLeftJoin(
    db.sql.public.Submissions,
    (f, { eq, and }) =>
      and(
        eq(f.Submissions.exerciseId, f.Exercises.id),
        eq(f.Submissions.userId, userId),
      ),
  )
    .select(
      "latestSubmission",
      "description",
      "title",
      "difficulty",
      "initialData",
      "hintCount",
      "score",
    )
    .where((f, { eq }) => eq(f.Exercises.id, exerciseId))
    .build();

  const [result] = await db.runtime().query(plan);

  return result;
};

export type QueryInitialExerciseData = Awaited<
  ReturnType<typeof queryInitialExerciseData>
>;

export const findHintCount = async (userId: string, exerciseId: number) => {
  return await db.orm.public.Submissions.select("hintCount")
    .where({
      exerciseId: exerciseId,
      userId: userId,
    })
    .first();
};

export const updateHintCount = async (
  userId: string,
  exerciseId: number,
  hintCount: number,
) => {
  return await db.orm.public.Submissions.where({
    userId,
    exerciseId,
  }).update({ hintCount });
};
