#!/usr/bin/env node
import childProcess from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import corepackPkgJson from "corepack/package.json" with { type: "json" };
import registryUrl from "registry-url";

type SupportedPm = "npm" | "yarn" | "pnpm";

// This function may replaced by `package-manager-detector` package.
/**
 * Detects the package manager used in the specified directory.
 * @param directory - The absolute path to the directory to check.
 * @returns 'npm' | 'pnpm' | 'yarn' | undefined - The detected package manager or undefined if none is found.
 */
async function detect(directory: string): Promise<SupportedPm | undefined> {
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
      packageManager?: string;
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
  const devEnginesPackageManager =
    packageJsonContent.devEngines?.packageManager?.name;
  if (
    devEnginesPackageManager === "npm" ||
    devEnginesPackageManager === "yarn" ||
    devEnginesPackageManager === "pnpm"
  ) {
    return devEnginesPackageManager;
  }

  // 4. detect pm by `packageManager` field
  const packageManager = packageJsonContent.packageManager?.split("@")[0];
  if (
    packageManager === "npm" ||
    packageManager === "yarn" ||
    packageManager === "pnpm"
  ) {
    return packageManager;
  }

  // 5. circularly find up
  const parentDirectory = path.dirname(directory);
  if (parentDirectory === directory) return undefined; // stop at the root directory

  return await detect(parentDirectory);
}

/**
 * @returns Absolute path to corepack binary.
 */
function getCorepackPath(): string {
  const corepackPkgJsonPath = fileURLToPath(
    import.meta.resolve("corepack/package.json"),
  );
  return path.resolve(
    path.dirname(corepackPkgJsonPath),
    corepackPkgJson.bin.corepack,
  );
}

/**
 * Determines whether a package.json file exists in the current directory or any of its parent directories.
 * @param directory - The absolute path to the directory to check.
 */
async function hasPackageJson(directory: string): Promise<boolean> {
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

function getRegistry() {
  const registry = registryUrl();
  return registry.endsWith("/") ? registry.slice(0, -1) : registry;
}

async function main() {
  const promiseResult = await Promise.all([
    hasPackageJson(process.cwd()),
    detect(process.cwd()),
  ]);
  if (!promiseResult[0]) {
    throw new Error(
      "No package.json found in the current directory and its parent directories",
    );
  }

  let packageManager = promiseResult[1];
  if (!packageManager) {
    console.log("No package manager detected then fall back to npm");
    packageManager = "npm";
  } else {
    console.log(`Detected ${packageManager} as package manager`);
  }

  childProcess.spawnSync(
    getCorepackPath(),
    [packageManager, ...process.argv.slice(2)],
    {
      stdio: "inherit",
      env: {
        COREPACK_ENABLE_AUTO_PIN: "0", // TODO: Remove this env when the default is 0; Refer: https://github.com/nodejs/corepack/issues/485.
        COREPACK_NPM_REGISTRY: getRegistry(), // TODO: Remove this env when https://github.com/nodejs/corepack/issues/540 is resolved.
        ...process.env,
      },
    },
  );
}

await main();
