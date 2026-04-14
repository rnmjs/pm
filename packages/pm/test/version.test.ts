import childProcess from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import corepackPkgJson from "corepack/package.json" with { type: "json" };
import { describe, expect, it } from "vitest";
import { defaultVersions } from "../src/constants.ts";

describe("version", () => {
  it("default versions should be the same as corepack's", () => {
    for (const packageManager of ["npm", "yarn", "pnpm"] as const) {
      const corepackPkgJsonPath = fileURLToPath(
        import.meta.resolve("corepack/package.json"),
      );
      const corepackPath = path.resolve(
        path.dirname(corepackPkgJsonPath),
        corepackPkgJson.bin.corepack,
      );
      const version = childProcess.execSync(
        `${process.execPath} ${corepackPath} ${packageManager} -v`,
        {
          cwd: process.env["HOME"],
          encoding: "utf8",
          env: { COREPACK_DEFAULT_TO_LATEST: "0" },
        },
      );
      expect(version.trim()).toBe(defaultVersions[packageManager]);
    }
  });

  it("should print default version for shims", () => {
    const {
      JRM_MULTISHELL_PATH_OF_NPM: _,
      JRM_MULTISHELL_PATH_OF_YARN: __,
      JRM_MULTISHELL_PATH_OF_PNPM: ___,
      ...cleanEnv
    } = process.env;
    for (const packageManager of ["npm", "yarn", "pnpm"] as const) {
      const version = childProcess.execSync(
        `${process.execPath} ${path.join(process.cwd(), "src", "shims", `${packageManager}.cli.ts`)} -v`,
        {
          cwd: process.env["HOME"],
          encoding: "utf8",
          env: cleanEnv,
        },
      );
      expect(version.trim()).toBe(defaultVersions[packageManager]);
    }
  });

  it("should print version twice for pm", () => {
    const {
      JRM_MULTISHELL_PATH_OF_NPM: _,
      JRM_MULTISHELL_PATH_OF_YARN: __,
      JRM_MULTISHELL_PATH_OF_PNPM: ___,
      ...cleanEnv
    } = process.env;
    const version = childProcess.execSync(
      `${process.execPath} ${path.join(process.cwd(), "src", "bin", "pm.cli.ts")} -v`,
      { cwd: process.env["HOME"], encoding: "utf8", env: cleanEnv },
    );
    expect(version.split(defaultVersions.npm).length).toBe(3);
  });
});
