import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { importMetaResolve } from "./import-meta-resolve.ts";

vi.mock("./import-meta-resolve.ts", () => ({
  importMetaResolve: vi
    .fn()
    .mockImplementation(
      (specifier) =>
        `file://${createRequire(import.meta.url).resolve(specifier)}`,
    ),
}));

describe("import-meta-resolve", () => {
  it("corepack bin should be a file", async () => {
    const pkgJsonPath = fileURLToPath(
      importMetaResolve("corepack/package.json"),
    );
    const binPath = JSON.parse(await fs.readFile(pkgJsonPath, "utf8")).bin
      .corepack;

    expect((await fs.stat(pkgJsonPath)).isFile()).toBe(true);
    expect(typeof binPath).toBe("string");
    expect(
      (
        await fs.stat(path.resolve(path.dirname(pkgJsonPath), binPath))
      ).isFile(),
    ).toBe(true);
  });
});
