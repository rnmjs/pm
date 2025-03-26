import childProcess from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import corepackPkgJson from "corepack/package.json" with { type: "json" };
import registryUrl from "registry-url";

type SupportedPm = "npm" | "yarn" | "pnpm";

interface DetectResult {
  name: SupportedPm;
  version?: string;
}

const exists = async (p: string) =>
  await fs
    .access(p)
    .then(() => true)
    .catch(() => false);
const importPkgJson = async (p: string) =>
  await fs
    .readFile(p, "utf8")
    .then<{
      packageManager?: string;
      engines?: Record<string, string>;
      devEngines?: { packageManager?: { name?: string; version?: string } };
    }>(JSON.parse)
    .catch(() => undefined);

/**
 * Detects the package manager used in the specified directory.
 * @param directory - The absolute path to the directory to check.
 */
async function detect(directory: string): Promise<DetectResult | undefined> {
  if (!path.isAbsolute(directory)) {
    throw new Error("directory must be an absolute path");
  }

  const [packageLockExists, yarnLockExists, pnpmLockExists, pkgJsonContent] =
    await Promise.all([
      exists(path.join(directory, "package-lock.json")),
      exists(path.join(directory, "yarn.lock")),
      exists(path.join(directory, "pnpm-lock.yaml")),
      importPkgJson(path.join(directory, "package.json")),
    ]);

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
  const { name, version } = pkgJsonContent?.devEngines?.packageManager ?? {};
  if (name === "npm" || name === "yarn" || name === "pnpm") {
    return { name, ...(version && { version }) };
  }

  // 3. detect pm by `engines` filed
  // Note: Corepack does not support `engines` field. So the result doesn't include the version.
  if (pkgJsonContent?.engines?.["npm"]) return { name: "npm" };
  if (pkgJsonContent?.engines?.["yarn"]) return { name: "yarn" };
  if (pkgJsonContent?.engines?.["pnpm"]) return { name: "pnpm" };

  // 4. detect pm by lock files
  if (packageLockExists) return { name: "npm" };
  if (yarnLockExists) return { name: "yarn" };
  if (pnpmLockExists) return { name: "pnpm" };

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

  const result = await exists(path.join(directory, "package.json"));
  if (result) return true;

  const parentDirectory = path.dirname(directory);
  if (parentDirectory === directory) return false; // stop at the root
  return await hasPackageJson(parentDirectory);
}

function getRegistry() {
  const registry = registryUrl();
  return registry.endsWith("/") ? registry.slice(0, -1) : registry;
}

export async function main({
  forceTo,
  onDetected,
}: {
  forceTo?: SupportedPm;
  onDetected?: (pm: DetectResult | undefined) => void;
}) {
  const [hasPkg, packageManager] = await Promise.all([
    hasPackageJson(process.cwd()),
    new Promise<SupportedPm>((resolve, reject) => {
      forceTo
        ? resolve(forceTo)
        : detect(process.cwd())
            .then((detectedResult) => {
              onDetected?.(detectedResult);
              resolve(detectedResult?.name ?? "npm");
            })
            .catch((e: Error) => {
              reject(e);
            });
    }),
  ]);
  if (!hasPkg) {
    throw new Error(
      "No package.json found in the current directory and its parent directories",
    );
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
