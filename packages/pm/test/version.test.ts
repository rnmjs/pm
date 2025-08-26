import childProcess from "node:child_process";
import path from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";
import { defaultVersions } from "../src/constants.ts";

describe("version", () => {
  it("should print default version for shims", () => {
    for (const packageManager of ["npm", "yarn", "pnpm"] as const) {
      const version = childProcess.execSync(
        `${process.execPath} ${path.join(process.cwd(), "src", "shims", `${packageManager}.cli.ts`)} -v`,
        { cwd: process.env["HOME"], encoding: "utf8" },
      );
      expect(version.trim()).toBe(defaultVersions[packageManager]);
    }
  });

  it("should print version twice for pm", () => {
    const version = childProcess.execSync(
      `${process.execPath} ${path.join(process.cwd(), "src", "pm.cli.ts")} -v`,
      { cwd: process.env["HOME"], encoding: "utf8" },
    );
    expect(version.split(defaultVersions.npm).length).toBe(3);
  });
});
