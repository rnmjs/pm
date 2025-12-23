import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function getPackageJson() {
  const packageJson: { name: string; version: string } = JSON.parse(
    await fs.readFile(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "package.json",
      ),
      "utf8",
    ),
  );
  return packageJson;
}
