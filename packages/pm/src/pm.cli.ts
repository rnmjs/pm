#!/usr/bin/env node
import childProcess from "node:child_process";
import process from "node:process";
import registryUrl from "registry-url";
import { detect } from "./detect.ts";
import { getCorepackPath } from "./get-corepack-path.ts";

function getRegistry() {
  const registry = registryUrl();
  return registry.endsWith("/") ? registry.slice(0, -1) : registry;
}

let packageManager = await detect(process.cwd());
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
