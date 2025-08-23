#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { executorMap, type SupportedPm } from "./base.ts";

// 1. Get installDirectory
const currentFile = process.argv[1];
if (!currentFile || !path.isAbsolute(currentFile)) {
  throw new Error(`The path '${String(currentFile)}' is not an absolute path.`);
}
const installDirectory = await fs.realpath(path.dirname(currentFile));

// 2. Get shimsDirectory
const importMetaFile = fileURLToPath(import.meta.url);
const importMetaDirname = path.dirname(importMetaFile);
const shimsDirectory = path.join(importMetaDirname, "shims");

// 3. Get extension
const extension = path.extname(importMetaFile);

for (const shimName of getShimNames(process.argv)) {
  const cliFile = path.join(shimsDirectory, `${shimName}.cli${extension}`);
  await fs.chmod(cliFile, 0o755);

  const file = path.join(installDirectory, shimName);
  const symlink = path.relative(installDirectory, cliFile);
  await fs.unlink(file).catch((_error: unknown) => undefined);
  await fs.symlink(symlink, file);
}

function getShimNames(
  argv: string[],
): (SupportedPm | (typeof executorMap)[SupportedPm])[] {
  const packageManagers =
    argv.length <= 2 ? ["npm", "yarn", "pnpm"] : argv.slice(2);
  const result: (SupportedPm | (typeof executorMap)[SupportedPm])[] = [];
  for (const packageManager of packageManagers) {
    switch (packageManager) {
      case "npm":
      case "yarn":
      case "pnpm":
        result.push(packageManager, executorMap[packageManager]);
        break;
      default:
        throw new Error(`Unknown package manager: ${packageManager}`);
    }
  }
  return result;
}
