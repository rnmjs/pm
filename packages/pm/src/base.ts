import childProcess from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { styleText } from "node:util";
import corepackPkgJson from "corepack/package.json" with { type: "json" };
import { findUp } from "find-up-simple";
import semver from "semver";
import { defaultVersions, executorMap, type SupportedPm } from "./constants.ts";
import { fetchPmVersions } from "./utils/fetch-pm-versions.ts";
import { getCorepackHome } from "./utils/get-corepack-home.ts";
import { registryUrl } from "./utils/registry-url.ts";

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

export async function detectByPackageJson(
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
  if (!pkgJsonPath) {
    // throw new Error("No package.json found.");
    return undefined;
  }

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
    import.meta.resolve("corepack/package.json"),
  );
  return path.resolve(
    path.dirname(corepackPkgJsonPath),
    corepackPkgJson.bin.corepack,
  );
}

async function getCommand(
  detectResult: DetectResult | undefined,
  args: string[],
  execute?: boolean,
) {
  const { name, version } = await getExecutingPmAndVersion(detectResult);
  const executor = execute ? executorMap[name] : name;
  return [`${executor}@${version}`, ...args];
}

export async function run(
  detectResult: DetectResult | undefined,
  args: string[],
  execute?: boolean,
): Promise<number> {
  const command = await getCommand(detectResult, args, execute);
  const cp = childProcess.spawn(
    process.execPath,
    [getCorepackPath(), ...command],
    {
      stdio: "inherit",
      env: {
        COREPACK_DEFAULT_TO_LATEST: "0",
        COREPACK_ENV_FILE: "0",
        COREPACK_NPM_REGISTRY: registryUrl(), // TODO: Remove this env when https://github.com/nodejs/corepack/issues/540 is resolved.
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

export async function getMsg(
  detectResult: DetectResult | undefined,
  args: string[],
  execute?: boolean,
) {
  const { name, version } = await getExecutingPmAndVersion(detectResult);
  const nameVer = `[${name}@${version}]`;
  const info = detectResult ? "(detected)" : "(fallback)";

  const command = await getCommand(detectResult, args, execute);
  command[0] &&= command[0].replace(/@.*$/, "");
  return [
    "📦",
    `${styleText("bold", nameVer)}${styleText("dim", info)}`,
    "➜",
    styleText("blue", command.join(" ")),
  ].join(" ");
}

async function getDownloadedVersions(pm: SupportedPm) {
  const pmFolder = path.join(getCorepackHome(), pm);
  return (await fs.readdir(pmFolder))
    .filter((file) => semver.valid(file))
    .sort((x, y) => semver.compare(y, x)); // desc
}

async function getRemoteVersions(pm: SupportedPm) {
  return (await fetchPmVersions(pm))
    .filter((version) => semver.valid(version))
    .sort((x, y) => semver.compare(y, x)); // desc
}

async function getExecutingPmAndVersion(
  detectResult: DetectResult | undefined,
): Promise<Required<DetectResult>> {
  const { name = "npm" } = detectResult ?? {};
  const { version = defaultVersions[name] } = detectResult ?? {};
  // 1. If version is valid, return it.
  if (semver.valid(version)) {
    return { name, version };
  }
  if (semver.validRange(version)) {
    // 2. Try to find the version in the downloaded versions.
    const downloadedVersions = await getDownloadedVersions(name);
    for (const downloadedVersion of downloadedVersions) {
      if (semver.satisfies(downloadedVersion, version)) {
        return { name, version: downloadedVersion };
      }
    }
    // 3. Try to find the version in the remote versions.
    const remoteVersions = await getRemoteVersions(name);
    for (const remoteVersion of remoteVersions) {
      if (semver.satisfies(remoteVersion, version)) {
        return { name, version: remoteVersion };
      }
    }
    throw new Error(
      `No package manager version found that satisfies '${version}'. The specified version range may not exist or is unavailable from ${registryUrl()}.`,
    );
  }
  // 4. Return the default version.
  return { name, version };
}
