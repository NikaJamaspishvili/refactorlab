import { execFile } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import { promisify } from "node:util";
import { DEDUCTION_PER_ISSUE, METRIC, fallbackHintForMetric } from "./static";

const execFileAsync = promisify(execFile);

export async function Duplication(filePath) {
  await execFileAsync("npx", [
    "jscpd",
    filePath,
    "--min-tokens",
    "15",
    "--min-lines",
    "3",
    "--reporters",
    "json",
    "--output",
    "./",
  ]);
  const TEMP_JSCPD_FILEPATH = "./jscpd-report.json";
  const raw = await readFile(TEMP_JSCPD_FILEPATH, "utf8");
  const report = JSON.parse(raw);

  await rm(TEMP_JSCPD_FILEPATH, { force: true });

  const total = report?.statistics?.total ?? {};
  const duplicationPercentage = Number(total.percentageTokens ?? 0);
  const problems = Array.isArray(report?.duplicates)
    ? report.duplicates.map((entry, index) => {
        const firstFile = entry.firstFile ?? {};
        const secondFile = entry.secondFile ?? {};
        const lines = Number(entry.lines ?? 0);
        const tokens = Number(entry.tokens ?? 0);

        let suggestion = fallbackHintForMetric(METRIC.DUPLICATION);

        if (lines >= 20) {
          suggestion =
            "Large duplicate block detected. Extract this logic into a reusable helper or module.";
        } else if (lines >= 10) {
          suggestion =
            "Repeated logic detected. Extract a shared function and call it from both locations.";
        }

        return {
          id: `duplication-${index}`,
          metric: METRIC.DUPLICATION,
          ruleId: "jscpd/duplicate-block",
          problemGroup: "Duplicate block",
          message: `Duplicate block (${lines} lines, ${tokens} tokens) between lines ${firstFile.start}-${firstFile.end} and ${secondFile.start}-${secondFile.end}.`,
          hint: suggestion,
          deductionPoints: DEDUCTION_PER_ISSUE,
          line: firstFile.start ?? null,
          column: firstFile.startLoc?.column ?? null,
          endLine: firstFile.end ?? null,
          endColumn: firstFile.endLoc?.column ?? null,
          duplicateRange: {
            startLine: secondFile.start ?? null,
            startColumn: secondFile.startLoc?.column ?? null,
            endLine: secondFile.end ?? null,
            endColumn: secondFile.endLoc?.column ?? null,
          },
        };
      })
    : [];

  const deductedPoints = problems.reduce(
    (totalDeduction, problem) => totalDeduction + (problem.deductionPoints ?? 0),
    0,
  );
  const score = Math.max(0, 100 - deductedPoints);

  return {
    score,
    deductedPoints,
    percentageTokens: duplicationPercentage,
    duplicatedLines: Number(total.duplicatedLines ?? 0),
    totalLines: Number(total.lines ?? 0),
    clones: Number(total.clones ?? 0),
    problems,
  };
}
