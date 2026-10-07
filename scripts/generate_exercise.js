import { withTempCodeFile } from "../app/api/tools/fs.js";
import fs from "node:fs/promises";
import { getOutputAffectingLines } from "../app/api/tools/output_affecting_lines.js";
import { recordsToCsv } from "../app/api/tools/data_formatters.js";
import EXERCISES from "../exercises.json" with { type: "json" };

async function GenerateExercise() {
  const tmpFilePath = await withTempCodeFile(EXERCISES["2"].code);

  try {
    const output = getOutputAffectingLines(
      tmpFilePath,
      EXERCISES["2"].mainFunctionName,
    );

    const csvAffectedLines = recordsToCsv(output);
  } catch (err) {
    throw new Error(err);
  } finally {
    fs.rm(tmpFilePath, { force: true });
  }
}

GenerateExercise();
