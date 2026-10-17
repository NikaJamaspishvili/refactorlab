import { db } from "@/src/prisma/db";
import { VALID_ACCEPTED_SCORE } from "./static";

export const submissionInformation = async (
  userId: string,
  exerciseId: number,
  currentScore: number,
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

  let STATUS = [];

  if (
    (result === undefined || result.score < VALID_ACCEPTED_SCORE) &&
    currentScore >= VALID_ACCEPTED_SCORE
  ) {
    STATUS.push("FIRST_ACCEPTED_SUBMISSION");
    console.info("FIRST ACCEPTED SUBMISSION DETECTED");
  }

  if (result === undefined) {
    await db.orm.public.Submissions.create({
      userId,
      exerciseId: exerciseId,
      score: currentScore,
      count: 1,
    });
    console.info(
      "NO PREVIOUS SUBMISSION DETECTED, INSERTING BRAND NEW SUBMISSION",
    );
  } else {
    if (currentScore > result.score) {
      await db.orm.public.Submissions.where({
        userId,
        exerciseId,
      }).update({ score: currentScore });
      STATUS.push("HIGHER_SCORE_SUBMISSION");
      console.info("HIGHER SCORE SUBMISSION DETECTED, UPDATING SCORE VALUE");
    }
  }

  return STATUS;
};
