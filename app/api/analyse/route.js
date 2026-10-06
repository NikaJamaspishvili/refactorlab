import { eslint, syntaxCheck } from "./eslint";
import { fileURLToPath } from "url";
import path from "node:path";
import fs from "node:fs/promises";
import { RunTests } from "./runtests";
import EXERCISES from "../../../BAD_CODE/exercises.json";
import { getOutputAffectingLines } from "../tools/output_affecting_lines";

export async function withTempCodeFile(code, ext = "js") {
  const tmpDir = path.join(process.cwd(), ".tmp");
  await fs.mkdir(tmpDir, { recursive: true });

  const file = path.join(tmpDir, `snippet-${crypto.randomUUID()}.${ext}`);
  await fs.writeFile(file, code, "utf8");
  return file;
}

export async function POST(request) {
  const { code, exerciseId } = await request.json();

  const exerciseContext = EXERCISES[exerciseId];
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
          affectedLines: affectedLines.map((item) => {
            return { startLine: item.startLine, endLine: item.endLine };
          }),
        },
        { status: 400 },
      );
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const targetFile = path.resolve(__dirname, tmpFilePath);
    // step 2: structural code evaluation
    const eslint_res = await eslint(targetFile);

    // if (eslint_res[0]?.fatal) {
    //   return Response.json(
    //     { status: "FATAL_MESSAGE", ...eslint_res },
    //     { status: 400 },
    //   );
    // }

    return Response.json(eslint_res, { status: 200 });
  } catch (error) {
    throw new Error(error);
  } finally {
    fs.rm(tmpFilePath, { force: true });
  }
}
