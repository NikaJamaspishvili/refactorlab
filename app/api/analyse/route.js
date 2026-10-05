import { eslint } from "./eslint";
import { Duplication } from "./jscpd";
import { fileURLToPath } from "url";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { METRIC, STATUS } from "./static";

export async function withTempCodeFile(code, ext = "js") {
  const tmpDir = path.join(process.cwd(), ".tmp");
  await fs.mkdir(tmpDir, { recursive: true });

  const file = path.join(tmpDir, `snippet-${crypto.randomUUID()}.${ext}`);
  await fs.writeFile(file, code, "utf8");
  return file;
}

export async function POST(request) {
  const { code } = await request.json();
  const tmpFilePath = await withTempCodeFile(code);

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const targetFile = path.resolve(__dirname, tmpFilePath);
    // step 1: cognitive complexity & syntax errors
    const eslint_res = await eslint(targetFile);

    let response = {
      ...eslint_res,
      status: STATUS.ACCEPTED,
      duplication: null,
      duplicationDetails: null,
      text: null,
    };

    if (eslint_res.fatal.length > 0) {
      response.status = STATUS.REJECTED;
      response.text = "Fatal error";

      return Response.json(response);
    }

    // step 2: duplication check
    const duplication = await Duplication(targetFile);
    if (!isNaN(duplication?.score)) {
      response.duplication = duplication.score;
      response.duplicationDetails = {
        score: duplication.score,
        deductedPoints: duplication.deductedPoints,
        percentageTokens: duplication.percentageTokens,
        duplicatedLines: duplication.duplicatedLines,
        totalLines: duplication.totalLines,
        clones: duplication.clones,
      };

      response.maintainability.metricGroups[METRIC.DUPLICATION] = {
        ...response.maintainability.metricGroups[METRIC.DUPLICATION],
        score: duplication.score,
        deductedPoints: duplication.deductedPoints,
        problems: duplication.problems,
      };
    }

    console.log(response.maintainability.metricGroups.complexity.problems);

    return Response.json(response);
  } catch (error) {
    throw new Error(error);
  } finally {
    fs.rm(tmpFilePath, { force: true });
  }
}
