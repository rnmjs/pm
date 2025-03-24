// This file may replaced by `package-manager-detector` package.
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Detects the package manager used in the specified directory.
 * @param directory - The path to the directory to check.
 * @returns 'npm' | 'pnpm' | 'yarn' | undefined - The detected package manager or undefined if none is found.
 */
export async function detect(
  directory: string,
): Promise<"npm" | "pnpm" | "yarn" | undefined> {
  if (!path.isAbsolute(directory)) {
    throw new Error("directory must be an absolute path");
  }

  const packageLockPath = path.join(directory, "package-lock.json");
  const yarnLockPath = path.join(directory, "yarn.lock");
  const pnpmLockPath = path.join(directory, "pnpm-lock.yaml");
  const packageJsonPath = path.join(directory, "package.json");

  const [
    packageLockExists,
    yarnLockExists,
    pnpmLockExists,
    packageJsonContent,
  ]: [
    boolean,
    boolean,
    boolean,
    {
      engines?: Record<string, string>;
      devEngines?: { packageManager?: { name?: string } };
    },
  ] = await Promise.all([
    fs
      .access(packageLockPath)
      .then(() => true)
      .catch(() => false),
    fs
      .access(yarnLockPath)
      .then(() => true)
      .catch(() => false),
    fs
      .access(pnpmLockPath)
      .then(() => true)
      .catch(() => false),
    fs
      .readFile(packageJsonPath, "utf8")
      .then(JSON.parse)
      .catch(() => ({})),
  ]);

  // 1. detect pm by lock files
  if (packageLockExists) {
    return "npm";
  }
  if (yarnLockExists) {
    return "yarn";
  }
  if (pnpmLockExists) {
    return "pnpm";
  }

  // 2. detect pm by `engines` filed
  if (packageJsonContent.engines?.["npm"]) {
    return "npm";
  }
  if (packageJsonContent.engines?.["yarn"]) {
    return "yarn";
  }
  if (packageJsonContent.engines?.["pnpm"]) {
    return "pnpm";
  }

  // 3. detect pm by `devEngines` filed
  if (packageJsonContent.devEngines?.packageManager?.name === "npm") {
    return "npm";
  }
  if (packageJsonContent.devEngines?.packageManager?.name === "yarn") {
    return "yarn";
  }
  if (packageJsonContent.devEngines?.packageManager?.name === "pnpm") {
    return "pnpm";
  }

  // 4. circularly find up
  const parentDirectory = path.dirname(directory);
  if (parentDirectory === directory) return undefined; // stop at the root directory

  return await detect(parentDirectory);
}
