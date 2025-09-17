import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("pm-cli.cli", () => {
  let originalArgv: string[] = [];

  beforeEach(() => {
    originalArgv = [...process.argv];
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it("should create shim files for npm, yarn, and pnpm when enable-shim is called", async () => {
    // Mock process.argv to simulate "enable-shim" command
    process.argv = [
      "node",
      path.join(os.tmpdir(), "pm-cli.cli.ts"),
      "enable-shim",
    ];

    const argv1 = process.argv[1];
    if (!argv1) throw new Error("process.argv[1] is not defined");
    const installDirectory = path.dirname(argv1);

    const importMetaDirname = path.dirname(fileURLToPath(import.meta.url));
    const shimsDirectory = path.join(importMetaDirname, "shims");

    await import("./pm-cli.cli.ts");
    for (const item of ["npm", "yarn", "pnpm", "npx", "yarnpkg", "pnpx"]) {
      const link = await fs.readlink(path.join(installDirectory, item));
      expect(link).toBe(
        path.relative(
          installDirectory,
          path.join(shimsDirectory, `${item}.cli.ts`),
        ),
      );
    }
  });
});
