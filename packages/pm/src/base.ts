import childProcess from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import corepackPkgJson from "corepack/package.json" with { type: "json" };
import registryUrl from "registry-url";
import { importMetaResolve } from "./import-meta-resolve.ts";

export type SupportedPm = "npm" | "yarn" | "pnpm";

export interface DetectResult {
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

async function findUp(name: string, { cwd = process.cwd() } = {}) {
  const result = path.join(cwd, name);
  const existing = await exists(result);
  if (existing) return result;
  const parent = path.dirname(cwd);
  if (parent === cwd) return undefined;
  return await findUp(name, { cwd: parent });
}

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

/**
 * Detects the package manager used in the specified directory.
 * @param directory - The absolute path to the directory to check.
 */
export async function detect(
  directory = process.cwd(),
): Promise<DetectResult | undefined> {
  const pkgJsonPath = await findUp("package.json", { cwd: directory });
  if (!pkgJsonPath) throw new Error("No package.json found.");

  // 1. detect pm by package.json
  const pm = await detectByPackageJson(path.dirname(pkgJsonPath));
  if (pm) return pm;

  // 2. detect pm by lock files
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
 * @returns Absolute path to corepack binary.
 */
function getCorepackPath(): string {
  const corepackPkgJsonPath = fileURLToPath(
    importMetaResolve("corepack/package.json"),
  );
  return path.resolve(
    path.dirname(corepackPkgJsonPath),
    corepackPkgJson.bin.corepack,
  );
}

function getRegistry() {
  const registry = registryUrl();
  return registry.endsWith("/") ? registry.slice(0, -1) : registry;
}

export async function run(
  { name, version }: DetectResult,
  args: string[],
): Promise<number> {
  const cp = childProcess.spawn(
    getCorepackPath(),
    [`${name}${version ? `@${version}` : ""}`, ...args],
    {
      stdio: "inherit",
      env: {
        COREPACK_ENV_FILE: "0",
        COREPACK_NPM_REGISTRY: getRegistry(), // TODO: Remove this env when https://github.com/nodejs/corepack/issues/540 is resolved.
        ...Object.fromEntries(
          Object.entries(process.env).filter(
            ([k]) => !k.startsWith("COREPACK_"),
          ),
        ),
      },
    },
  );

  const listener = (signal: NodeJS.Signals) => !cp.killed && cp.kill(signal);
  process.on("SIGINT", listener);
  process.on("SIGTERM", listener);

  return await new Promise((resolve, reject) => {
    cp.on("error", (err) => {
      reject(err);
    });
    cp.on("close", (code, signal) => {
      resolve(
        code ?? (signal !== null ? 128 + os.constants.signals[signal] : 1),
      );
    });
  });
}
