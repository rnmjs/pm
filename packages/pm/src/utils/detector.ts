import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { findUp } from "find-up-simple";
import type { SupportedPm } from "../constants.ts";

export interface DetectResult {
  name: SupportedPm;
  version?: string;
}

const importPkgJson = async (p: string) =>
  await fs
    .readFile(p, "utf8")
    .then<{
      packageManager?: string;
      engines?: Record<string, string>;
      devEngines?: { packageManager?: { name?: string; version?: string } };
    }>(JSON.parse)
    .catch(() => undefined);

async function detectByPackageJson(
  directory = process.cwd(),
): Promise<DetectResult | undefined> {
  const pkgJsonContent = await importPkgJson(
    path.join(directory, "package.json"),
  );

  // 1. detect pm by `packageManager` field
  const [packageManager, rest] =
    pkgJsonContent?.packageManager?.split("@") ?? [];
  if (
    packageManager === "npm" ||
    packageManager === "yarn" ||
    packageManager === "pnpm"
  ) {
    const version = rest?.split("+")[0];
    return { name: packageManager, ...(version && { version }) };
  }

  // 2. detect pm by `devEngines` filed
  const { name, version: devEnginesVer } =
    pkgJsonContent?.devEngines?.packageManager ?? {};
  if (name === "npm" || name === "yarn" || name === "pnpm") {
    const version = devEnginesVer?.split("+")[0];
    return { name, ...(version && { version }) };
  }

  // 3. detect pm by `engines` filed
  // Note: Corepack does not support `engines` field. So the result doesn't include the version. See https://github.com/nodejs/corepack/issues/694.
  if (pkgJsonContent?.engines?.["npm"]) return { name: "npm" };
  if (pkgJsonContent?.engines?.["yarn"]) return { name: "yarn" };
  if (pkgJsonContent?.engines?.["pnpm"]) return { name: "pnpm" };

  const parent = path.dirname(directory);
  if (directory === parent) return undefined;
  return await detectByPackageJson(parent);
}

async function detectByLockFile(
  directory = process.cwd(),
): Promise<DetectResult | undefined> {
  const locks = (
    await Promise.all([
      findUp("package-lock.json", { cwd: directory }),
      findUp("yarn.lock", { cwd: directory }),
      findUp("pnpm-lock.yaml", { cwd: directory }),
    ])
  ).filter((p) => p !== undefined);

  if (locks.length > 1) {
    throw new Error("Multiple lock files found. Please remove one of them.");
  }

  if (locks[0]?.endsWith("package-lock.json")) return { name: "npm" };
  if (locks[0]?.endsWith("yarn.lock")) return { name: "yarn" };
  if (locks[0]?.endsWith("pnpm-lock.yaml")) return { name: "pnpm" };

  return undefined;
}

/**
 * Detects the package manager used in the specified directory.
 * @param directory - The absolute path to the directory to check.
 */
export async function detect(
  directory = process.cwd(),
): Promise<DetectResult | undefined> {
  const pkgJsonPath = await findUp("package.json", { cwd: directory });
  if (!pkgJsonPath) {
    // throw new Error("No package.json found.");
    return undefined;
  }

  // detect pm by package.json or lock files
  return (
    (await detectByPackageJson(path.dirname(pkgJsonPath))) ??
    (await detectByLockFile(directory))
  );
}
