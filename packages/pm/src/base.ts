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
import which from "which";
import { getPackageJson } from "./common.ts";
import { defaultVersions, executorMap, type SupportedPm } from "./constants.ts";
import type { DetectResult } from "./utils/detector.ts";
import { fetchPmVersions } from "./utils/fetch-pm-versions.ts";
import { getCorepackHome } from "./utils/get-corepack-home.ts";
import { registryUrl } from "./utils/registry-url.ts";

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
  const pm = detectResult?.name ?? "npm";
  if (
    (process.env["JRM_MULTISHELL_PATH_OF_NPM"] && pm === "npm") ||
    (process.env["JRM_MULTISHELL_PATH_OF_YARN"] && pm === "yarn") ||
    (process.env["JRM_MULTISHELL_PATH_OF_PNPM"] && pm === "pnpm")
  ) {
    const executor = execute ? executorMap[pm] : pm;
    return [executor, ...args] as const;
  }

  const { name, version } = await getExecutingPmAndVersion(detectResult);
  const executor = execute ? executorMap[name] : name;
  return [getCorepackPath(), `${executor}@${version}`, ...args] as const;
}

export async function run(
  detectResult: DetectResult | undefined,
  args: string[],
  execute?: boolean,
): Promise<number> {
  const command = await getCommand(detectResult, args, execute);
  const binPath = path.isAbsolute(command[0])
    ? command[0]
    : await which(command[0]);
  const arg = [binPath, ...command.slice(1)];
  const cp = childProcess.spawn(process.execPath, arg, {
    stdio: "inherit",
    env: {
      COREPACK_DEFAULT_TO_LATEST: "0",
      COREPACK_ENV_FILE: "0",
      COREPACK_NPM_REGISTRY: registryUrl(), // TODO: Remove this env when https://github.com/nodejs/corepack/issues/540 is resolved.
      ...Object.fromEntries(
        Object.entries(process.env).filter(([k]) => !k.startsWith("COREPACK_")),
      ),
    },
  });

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
  const command = await getCommand(detectResult, args, execute);
  const packageJson = getPackageJson();
  const info = `(pm@${packageJson.version})`;

  // command format: ['/path/to/corepack', 'npm@11.0.0', '-v']
  // or: ['npm', '-v']
  const isCorepackFormat = command[0] === getCorepackPath();

  if (isCorepackFormat) {
    const [name, version] = command[1].split("@");
    if (!name || !version) {
      throw new Error("Internal error: `name` or `version` not found.");
    }
    const pmName =
      name in executorMap
        ? name
        : Object.fromEntries(
            Object.entries(executorMap).map(([k, v]) => [v, k]),
          )[name];
    if (!pmName) {
      throw new Error("Internal error: `pmName` not found.");
    }
    return [
      "📦",
      `${styleText("bold", `[${pmName}@${version}]`)}${styleText("dim", info)}`,
      "➜",
      styleText("blue", ["corepack", name, ...command.slice(2)].join(" ")),
    ].join(" ");
  }

  // Direct format: ['npm', '-v']
  const name = command[0];
  if (!name) {
    throw new Error("Internal error: `name` not found.");
  }
  let version = "";
  try {
    const binPath = await which(name);
    const realPath = await fs.realpath(binPath);
    const pkgJsonPath = await findUp("package.json", {
      cwd: path.dirname(realPath),
    });
    if (pkgJsonPath) {
      const pkg = JSON.parse(await fs.readFile(pkgJsonPath, "utf8"));
      if (pkg.name === name) {
        version = pkg.version;
      }
    }
  } catch {
    // Ignore errors, version stays undefined.
  }
  const versionPart = version ? `@${version}` : "";
  return [
    "📦",
    `${styleText("bold", `[${name}${versionPart}]`)}${styleText("dim", info)}`,
    "➜",
    styleText("blue", command.join(" ")),
  ].join(" ");
}

async function getDownloadedVersions(pm: SupportedPm) {
  const pmFolder = path.join(getCorepackHome(), pm);
  return (await fs.readdir(pmFolder).catch(() => []))
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
