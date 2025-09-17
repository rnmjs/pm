#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { executorMap, type SupportedPm } from "./constants.ts";

await main();

async function main(): Promise<void> {
  switch (process.argv[2] ?? "") {
    case "enable-shim":
      await enableShim();
      break;
    case "check":
      // TODO: check();
      break;
    default:
      console.log("Usage: pm-cli enable-shim [npm] [yarn] [pnpm]");
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
