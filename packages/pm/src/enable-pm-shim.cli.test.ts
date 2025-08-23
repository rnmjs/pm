import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("enable-pm-shim", () => {
  it("should create shim files for npm, yarn, and pnpm", async () => {
    const argv1 = process.argv[1];
    if (!argv1) throw new Error("process.argv[1] is not defined");
    const installDirectory = path.dirname(argv1);

    const importMetaDirname = path.dirname(fileURLToPath(import.meta.url));
    const shimsDirectory = path.join(importMetaDirname, "shims");

    await import("./enable-pm-shim.cli.ts");
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
