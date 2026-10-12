import path from "node:path";
import fs from "node:fs/promises";

export async function withTempCodeFile(code, ext = "js") {
  const tmpDir = path.join(process.cwd(), ".tmp");
  await fs.mkdir(tmpDir, { recursive: true });

  const file = path.join(tmpDir, `snippet-${crypto.randomUUID()}.${ext}`);
  await fs.writeFile(file, code, "utf8");
  return file;
}
