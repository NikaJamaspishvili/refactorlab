import { execFile } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import { promisify } from "node:util";

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
  return Math.round(100 - report.statistics.total.percentageTokens);
}
