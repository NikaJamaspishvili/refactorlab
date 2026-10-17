import { eslint, syntaxCheck } from "./eslint";
import { fileURLToPath } from "url";
import { withTempCodeFile } from "../../_tools/fs";
import path from "node:path";
import fs from "node:fs/promises";
import { RunTests } from "./runtests";
import EXERCISES from "@/exercises.json";
import { getOutputAffectingLines } from "../../_tools/output_affecting_lines";
import {
  findHintCount,
  submissionInformation,
  updateHintCount,
} from "./DbLogic";
import { MAX_HINT_COUNT } from "../../common";

import { auth } from "@/auth";

export async function POST(request) {
  const session = await auth();
  const userSession = session?.user;
  const userId = userSession.userId;

  const { code, exerciseId, isHint } = await request.json();

  const exerciseContext = EXERCISES[String(exerciseId)];
  const tmpFilePath = await withTempCodeFile(code);

  try {
    const response = await syntaxCheck(tmpFilePath);

    if (!response.ok)
      return Response.json(
        { status: "FATAL_MESSAGE", fatalMessages: response.fatalMessages },
        { status: 400 },
      );

    // step 1: run tests, ensure code behaviour works correctly.
    const testsResult = await RunTests(
      exerciseContext.tests,
      exerciseContext.mainFunctionName,
      code,
    );

    if (!testsResult.ok) {
      const affectedLines = getOutputAffectingLines(
        tmpFilePath,
        exerciseContext.mainFunctionName,
      );
      return Response.json(
        {
          status: "TESTS_FAILED",
          testsResult,
          affectedLines: affectedLines,
        },
        { status: 400 },
      );
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const targetFile = path.resolve(__dirname, tmpFilePath);
    // step 2: structural code evaluation
    const eslint_res = await eslint(targetFile);

    const STATUS = await submissionInformation(
      userId,
      exerciseId,
      eslint_res.finalScore,
      code,
      eslint_res,
      isHint,
    );
    eslint_res.submissionStatus = STATUS;

    if (isHint) {
      const { hintCount } = await findHintCount(userId, exerciseId);
      if (hintCount >= MAX_HINT_COUNT) {
        throw new Error("HINTS LIMIT IS UP!");
      } else {
        updateHintCount(userId, exerciseId, hintCount + 1);
        eslint_res.hintCount = hintCount + 1;
      }
    }
    return Response.json(eslint_res, { status: 200 });
  } catch (error) {
    throw new Error(error);
  } finally {
    fs.rm(tmpFilePath, { force: true });
  }
}
