import childProcess from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";
import { getCorepackHome } from "./get-corepack-home.ts";

describe("get-corepack-home", () => {
  const corepackPath = path.join(process.cwd(), "node_modules/.bin/corepack");

  const testCases = [
    { packageManager: "npm", version: "6.14.18" },
    { packageManager: "pnpm", version: "7.33.7" },
    { packageManager: "yarn", version: "3.8.7" },
  ] as const;

  testCases.forEach(({ packageManager, version }) => {
    it(`should create cache directory for ${packageManager}@${version}`, async () => {
      const packageCacheDir = path.join(getCorepackHome(), packageManager);

      // Remove the specific version from cache if it exists
      await fs.mkdir(packageCacheDir, { recursive: true });
      const cachedVersions = await fs.readdir(packageCacheDir);
      if (cachedVersions.includes(version)) {
        const versionPath = path.join(packageCacheDir, version);
        await fs.rm(versionPath, { recursive: true, force: true });
      }
      expect(await fs.readdir(packageCacheDir)).not.toContain(version);

      // Execute corepack command to trigger caching
      childProcess.execSync(
        `${corepackPath} ${packageManager}@${version} --version`,
        {
          cwd: process.env["HOME"],
          stdio: "pipe",
          env: process.env,
        },
      );

      // Verify that the cache directory exists and contains the version
      expect(await fs.readdir(packageCacheDir)).toContain(version);
    });
  });
});
