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
      .access(packageLockPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false),
    fs
      .access(yarnLockPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false),
    fs
      .access(pnpmLockPath, fs.constants.F_OK)
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
  } else if (yarnLockExists) {
    return "yarn";
  } else if (pnpmLockExists) {
    return "pnpm";
  }
  // 2. detect pm by `engines` filed
  else if (packageJsonContent.engines) {
    if (packageJsonContent.engines["npm"]) {
      return "npm";
    } else if (packageJsonContent.engines["yarn"]) {
      return "yarn";
    } else if (packageJsonContent.engines["pnpm"]) {
      return "pnpm";
    }
  }
  // 3. detect pm by `devEngines` filed
  else if (packageJsonContent.devEngines?.packageManager?.name) {
    const packageManagerName =
      packageJsonContent.devEngines.packageManager.name;
    if (packageManagerName === "npm") {
      return "npm";
    } else if (packageManagerName === "yarn") {
      return "yarn";
    } else if (packageManagerName === "pnpm") {
      return "pnpm";
    }
  }

  // 4. circularly find up
  const parentDirectory = path.dirname(directory);
  if (parentDirectory === directory) return undefined; // stop at the root directory

  return await detect(parentDirectory);
}
