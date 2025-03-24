import fs from "node:fs/promises";
import path from "node:path";

export async function hasPackageJson(directory: string): Promise<boolean> {
  if (!path.isAbsolute(directory)) {
    throw new Error("directory must be an absolute path");
  }

  const result = await fs
    .access(path.join(directory, "package.json"))
    .then(() => true)
    .catch(() => false);
  if (result) return true;

  const parentDirectory = path.dirname(directory);
  if (parentDirectory === directory) return false; // stop at the root

  return await hasPackageJson(parentDirectory);
}
