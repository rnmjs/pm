#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import whichPmRuns from "which-pm-runs";
import { detectByPackageJson } from "./base.ts";
import { executorMap, type SupportedPm } from "./constants.ts";

await main();

async function main(): Promise<void> {
  switch (process.argv[2] ?? "") {
    case "enable-shim":
      await enableShim();
      break;
    case "check-pm":
      await checkPm();
      break;
    case "-v":
    case "--version":
      await version();
      break;
    default:
      help();
  }
}

function help() {
  console.log("Usage:");
  console.log("  pm-cli enable-shim [npm] [yarn] [pnpm]");
  console.log("  pm-cli check-pm");
}

async function checkPm(): Promise<void> {
  const expectedPm = await detectByPackageJson();
  if (!expectedPm) {
    console.error(
      "❌ No package manager configured in package.json. Please configure a package manager using one of the following methods:",
    );
    console.error('  - Add "packageManager" field in package.json');
    console.error('  - Add "devEngines.packageManager" field in package.json');
    console.error('  - Add package manager in "engines" field in package.json');
    process.exit(1);
  }

  const currentPm = whichPmRuns();
  if (!currentPm) {
    console.error("❌ Unable to detect the current package manager");
    process.exit(1);
  }

  if (expectedPm.name !== currentPm.name) {
    console.error("❌ Package manager mismatch:");
    console.error(`  Expected: ${expectedPm.name}`);
    console.error(`  Current:  ${currentPm.name}`);
    process.exit(1);
  }

  if (
    expectedPm.version &&
    currentPm.version &&
    expectedPm.version !== currentPm.version
  ) {
    console.warn("⚠️  Package manager version mismatch:");
    console.warn(`  Expected: ${expectedPm.name}@${expectedPm.version}`);
    console.warn(`  Current:  ${currentPm.name}@${currentPm.version}`);
  }
}

async function enableShim(): Promise<void> {
  const argv = process.argv.slice(3);
  const packageManagers: SupportedPm[] = [];
  if (argv.length === 0) {
    packageManagers.push(...(["npm", "yarn", "pnpm"] as const));
  } else {
    if (argv.includes("npm")) packageManagers.push("npm");
    if (argv.includes("yarn")) packageManagers.push("yarn");
    if (argv.includes("pnpm")) packageManagers.push("pnpm");
  }

  // 1. Get installDirectory
  const currentFile = process.argv[1];
  if (!currentFile || !path.isAbsolute(currentFile)) {
    throw new Error(
      `The path '${String(currentFile)}' is not an absolute path.`,
    );
  }
  const installDirectory = await fs.realpath(path.dirname(currentFile));

  // 2. Get shimsDirectory
  const importMetaFile = fileURLToPath(import.meta.url);
  const importMetaDirname = path.dirname(importMetaFile);
  const shimsDirectory = path.join(importMetaDirname, "shims");

  // 3. Get extension
  const extension = path.extname(importMetaFile);

  for (const shimName of packageManagers.flatMap((packageManager) => [
    packageManager,
    executorMap[packageManager],
  ])) {
    const cliFile = path.join(shimsDirectory, `${shimName}.cli${extension}`);
    await fs.chmod(cliFile, 0o755);

    const file = path.join(installDirectory, shimName);
    const symlink = path.relative(installDirectory, cliFile);
    await fs.unlink(file).catch((_error: unknown) => undefined);
    await fs.symlink(symlink, file);
  }
}

async function version() {
  const packageJson = JSON.parse(
    await fs.readFile(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "package.json",
      ),
      "utf8",
    ),
  );
  console.log(packageJson.version);
}
